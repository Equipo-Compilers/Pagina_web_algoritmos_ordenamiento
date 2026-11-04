const API_URL = "https://gutendex.com/books";

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

export class DownloadError extends Error {}

function pickTextUrl(formats: Record<string, string>): string | null {
  const preferred = formats["text/plain; charset=utf-8"];
  
  if (preferred) {
    return preferred;
  }
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

async function fetchPage(url: string, signal?: AbortSignal): Promise<SearchPage> {
  const safeUrl = url.replace(/^http:\/\//, "https://");

  if (!safeUrl.startsWith("https://gutendex.com/")) {
    throw new Error("Dirección de búsqueda no válida.");
  }
  const res = await fetch(safeUrl, { signal });

  if (!res.ok){
    throw new Error(`Gutendex respondió con error ${res.status}.`);
  }
  const data = (await res.json()) as ApiResponse;
  
  return {
    total: data.count,
    books: data.results.map(toBook),
    nextUrl: data.next,
  };
}

export function searchBooks(
  query: string,
  language: string,
  signal?: AbortSignal
): Promise<SearchPage> {
  let url = `${API_URL}?search=${encodeURIComponent(query.trim())}`;
  if (language) url += `&languages=${encodeURIComponent(language)}`;
  return fetchPage(url, signal);
}

export function searchNextPage(nextUrl: string, signal?: AbortSignal): Promise<SearchPage> {
  return fetchPage(nextUrl, signal);
}

export function stripGutenbergLicense(raw: string): string {
  let text = raw.replace(/^﻿/, "");

  const start = /\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n/i.exec(text);
  if (start) text = text.slice(start.index + start[0].length);

  const end = /\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i.exec(text);
  if (end) text = text.slice(0, end.index);

  return text.trim();
}

export async function downloadBookText(
  book: GutenbergBook,
  signal?: AbortSignal
): Promise<string> {
  const candidates = [
    book.textUrl,
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`,
    `https://www.gutenberg.org/ebooks/${book.id}.txt.utf-8`,
  ].filter((u): u is string => u !== null);

  for (const url of [...new Set(candidates)]) {
    try {
      const res = await fetch(url.replace(/^http:\/\//, "https://"), { signal });
      if (res.ok) return stripGutenbergLicense(await res.text());
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }
  throw new DownloadError("No se pudo descargar el texto desde el navegador.");
}

export function bookPageUrl(book: GutenbergBook): string {
  return `https://www.gutenberg.org/ebooks/${book.id}`;
}

export function safeFileName(title: string): string {
  return title.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 50) || "libro";
}