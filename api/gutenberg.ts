// api/gutenberg.ts — función de Vercel que hace de intermediario entre tu página
// y Project Gutenberg / Gutendex. El navegador bloquea (CORS) leer esas páginas
// directamente; este servidor sí puede, y le responde a tu página con los permisos correctos.
//
// Dos usos (solo método GET):
//   /api/gutenberg?q=quijote&lang=es&page=2   -> busca libros (devuelve el JSON de Gutendex)
//   /api/gutenberg?id=2000                    -> devuelve el texto (.txt) del libro 2000
//
// Seguridad: la función NUNCA recibe una dirección de internet. Solo acepta un id numérico
// y un texto de búsqueda, y arma ella misma las direcciones de Gutenberg y Gutendex.

import type { IncomingMessage, ServerResponse } from "node:http";
import { gzipSync } from "node:zlib";

const GUTENDEX_URL = "https://gutendex.com/books";
const MAX_UPSTREAM_BYTES = 25_000_000;
const MAX_RESPONSE_BYTES = 4_400_000;
const UPSTREAM_TIMEOUT_MS = 8_000;
const USER_AGENT = "AlgorithmView-student-project";

class TooLargeError extends Error {}

type Headers = Record<string, string>;

function send(res: ServerResponse, status: number, body: string | Uint8Array, headers: Headers): void {
  res.statusCode = status;
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(body);
}

function sendError(res: ServerResponse, status: number, code: string, headers: Headers): void {
  send(res, status, JSON.stringify({ error: code }), {
    ...headers,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

async function fetchLimited(url: string, allowedHost: string): Promise<Uint8Array | null> {
  const r = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!r.ok) return null;
  if (!new URL(r.url).hostname.endsWith(allowedHost)) return null;

  if (Number(r.headers.get("content-length") ?? 0) > MAX_UPSTREAM_BYTES) throw new TooLargeError();

  const reader = r.body?.getReader();
  if (!reader) return null;
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
  return Buffer.concat(chunks);
}

async function handleBook(req: IncomingMessage, res: ServerResponse, id: string, cors: Headers): Promise<void> {
  if (!/^\d{1,7}$/.test(id)) return sendError(res, 400, "bad_id", cors);

  const candidates = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
  ];

  let raw: Uint8Array | null = null;
  for (const url of candidates) {
    try {
      raw = await fetchLimited(url, "gutenberg.org");
    } catch (err) {
      if (err instanceof TooLargeError) throw err;
      raw = null;
    }
    if (raw) break;
  }
  if (!raw) return sendError(res, 404, "not_found", cors);

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

async function handleSearch(res: ServerResponse, params: URLSearchParams, cors: Headers): Promise<void> {
  const q = (params.get("q") ?? "").trim();
  const lang = params.get("lang") ?? "";
  const page = params.get("page") ?? "";

  if (q.length < 1 || q.length > 100) return sendError(res, 400, "bad_query", cors);
  if (lang !== "" && !/^[a-z]{2}(,[a-z]{2}){0,4}$/.test(lang)) return sendError(res, 400, "bad_lang", cors);
  if (page !== "" && !/^\d{1,4}$/.test(page)) return sendError(res, 400, "bad_page", cors);

  let url = `${GUTENDEX_URL}?search=${encodeURIComponent(q)}`;
  if (lang) url += `&languages=${lang}`;
  if (page) url += `&page=${page}`;

  const r = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  if (r.status === 404) return sendError(res, 404, "not_found", cors);
  if (!r.ok) return sendError(res, 502, "upstream_error", cors);

  send(res, 200, await r.text(), {
    ...cors,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
  });
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
    if (params.get("q") !== null) return await handleSearch(res, params, cors);
    return sendError(res, 400, "bad_request", cors);
  } catch (err) {
    if (err instanceof TooLargeError) return sendError(res, 413, "too_large", cors);
    return sendError(res, 502, "upstream_error", cors);
  }
}