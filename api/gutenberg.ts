import type { IncomingMessage, ServerResponse } from "node:http";
import { gzipSync } from "node:zlib";

const MAX_UPSTREAM_BYTES = 25_000_000;
const MAX_RESPONSE_BYTES = 4_400_000;
const UPSTREAM_TIMEOUT_MS = 12_000;
const USER_AGENT = "AlgorithmView-student-project";

class TooLargeError extends Error {}

type Headers = Record<string, string>;

function send(res: ServerResponse, status: number, body: string | Uint8Array, headers: Headers): void {
  res.statusCode = status;
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(body);
}

function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  headers: Headers,
  extra: Record<string, unknown> = {}
): void {
  send(res, status, JSON.stringify({ error: code, ...extra }), {
    ...headers,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: { code?: string } }).cause;
    return cause?.code ? `${err.name}: ${cause.code}` : `${err.name}: ${err.message}`;
  }
  return "error desconocido";
}

interface UpstreamResult {
  status: number;
  data: Uint8Array | null;
}

async function fetchLimited(url: string, allowedHost: string): Promise<UpstreamResult> {
  const r = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!r.ok) return { status: r.status, data: null };
  if (!new URL(r.url).hostname.endsWith(allowedHost)) return { status: 0, data: null };

  if (Number(r.headers.get("content-length") ?? 0) > MAX_UPSTREAM_BYTES) throw new TooLargeError();

  const reader = r.body?.getReader();
  if (!reader) return { status: 0, data: null };
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_UPSTREAM_BYTES) {
      await reader.cancel();
      throw new TooLargeError();
    }
    chunks.push(value);
  }
  return { status: 200, data: Buffer.concat(chunks) };
}

async function handleBook(req: IncomingMessage, res: ServerResponse, id: string, cors: Headers): Promise<void> {
  if (!/^\d{1,7}$/.test(id)) return sendError(res, 400, "bad_id", cors);

  const candidates = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
  ];

  let raw: Uint8Array | null = null;
  const statuses: number[] = [];
  for (const url of candidates) {
    try {
      const result = await fetchLimited(url, "gutenberg.org");
      statuses.push(result.status);
      raw = result.data;
    } catch (err) {
      if (err instanceof TooLargeError) throw err;
      statuses.push(0);
      raw = null;
    }
    if (raw) break;
  }
  if (!raw) {
    if (statuses.every((s) => s === 404)) return sendError(res, 404, "not_found", cors);
    return sendError(res, 502, "upstream_error", cors, { upstream: statuses });
  }

  const acceptsGzip = /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""));
  const body = acceptsGzip ? gzipSync(raw) : raw;
  if (body.length > MAX_RESPONSE_BYTES) return sendError(res, 413, "too_large", cors);

  const headers: Headers = {
    ...cors,
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
  };
  if (acceptsGzip) headers["Content-Encoding"] = "gzip";
  send(res, 200, body, headers);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const cors: Headers = { Vary: "Origin, Accept-Encoding" };
  const origin = String(req.headers.origin ?? "");
  const allowed = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (origin !== "" && allowed.includes(origin)) {
    cors["Access-Control-Allow-Origin"] = origin;
    cors["Access-Control-Allow-Methods"] = "GET, OPTIONS";
  }

  if (req.method === "OPTIONS") return send(res, 204, "", cors);
  if (req.method !== "GET") return sendError(res, 405, "method_not_allowed", cors);

  const params = new URL(req.url ?? "/", "http://localhost").searchParams;

  try {
    const id = params.get("id");
    if (id !== null) return await handleBook(req, res, id, cors);
    return sendError(res, 400, "bad_request", cors);
  } catch (err) {
    if (err instanceof TooLargeError) return sendError(res, 413, "too_large", cors);
    return sendError(res, 502, "upstream_error", cors, { detail: describeError(err) });
  }
}