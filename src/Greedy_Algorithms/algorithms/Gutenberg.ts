const API_BASE = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? "").replace(/\/+$/, "");
const PROXY_URL = `${API_BASE}/api/gutenberg`;

const CATALOG_URL = `${(import.meta.env?.BASE_URL as string | undefined) ?? "/"}catalog.json`;
const PAGE_SIZE = 32;

export interface GutenbergBook {
  id: number;
  title: string;
  authors: string[];
  languages: string[];
}

export interface SearchPage {
  total: number;
  books: GutenbergBook[];
  nextPage: number | null;
}

export class DownloadError extends Error {
  reasons: string[] = [];
}

type CatalogRow = [number, string, string, string];

interface CatalogEntry extends GutenbergBook {
  titleNorm: string;
  hay: string;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

let catalogPromise: Promise<CatalogEntry[]> | null = null;

async function fetchCatalog(): Promise<CatalogEntry[]> {
  let res: Response;
  try {
    res = await fetch(CATALOG_URL);
  } catch {
    throw new Error("No se pudo cargar el catálogo de libros (sin conexión).");
  }
  const notFound =
    "No se encontró el catálogo de libros (catalog.json). Genéralo con «node scripts/build-catalog.mjs», colócalo en la carpeta public/ y vuelve a desplegar.";
  if (!res.ok || (res.headers.get("content-type") ?? "").includes("text/html")) throw new Error(notFound);

  const data = (await res.json()) as { books?: CatalogRow[] };
  if (!Array.isArray(data.books)) throw new Error("El archivo catalog.json no tiene el formato esperado.");

  return data.books.map(([id, title, authors, langs]) => {
    const authorList = authors ? authors.split(";").map((a) => a.trim()).filter(Boolean) : [];
    const titleNorm = normalize(title);
    return {
      id,
      title,
      authors: authorList,
      languages: langs ? langs.split(";") : [],
      titleNorm,
      hay: `${titleNorm} ${normalize(authorList.join(" "))}`,
    };
  });
}

function loadCatalog(): Promise<CatalogEntry[]> {
  if (!catalogPromise) {
    catalogPromise = fetchCatalog().catch((err) => {
      catalogPromise = null;
      throw err;
    });
  }
  return catalogPromise;
}

export async function searchBooks(query: string, language: string, page = 1): Promise<SearchPage> {
  const catalog = await loadCatalog();
  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return { total: 0, books: [], nextPage: null };

  const phrase = tokens.join(" ");
  const matches: { entry: CatalogEntry; score: number }[] = [];
  for (const entry of catalog) {
    if (language !== "" && !entry.languages.includes(language)) continue;
    if (!tokens.every((t) => entry.hay.includes(t))) continue;
    let score = 0;
    if (entry.titleNorm.includes(phrase)) score += 4;
    if (entry.titleNorm.startsWith(phrase)) score += 2;
    const padded = ` ${entry.titleNorm}`;
    for (const t of tokens) if (padded.includes(` ${t}`)) score += 1;
    matches.push({ entry, score });
  }

  matches.sort((a, b) => b.score - a.score || a.entry.id - b.entry.id);

  const start = (page - 1) * PAGE_SIZE;
  const books = matches.slice(start, start + PAGE_SIZE).map(({ entry }) => ({
    id: entry.id,
    title: entry.title,
    authors: entry.authors,
    languages: entry.languages,
  }));
  return { total: matches.length, books, nextPage: start + PAGE_SIZE < matches.length ? page + 1 : null };
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
  const attempts = [
    { label: "función de Vercel", url: `${PROXY_URL}?id=${book.id}` },
    { label: "directo a Gutenberg", url: `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt` },
  ];

  const reasons: string[] = [];
  for (const { label, url } of attempts) {
    try {
      const res = await fetch(url, { signal });
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