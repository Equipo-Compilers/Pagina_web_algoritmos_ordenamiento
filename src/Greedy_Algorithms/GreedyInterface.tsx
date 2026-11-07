import { useMemo, useState } from "react";
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
import GutenbergSearch from "./GutenbergSearch";
import HuffmanTreeAnimation from "./hooks/HuffmanTreeAnimation";
import { animationDataFromText } from "./algorithms/HuffmanAnimationFromText";
import "./GreedyInterface.css";

export default function HuffmanInterface() {
  const [fileName, setFileName] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [compressed, setCompressed] = useState<Uint8Array | null>(null);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState(0);

  const [iaaFile, setIaaFile] = useState<File | null>(null);
  const [iaaError, setIaaError] = useState<string>("");
  const [iaaResult, setIaaResult] = useState<string>("");

  const animationData = useMemo(() => (compressed ? animationDataFromText(text) : null), [compressed, text]);

  function loadText(content: string, name: string) {
    setError("");
    setCompressed(null);
    setStats(null);
    setText(content);
    setFileName(name);
  }

  async function handleTxtSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readTextFile(file);
      loadText(content, file.name.replace(/\.txt$/i, ""));
    } catch {
      setError("No se pudo leer el archivo.");
    }
  }

  function handleCompress() {
    const result = compress(text);
    setCompressed(result);
    setStep(0);
    setStats(getStats(text, result));
  }

  function handleDownloadCompressed() {
    if (!compressed) return;
    downloadBytes(compressed, `${fileName}.iaa`);
  }

  function handleHuffSelected(e: ChangeEvent<HTMLInputElement>) {
    setIaaFile(e.target.files?.[0] ?? null);
    setIaaError("");
    setIaaResult("");
  }

  async function handleDecompress() {
    if (!iaaFile) return;

    setIaaError("");
    setIaaResult("");
    try {
      const bytes = new Uint8Array(await iaaFile.arrayBuffer());
      const original = decompress(bytes);

      const outBytes = new TextEncoder().encode(original);
      const outName = `${iaaFile.name.replace(/\.iaa$/i, "")}_recuperado.txt`;
      downloadBytes(outBytes, outName);
      setIaaResult(`Se descomprimió "${iaaFile.name}": ${outBytes.length.toLocaleString()} bytes. Se descargó "${outName}".`);
    } catch {
      setIaaError("El archivo no es un .iaa válido.");
    }
  }

  return (
    <div className="huffman-page">
      <Link to="/" className="huffman-back">← Volver</Link>
      <h1>Compresor de libros de Project Gutenberg </h1>

      {error && <p className="huffman-error">{error}</p>}

      <GutenbergSearch onTextLoaded={loadText} />

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

      {animationData && (
        <section className="huffman-section tree-anim-host">
          <h2> Construcción del árbol de Huffman</h2>
          <HuffmanTreeAnimation data={animationData} step={step} onStepChange={setStep} showCodes />
        </section>
      )}

      <section className="huffman-section">
        <h2> Recuperar un .iaa</h2>
        <input type="file" accept=".iaa" onChange={handleHuffSelected} />

        {iaaFile && (
          <>
            <p>
              Archivo cargado: "{iaaFile.name}" ({iaaFile.size.toLocaleString()} bytes)
            </p>
            <button onClick={handleDecompress}>Descomprimir y descargar .txt</button>
          </>
        )}

        {iaaError && <p className="huffman-error">{iaaError}</p>}
        {iaaResult && <p>{iaaResult}</p>}
      </section>
    </div>
  );
}