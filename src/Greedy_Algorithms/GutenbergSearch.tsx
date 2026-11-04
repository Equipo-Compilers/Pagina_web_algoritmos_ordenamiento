import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  searchBooks,
  searchNextPage,
  downloadBookText,
  bookPageUrl,
  safeFileName,
  DownloadError,
} from "./algorithms/Gutenberg";

import type { GutenbergBook } from "./algorithms/Gutenberg";
import "./GutenbergSearch.css";

interface GutenbergSearchProps {
  onTextLoaded: (text: string, name: string) => void;
}

export default function GutenbergSearch({ onTextLoaded }: GutenbergSearchProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [books, setBooks] = useState<GutenbergBook[]>([]);
  const [total, setTotal] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [failedBook, setFailedBook] = useState<GutenbergBook | null>(null);
  const [loadedTitle, setLoadedTitle] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setFailedBook(null);
    try {
      const page = await searchBooks(query, language, controller.signal);
      setBooks(page.books);
      setTotal(page.total);
      setNextUrl(page.nextUrl);
      setSearched(true);
    } catch {
      if (controller.signal.aborted) return;
      setError("No se pudo buscar. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function handleMore() {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const page = await searchNextPage(nextUrl);
      setBooks((prev) => [...prev, ...page.books]);
      setNextUrl(page.nextUrl);
    } catch {
      setError("No se pudieron cargar más resultados.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePick(book: GutenbergBook) {
    setDownloadingId(book.id);
    setError("");
    setFailedBook(null);
    try {
      const text = await downloadBookText(book);
      onTextLoaded(text, safeFileName(book.title));
      setLoadedTitle(book.title);
    } catch (err) {
      if (err instanceof DownloadError) {
        setFailedBook(book);
      } else {
        setError("Ocurrió un error al descargar el libro.");
      }
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="gutenberg-section">
      <h2>Buscar un libro en Project Gutenberg</h2>

      <form className="gutenberg-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Título o autor (ej. quijote, dickens)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">Todos los idiomas</option>
          <option value="es">Español</option>
          <option value="en">Inglés</option>
          <option value="fr">Francés</option>
          <option value="de">Alemán</option>
          <option value="it">Italiano</option>
        </select>
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <p className="gutenberg-error">{error}</p>}

      {failedBook && (
        <div className="gutenberg-fallback">
          <p>
            El navegador no permitió descargar "{failedBook.title}" automáticamente.
            Descárgalo tú: abre el libro en Gutenberg, elige "Plain Text UTF-8", guárdalo
            y súbelo con el selector de archivos de abajo.
          </p>
          <a href={bookPageUrl(failedBook)} target="_blank" rel="noreferrer">
            Abrir en Gutenberg
          </a>
        </div>
      )}

      {loadedTitle && (
        <p className="gutenberg-ok">Libro cargado: "{loadedTitle}". Ya puedes comprimirlo.</p>
      )}

      {searched && books.length === 0 && !loading && (
        <p>No se encontraron libros con esa búsqueda.</p>
      )}

      {books.length > 0 && (
        <>
          <p className="gutenberg-count">
            Mostrando {books.length} de {total.toLocaleString()} resultados
          </p>
          <ul className="gutenberg-list">
            {books.map((book) => (
              <li key={book.id} className="gutenberg-item">
                <div className="gutenberg-item-info">
                  <strong>{book.title}</strong>
                  <span>{book.authors.join(", ") || "Autor desconocido"}</span>
                  <span className="gutenberg-meta">
                    {book.languages.join(", ")} · {book.downloadCount.toLocaleString()} descargas
                  </span>
                </div>
                <button
                  onClick={() => handlePick(book)}
                  disabled={downloadingId !== null}
                >
                  {downloadingId === book.id ? "Descargando..." : "Usar este libro"}
                </button>
              </li>
            ))}
          </ul>

          {nextUrl && (
            <button className="gutenberg-more" onClick={handleMore} disabled={loading}>
              {loading ? "Cargando..." : "Más resultados"}
            </button>
          )}
        </>
      )}
    </section>
  );
}