const API_BASE = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? "").replace(/\/+$/, "");
const PROXY_URL = `${API_BASE}/api/gutenberg`;
const GUTENDEX_URL = "https://gutendex.com/books";

export interface GutenbergBook {
  id: number;
  title: string;
  authors: string[];
  languages: string[];
  downloadCount: number;
  textUrl: string | null;
}

export interface SearchPage {
  total: number;
  books: GutenbergBook[];
  nextUrl: string | null;
}

interface ApiBook {
  id: number;
  title: string;
  authors: { name: string }[];
  languages: string[];
  download_count: number;
  formats: Record<string, string>;
}
interface ApiResponse {
  count: number;
  next: string | null;
  results: ApiBook[];
}

export class DownloadError extends Error {
  reasons: string[] = [];
}

function pickTextUrl(formats: Record<string, string>): string | null {
  const preferred = formats["text/plain; charset=utf-8"];
  if (preferred) return preferred;
  const key = Object.keys(formats).find((k) => k.startsWith("text/plain"));
  return key ? formats[key] : null;
}

function toBook(b: ApiBook): GutenbergBook {
  return {
    id: b.id,
    title: b.title,
    authors: b.authors.map((a) => a.name),
    languages: b.languages,
    downloadCount: b.download_count,
    textUrl: pickTextUrl(b.formats),
  };
}

async function fetchSearch(urls: string[], signal?: AbortSignal): Promise<SearchPage> {
  const reasons: string[] = [];
  for (const url of urls) {
    const label = url.startsWith(PROXY_URL) ? "función de Vercel" : "directo a Gutendex";
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        let body = "";
        try {
          body = (await res.text()).slice(0, 150);
        } catch {
          body = "";
        }
        reasons.push(`${label}: HTTP ${res.status} ${body}`.trim());
        continue;
      }
      if ((res.headers.get("content-type") ?? "").includes("text/html")) {
        reasons.push(`${label}: devolvió una página web en vez de datos`);
        continue;
      }
      const data = (await res.json()) as ApiResponse;
      return { total: data.count, books: data.results.map(toBook), nextUrl: data.next };
    } catch (err) {
      if (signal?.aborted) throw err;
      reasons.push(`${label}: el navegador bloqueó la petición (CORS) o no hay conexión`);
    }
  }
  throw new Error(`No se pudo consultar el catálogo. ${reasons.join(" | ")}`);
}

function searchUrls(query: string, language: string, page: string): string[] {
  const proxy = new URLSearchParams({ q: query });
  const direct = new URLSearchParams({ search: query });
  if (language) {
    proxy.set("lang", language);
    direct.set("languages", language);
  }
  if (page) {
    proxy.set("page", page);
    direct.set("page", page);
  }
  return [`${PROXY_URL}?${proxy}`, `${GUTENDEX_URL}?${direct}`];
}

export function searchBooks(query: string, language: string, signal?: AbortSignal): Promise<SearchPage> {
  return fetchSearch(searchUrls(query.trim(), language, ""), signal);
}

export function searchNextPage(nextUrl: string, signal?: AbortSignal): Promise<SearchPage> {
  const next = new URL(nextUrl.replace(/^http:\/\//, "https://"));
  if (next.origin !== "https://gutendex.com") throw new Error("Dirección de búsqueda no válida.");
  return fetchSearch(
    searchUrls(
      next.searchParams.get("search") ?? "",
      next.searchParams.get("languages") ?? "",
      next.searchParams.get("page") ?? ""
    ),
    signal
  );
}

export function stripGutenbergLicense(raw: string): string {
  let text = raw.replace(/^﻿/, "");

  const start = /\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n/i.exec(text);
  if (start) text = text.slice(start.index + start[0].length);

  const end = /\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i.exec(text);
  if (end) text = text.slice(0, end.index);

  return text.trim();
}

async function describeProxyFailure(res: Response): Promise<string> {
  let info: { error?: string; upstream?: unknown } | null = null;
  try {
    info = (await res.json()) as { error?: string; upstream?: unknown };
  } catch {
    info = null;
  }
  if (res.status === 404 && info?.error === "not_found") return "Gutenberg no tiene este libro en formato de texto (404)";
  if (res.status === 404) return "la función /api/gutenberg no existe en este sitio (404): no está desplegada o la página no está en Vercel";
  if (res.status === 413) return "el libro es demasiado grande para la función de Vercel (límite de 4,5 MB)";
  if (info?.error === "upstream_error") {
    return `la función no pudo leer Gutenberg (Gutenberg respondió: ${JSON.stringify(info.upstream)}; 0 = sin respuesta, 403/429 = nos rechazó)`;
  }
  return `la función respondió HTTP ${res.status}`;
}

export async function downloadBookText(book: GutenbergBook, signal?: AbortSignal): Promise<string> {
  const attempts: { label: string; url: string }[] = [{ label: "función de Vercel", url: `${PROXY_URL}?id=${book.id}` }];
  for (const url of [book.textUrl, `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`]) {
    if (url !== null && !attempts.some((a) => a.url === url)) attempts.push({ label: "directo a Gutenberg", url });
  }

  const reasons: string[] = [];
  for (const { label, url } of attempts) {
    try {
      const res = await fetch(url.replace(/^http:\/\//, "https://"), { signal });
      if (!res.ok) {
        reasons.push(`${label}: ${label === "función de Vercel" ? await describeProxyFailure(res) : `Gutenberg respondió HTTP ${res.status}`}`);
        continue;
      }
      if ((res.headers.get("content-type") ?? "").includes("text/html")) {
        reasons.push(`${label}: devolvió una página web en vez del libro (la dirección no es una función ni un archivo de texto)`);
        continue;
      }
      return stripGutenbergLicense(await res.text());
    } catch (err) {
      if (signal?.aborted) throw err;
      reasons.push(`${label}: el navegador bloqueó la petición (CORS) o no hay conexión`);
    }
  }

  const error = new DownloadError("No se pudo descargar el texto automáticamente.");
  error.reasons = reasons;
  throw error;
}

export function bookPageUrl(book: GutenbergBook): string {
  return `https://www.gutenberg.org/ebooks/${book.id}`;
}

export function safeFileName(title: string): string {
  return title.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 50) || "libro";
}