import "./HoffmanInterface.css";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { comprimir, descomprimir, nombreSimbolo } from "./algorithms/Huffman";
import type { NodoHuffman, ResultadoCompresion } from "./algorithms/Huffman";

const EX = 56; 
const EY = 70; 
const R = 19; 
const PAD = 30;

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

// Dibuja uno o varios árboles lado a lado (el "bosque" del algoritmo voraz)
function Bosque({ raices }: { raices: NodoHuffman[] }) {
  const nodos: { n: NodoHuffman; x: number; y: number }[] = [];
  const aristas: { x1: number; y1: number; x2: number; y2: number; bit: string }[] = [];
  const ctx = { hoja: 0 };
  let maxProf = 0;

  const disponer = (n: NodoHuffman, prof: number): number => {
    maxProf = Math.max(maxProf, prof);
    let x: number;
    if (n.izq && n.der) {
      const xi = disponer(n.izq, prof + 1);
      const xd = disponer(n.der, prof + 1);
      x = (xi + xd) / 2;
      aristas.push({ x1: x, y1: prof, x2: xi, y2: prof + 1, bit: "0" });
      aristas.push({ x1: x, y1: prof, x2: xd, y2: prof + 1, bit: "1" });
    } else {
      x = ctx.hoja++;
    }
    nodos.push({ n, x, y: prof });
    return x;
  };

  raices.forEach((r) => {
    disponer(r, 0);
    ctx.hoja += 0.5; 
  });

  const px = (x: number) => x * EX + PAD;
  const py = (y: number) => y * EY + PAD;
  const ancho = Math.max(ctx.hoja, 1) * EX + PAD * 2;
  const alto = maxProf * EY + PAD * 2 + 14;

  return (
    <svg width={ancho} height={alto} style={{ fontFamily: "sans-serif" }}>
      {aristas.map((a, i) => (
        <g key={i}>
          <line x1={px(a.x1)} y1={py(a.y1)} x2={px(a.x2)} y2={py(a.y2)} stroke="#b86bf2" strokeWidth={2} />
          <text
            x={(px(a.x1) + px(a.x2)) / 2 + (a.bit === "0" ? -9 : 9)}
            y={(py(a.y1) + py(a.y2)) / 2}
            fill="#2fd4c0"
            fontSize={12}
            fontWeight="bold"
            textAnchor="middle"
          >
            {a.bit}
          </text>
        </g>
      ))}
      {nodos.map(({ n, x, y }) => {
        const esHoja = n.simbolo !== null;
        return (
          <g key={n.id}>
            <circle cx={px(x)} cy={py(y)} r={R} fill={esHoja ? "#2fd4c0" : "#a24be0"} stroke="#ffffff" strokeWidth={1.5} />
            <text x={px(x)} y={py(y) + 4} textAnchor="middle" fontSize={esHoja ? 13 : 12} fontWeight="bold" fill={esHoja ? "#13131a" : "#ffffff"}>
              {esHoja ? nombreSimbolo(n.simbolo!) : n.frecuencia}
            </text>
            {esHoja && (
              <text x={px(x)} y={py(y) + R + 13} textAnchor="middle" fontSize={11} fill="#e8e0ff">
                {n.frecuencia}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function HoffmanInterface() {
  const [texto, setTexto] = useState("");
  const [bytesArchivo, setBytesArchivo] = useState<Uint8Array | null>(null);
  const [original, setOriginal] = useState<Uint8Array | null>(null);
  const [resultado, setResultado] = useState<ResultadoCompresion | null>(null);
  const [paso, setPaso] = useState(0);
  const [recuperado, setRecuperado] = useState<{ bytes: Uint8Array; texto: string } | null>(null);
  const [error, setError] = useState("");

  const manejarCargarTxt = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    setBytesArchivo(bytes); // se guardan los bytes exactos del archivo
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
    setPaso(r.pasos.length);
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

  // Bosque de árboles en el paso elegido
  const bosque = useMemo(() => {
    if (!resultado) return [];
    let raices = [...resultado.hojas];
    for (let i = 0; i < paso; i++) {
      const p = resultado.pasos[i];
      raices = raices.filter((r) => r !== p.izq && r !== p.der);
      raices.push(p.nuevo);
    }
    return raices.sort((a, b) => a.frecuencia - b.frecuencia || a.id - b.id);
  }, [resultado, paso]);

  const filas = resultado
    ? [...resultado.frecuencias.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
    : [];

  const coincide = original && recuperado ? iguales(original, recuperado.bytes) : null;
  const ahorro = resultado && original ? (1 - resultado.archivo.length / original.length) * 100 : 0;

  return (
    <div className="huffContenedor">
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
            <div className="huffControlPaso">
              <button className="huffBoton" onClick={() => setPaso(0)}>inicio</button>
              <input
                type="range"
                min={0}
                max={resultado.pasos.length}
                value={paso}
                onChange={(e) => setPaso(Number(e.target.value))}
              />
              <span>paso {paso} de {resultado.pasos.length}</span>
            </div>
            <div className="huffArbol">
              <Bosque raices={bosque} />
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