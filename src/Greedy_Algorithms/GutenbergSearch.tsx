import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  searchBooks,
  downloadBookText,
  bookPageUrl,
  safeFileName,
  DownloadError,
} from "./algorithms/Gutenberg";
import type { GutenbergBook } from "./algorithms/Gutenberg";
import "./GutenbergSearch.css";

interface GutenbergSearchProps {
  onTextLoaded: (text: string, name: string) => void;
  textoProcesado?: string; // Recibe el resultado ya comprimido/procesado desde el componente padre
}

export default function GutenbergSearch({ onTextLoaded, textoProcesado = "" }: GutenbergSearchProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [books, setBooks] = useState<GutenbergBook[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [lastSearch, setLastSearch] = useState({ query: "", language: "" });
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [failedBook, setFailedBook] = useState<GutenbergBook | null>(null);
  const [failReasons, setFailReasons] = useState<string[]>([]);
  const [loadedTitle, setLoadedTitle] = useState("");

  const searchIdRef = useRef(0);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const searchId = ++searchIdRef.current;
    setLoading(true);
    setError("");
    setFailedBook(null);
    try {
      const page = await searchBooks(query, language);
      if (searchId !== searchIdRef.current) return;
      setBooks(page.books);
      setTotal(page.total);
      setNextPage(page.nextPage);
      setLastSearch({ query, language });
      setSearched(true);
    } catch (err) {
      if (searchId !== searchIdRef.current) return;
      setError(err instanceof Error ? err.message : "No se pudo buscar. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      if (searchId === searchIdRef.current) setLoading(false);
    }
  }

  async function handleMore() {
    if (nextPage === null) return;
    setLoading(true);
    try {
      const page = await searchBooks(lastSearch.query, lastSearch.language, nextPage);
      setBooks((prev) => [...prev, ...page.books]);
      setNextPage(page.nextPage);
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
        setFailReasons(err.reasons);
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
            No se pudo descargar "{failedBook.title}" automáticamente. Descárgalo tú: abre el libro
            en Gutenberg, elige "Plain Text UTF-8", guárdalo y súbelo con el selector de archivos de abajo.
          </p>
          {failReasons.length > 0 && (
            <ul className="gutenberg-reasons">
              {failReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}
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
                    {book.languages.join(", ") || "idioma desconocido"} · n.º {book.id}
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

          {nextPage !== null && (
            <button className="gutenberg-more" onClick={handleMore} disabled={loading}>
              {loading ? "Cargando..." : "Más resultados"}
            </button>
          )}
        </>
      )}

      {/* SECCIÓN CORREGIDA: Muestra siempre el cuadro si hay texto procesado o da un aviso visual */}
      <div className="gutenberg-preview-box">
        <h3>Resultado Procesado / Comprimido:</h3>
        <textarea
          className="gutenberg-textarea-preview"
          value={textoProcesado}
          readOnly
          rows={8}
          placeholder="El resultado del texto comprimido aparecerá aquí una vez que el proceso finalice..."
        />
        {textoProcesado && (
          <p className="gutenberg-meta-info">
            Tamaño del resultado: {textoProcesado.length.toLocaleString()} caracteres.
          </p>
        )}
      </div>
    </section>
  );
}