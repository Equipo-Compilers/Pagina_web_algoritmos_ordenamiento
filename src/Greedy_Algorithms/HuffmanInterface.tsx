import "./HuffmanInterface.css";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { comprimir, descomprimir, nombreSimbolo } from "./algorithms/Huffman";
import type { NodoHuffman, ResultadoCompresion } from "./algorithms/Huffman";
import HuffmanTreeAnimation from "./hooks/HuffmanTreeAnimation";
import { animationDataFromResult } from "./algorithms/HuffmanAnimationFromResult";

function descargar(bytes: Uint8Array, nombre: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([bytes.slice()], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function iguales(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function etiqueta(n: NodoHuffman): string {
  return n.simbolo !== null ? `'${nombreSimbolo(n.simbolo)}' (${n.frecuencia})` : `nodo (${n.frecuencia})`;
}

export default function HoffmanInterface() {
  const [texto, setTexto] = useState("");
  const [bytesArchivo, setBytesArchivo] = useState<Uint8Array | null>(null);
  const [original, setOriginal] = useState<Uint8Array | null>(null);
  const [resultado, setResultado] = useState<ResultadoCompresion | null>(null);
  const [paso, setPaso] = useState(0);
  const [recuperado, setRecuperado] = useState<{ bytes: Uint8Array; texto: string } | null>(null);
  const [error, setError] = useState("");

  const animationData = useMemo(() => (resultado ? animationDataFromResult(resultado) : null), [resultado]);

  const manejarCargarTxt = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    setBytesArchivo(bytes);
    setTexto(new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes));
    e.target.value = "";
  };

  const manejarComprimir = () => {
    const bytes = bytesArchivo ?? new TextEncoder().encode(texto);
    if (bytes.length === 0) {
      setError("Escribe o carga un texto primero.");
      return;
    }
    const r = comprimir(bytes);
    setOriginal(bytes);
    setResultado(r);
    setPaso(0);
    setRecuperado(null);
    setError("");
  };

  const mostrarRecuperado = (comprimido: Uint8Array) => {
    try {
      const bytes = descomprimir(comprimido);
      setRecuperado({ bytes, texto: new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes) });
      setError("");
    } catch (err) {
      setRecuperado(null);
      setError(err instanceof Error ? err.message : "No se pudo descomprimir.");
    }
  };

  const manejarCargarHuff = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    mostrarRecuperado(new Uint8Array(await archivo.arrayBuffer()));
    e.target.value = "";
  };

  const filas = resultado
    ? [...resultado.frecuencias.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
    : [];

  const coincide = original && recuperado ? iguales(original, recuperado.bytes) : null;
  const ahorro = resultado && original ? (1 - resultado.archivo.length / original.length) * 100 : 0;

  return (
    <div className="huffContenedor">
      <Link to="/" className="huffman-back">← Volver</Link>
      <h1 className="huffTitulo">Algoritmo de Huffman</h1>

      <div className="huffGrid">
        <section className="huffPanel">
          <h2>1. Texto de entrada</h2>
          <textarea
            className="huffTextarea"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setBytesArchivo(null);
            }}
            placeholder="Escribe un texto o carga un .txt"
          />
          <div className="huffBotones">
            <label className="huffBoton">
              cargar .txt
              <input type="file" accept=".txt,text/plain" onChange={manejarCargarTxt} hidden />
            </label>
            <button className="huffBoton" onClick={manejarComprimir}>
              comprimir
            </button>
          </div>
          {error && <p className="huffError">{error}</p>}
        </section>

        {resultado && original && (
          <section className="huffPanel">
            <h2>Resultado de la compresión</h2>
            <div>Tamaño original: <strong>{original.length} bytes</strong> ({original.length * 8} bits)</div>
            <div>Bits codificados: <strong>{resultado.bitsTotales}</strong></div>
            <div>Archivo .iaa (con cabecera): <strong>{resultado.archivo.length} bytes</strong></div>
            <div>
              {ahorro >= 0 ? "Ahorro" : "Aumento"}: <strong>{Math.abs(ahorro).toFixed(1)}%</strong>
            </div>
            <div className="huffBits">{resultado.vistaBits}</div>
            <div className="huffBotones">
              <button className="huffBoton" onClick={() => descargar(resultado.archivo, "comprimido.iaa", "application/octet-stream")}>
                descargar .iaa
              </button>
              <button className="huffBoton" onClick={() => mostrarRecuperado(resultado.archivo)}>
                descomprimir este
              </button>
            </div>
          </section>
        )}
      </div>

      {resultado && (
        <>
          <div className="huffGrid">
            <section className="huffPanel">
              <h2>2. Frecuencias y 3. códigos</h2>
              <div className="huffTablaScroll">
                <table className="huffTabla">
                  <thead>
                    <tr><th>Símbolo</th><th>Frecuencia</th><th>Código</th><th>Bits</th></tr>
                  </thead>
                  <tbody>
                    {filas.map(([s, f]) => {
                      const codigo = resultado.codigos.get(s)!;
                      return (
                        <tr key={s}>
                          <td>{nombreSimbolo(s)}</td>
                          <td>{f}</td>
                          <td className="huffCodigo">{codigo}</td>
                          <td>{f * codigo.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="huffPanel">
              <h2>Pasos voraces</h2>
              <div className="huffTablaScroll">
                {resultado.pasos.length === 0 && <p>Solo hay un símbolo, no hay uniones.</p>}
                {resultado.pasos.map((p, i) => (
                  <div key={p.nuevo.id} className={`huffPaso ${i < paso ? "huffPaso-hecho" : ""}`}>
                    {i + 1}. {etiqueta(p.izq)} + {etiqueta(p.der)} → {p.nuevo.frecuencia}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="huffPanel">
            <h2>Construcción del árbol (izquierda = 0, derecha = 1)</h2>
            {animationData && <HuffmanTreeAnimation data={animationData} step={paso} onStepChange={setPaso} />}
          </section>

          {/* CUADRO PARA MOSTRAR Y LEER EL TEXTO PROCESADO / RECUPERADO DESPUÉS DE LAS GRÁFICAS */}
          <section className="huffPanel">
            <h2>Texto Procesado / Comprimido</h2>
            <p className="text-xs text-purple-400 mb-3" style={{ color: "#b794f4", fontSize: "0.85rem", marginBottom: "8px" }}>
              Resultado final del texto procesado:
            </p>
            <textarea
              className="huffTextarea"
              value={recuperado ? recuperado.texto : texto}
              readOnly
              placeholder="El texto procesado aparecerá aquí una vez que se cargue o descomprima..."
              rows={8}
              style={{ width: "100%", fontFamily: "monospace", resize: "vertical" }}
            />
            <div className="flex justify-between items-center mt-2 text-xs" style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.85rem", color: "#b794f4" }}>
              <span>Caracteres: {recuperado ? recuperado.texto.length.toLocaleString() : texto.length.toLocaleString()}</span>
              <span>Listo para leer o copiar</span>
            </div>
          </section>
        </>
      )}

      <section className="huffPanel">
        <h2>6. Descomprimir un archivo .iaa</h2>
        <div className="huffBotones">
          <label className="huffBoton">
            cargar .iaa
            <input type="file" accept=".iaa" onChange={manejarCargarHuff} hidden />
          </label>
          {recuperado && (
            <button className="huffBoton" onClick={() => descargar(recuperado.bytes, "recuperado.txt", "text/plain")}>
              descargar .txt recuperado
            </button>
          )}
        </div>
        {recuperado && (
          <>
            <pre className="huffRecuperado">{recuperado.texto}</pre>
            <div>Bytes recuperados: <strong>{recuperado.bytes.length}</strong></div>
            {coincide !== null && (
              <div className={coincide ? "huffOk" : "huffError"}>
                {coincide ? "✔ Idéntico al texto original" : "✘ No coincide con el original"}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}