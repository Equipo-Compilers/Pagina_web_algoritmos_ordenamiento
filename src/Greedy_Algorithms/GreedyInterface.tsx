import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  compress,
  decompress,
  getStats,
  readTextFile,
  downloadBytes,
} from "./algorithms/HuffmanCompresor";
import type { CompressionStats } from "./algorithms/HuffmanCompresor";
import "./Greedyinterface.css";

export default function HuffmanInterface() {
  const [fileName, setFileName] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [compressed, setCompressed] = useState<Uint8Array | null>(null);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [error, setError] = useState<string>("");

  async function handleTxtSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setCompressed(null);
    setStats(null);

    try {
      const content = await readTextFile(file);
      setText(content);
      setFileName(file.name.replace(/\.txt$/i, ""));
    } catch {
      setError("No se pudo leer el archivo.");
    }
  }

  function handleCompress() {
    const result = compress(text);
    setCompressed(result);
    setStats(getStats(text, result));
  }

  function handleDownloadCompressed() {
    if (!compressed) return;
    downloadBytes(compressed, `${fileName}.iaa`);
  }

  async function handleHuffSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const original = decompress(bytes);

      const outBytes = new TextEncoder().encode(original);
      downloadBytes(outBytes, `${file.name.replace(/\.huff$/i, "")}_recuperado.txt`);
    } catch {
      setError("El archivo no es un .iaa válido.");
    }
  }

  return (
    <div className="huffman-page">
      <Link to="/" className="huffman-back">← Volver</Link>
      <h1>Compresor de archivos </h1>

      {error && <p className="huffman-error">{error}</p>}

      <section className="huffman-section">
        <h2> Comprimir un .txt</h2>
        <input type="file" accept=".txt,text/plain" onChange={handleTxtSelected} />

        {text && (
          <button onClick={handleCompress}>
            Comprimir "{fileName}.txt"
          </button>
        )}

        {stats && compressed && (
          <div className="huffman-results">
            <p>Tamaño original: {stats.originalBytes.toLocaleString()} bytes</p>
            <p>Tamaño comprimido: {stats.compressedBytes.toLocaleString()} bytes</p>
            <p>Ahorro: {stats.savedPercent.toFixed(1)}%</p>

            {stats.savedPercent < 0 && (
              <p className="huffman-warning">
                El archivo es muy pequeño: la tabla de frecuencias pesa más de lo que se ahorra.
                Prueba con un texto más largo.
              </p>
            )}

            <button onClick={handleDownloadCompressed}>Descargar .iaa</button>
          </div>
        )}
      </section>

      <section className="huffman-section">
        <h2>Comprimir desde Project Gutemberg</h2>

      </section>

      <section className="huffman-section">
        <h2> Recuperar un .iaa</h2>
        <input type="file" accept=".iaa" onChange={handleHuffSelected} />
      </section>
    </div>
  );
}