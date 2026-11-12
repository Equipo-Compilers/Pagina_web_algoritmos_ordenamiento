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

  // Estado para la vista previa del .iaa recién comprimido
  const [compressedPreview, setCompressedPreview] = useState<string>("");

  // NUEVO: Estado para guardar el texto ya descomprimido del .iaa antes de descargarlo
  const [decompressedPreview, setDecompressedPreview] = useState<string>("");
  const [recoveredFileName, setRecoveredFileName] = useState<string>("");

  const animationData = useMemo(() => (compressed ? animationDataFromText(text) : null), [compressed, text]);

  function loadText(content: string, name: string) {
    setError("");
    setCompressed(null);
    setStats(null);
    setCompressedPreview("");
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

    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(result);
    setCompressedPreview(rawText);
  }

  function handleDownloadCompressed() {
    if (!compressed) return;
    downloadBytes(compressed, `${fileName}.iaa`);
  }

  // MODIFICADO: Al cargar el .iaa limpiamos la vista previa anterior
  function handleHuffSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setIaaFile(file);
    setIaaError("");
    setIaaResult("");
    setDecompressedPreview("");
    if (file) {
      setRecoveredFileName(file.name.replace(/\.iaa$/i, ""));
    }
  }

  // MODIFICADO: Descomprimimos y cargamos en el visor de texto antes de descargar
  async function handleDecompressPreview() {
    if (!iaaFile) return;

    setIaaError("");
    setIaaResult("");
    try {
      const bytes = new Uint8Array(await iaaFile.arrayBuffer());
      const original = decompress(bytes);

      // Guardamos el texto descomprimido para que aparezca en el lector
      setDecompressedPreview(original);
      setIaaResult(`Se leyó y descomprimió "${iaaFile.name}" con éxito (${original.length.toLocaleString()} caracteres).`);
    } catch {
      setIaaError("El archivo no es un .iaa válido.");
      setDecompressedPreview("");
    }
  }

  function handleDownloadRecovered() {
    if (!decompressedPreview) return;
    const outBytes = new TextEncoder().encode(decompressedPreview);
    const outName = `${recoveredFileName}_recuperado.txt`;
    downloadBytes(outBytes, outName);
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

            <h3 style={{ marginTop: "1rem" }}>📄 Lector del archivo .iaa generado:</h3>
            <textarea
              readOnly
              value={compressedPreview}
              rows={8}
              placeholder="Contenido crudo del .iaa..."
              style={{
                width: "100%",
                padding: "10px",
                fontFamily: "monospace",
                fontSize: "12px",
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                borderRadius: "4px",
                resize: "vertical",
                marginBottom: "10px",
              }}
            />

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
        <h2> Recuperar y leer un .iaa</h2>
        <input type="file" accept=".iaa" onChange={handleHuffSelected} />

        {iaaFile && (
          <div className="huffman-results" style={{ marginTop: "1rem" }}>
            <p>
              <strong>Archivo cargado:</strong> "{iaaFile.name}" ({iaaFile.size.toLocaleString()} bytes)
            </p>
            <button onClick={handleDecompressPreview}>Descomprimir y ver contenido</button>
          </div>
        )}

        {iaaError && <p className="huffman-error">{iaaError}</p>}
        {iaaResult && <p>{iaaResult}</p>}

        {/* NUEVO: Lector del texto ya descomprimido antes de descargar el .txt */}
        {decompressedPreview && (
          <div className="huffman-results" style={{ marginTop: "1rem" }}>
            <h3>📖 Lector del texto descomprimido:</h3>
            <textarea
              readOnly
              value={decompressedPreview}
              rows={10}
              style={{
                width: "100%",
                padding: "10px",
                fontFamily: "monospace",
                fontSize: "12px",
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                borderRadius: "4px",
                resize: "vertical",
                marginBottom: "10px",
              }}
            />
            <button onClick={handleDownloadRecovered}>
              Descargar archivo .txt recuperado
            </button>
          </div>
        )}
      </section>
    </div>
  );
}