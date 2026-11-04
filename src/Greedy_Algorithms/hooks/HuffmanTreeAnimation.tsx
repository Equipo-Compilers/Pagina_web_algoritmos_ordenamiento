import { useEffect, useMemo, useState } from "react";
import {
  buildTreeSteps,
  countFrequencies,
  generateCodes,
  textToSymbols,
} from "../algorithms/HuffmanCompresor";
import type { HuffmanNode } from "../algorithms/HuffmanCompresor";
import "./HuffmanTreeAnimation.css";

interface HuffmanTreeAnimationProps {
  text: string;
  autoPlay?: boolean;
}

const RADIUS = 17;
const SPACING = 40;
const LEVEL = 70;
const TREE_GAP = 24;
const PAD = 24;

function symbolLabel(c: number): string {
  if (c === 32) return "␠";
  if (c === 10) return "↵";
  if (c === 13) return "␍";
  if (c === 9) return "⇥";
  if (c === 160) return "⍽";
  if (c >= 0x300 && c <= 0x36f) return "◌" + String.fromCodePoint(c);
  const invisible =
    c < 32 || (c >= 127 && c <= 159) || c === 0xad || (c >= 0x200b && c <= 0x200f) || c === 0xfeff;
  if (invisible) return c.toString(16).toUpperCase().padStart(2, "0");
  return String.fromCodePoint(c);
}

function nodeName(n: HuffmanNode): string {
  return n.symbol !== null ? `«${symbolLabel(n.symbol)}» (${n.freq})` : `subárbol (${n.freq})`;
}

interface LaidNode { node: HuffmanNode; x: number; y: number }
interface LaidEdge { x1: number; y1: number; x2: number; y2: number; bit: "0" | "1" }
interface Layout { nodes: LaidNode[]; edges: LaidEdge[]; width: number; height: number }

function layoutForest(forest: HuffmanNode[]): Layout {
  const nodes: LaidNode[] = [];
  const edges: LaidEdge[] = [];
  let cursor = PAD;
  let maxDepth = 0;

  function place(node: HuffmanNode, depth: number): number {
    maxDepth = Math.max(maxDepth, depth);
    const y = PAD + depth * LEVEL;

    if (node.left === null || node.right === null) {
      const x = cursor;
      cursor += SPACING;
      nodes.push({ node, x, y });
      return x;
    }

    const lx = place(node.left, depth + 1);
    const rx = place(node.right, depth + 1);
    const x = (lx + rx) / 2;
    edges.push({ x1: x, y1: y, x2: lx, y2: y + LEVEL, bit: "0" });
    edges.push({ x1: x, y1: y, x2: rx, y2: y + LEVEL, bit: "1" });
    nodes.push({ node, x, y });
    return x;
  }

  for (const root of forest) {
    place(root, 0);
    cursor += TREE_GAP;
  }

  return {
    nodes,
    edges,
    width: Math.max(cursor - TREE_GAP - SPACING + PAD, 120),
    height: PAD * 2 + maxDepth * LEVEL + 20,
  };
}

export default function HuffmanTreeAnimation({ text, autoPlay = false }: HuffmanTreeAnimationProps) {
  const { steps, freqs } = useMemo(() => {
    const f = countFrequencies(textToSymbols(text));
    return { steps: [...buildTreeSteps(f)], freqs: f };
  }, [text]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speedMs, setSpeedMs] = useState(450);

  const last = steps.length - 1;

  useEffect(() => {
    setIndex(0);
    setPlaying(autoPlay);
  }, [steps, autoPlay]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setIndex((i) => i + 1), speedMs);
    return () => clearTimeout(id);
  }, [playing, index, last, speedMs]);

  const current = steps[Math.min(index, Math.max(last, 0))];
  const layout = useMemo(() => (current ? layoutForest(current.forest) : null), [current]);

  const finished = current !== undefined && index === last;
  const codeRows = useMemo(() => {
    if (!finished || !current) return [];
    const codes = generateCodes(current.forest[0]);
    return [...codes]
      .map(([symbol, code]) => ({ symbol, code, freq: freqs.get(symbol) ?? 0 }))
      .sort((a, b) => a.code.length - b.code.length || a.symbol - b.symbol);
  }, [finished, current, freqs]);

  if (!current || !layout) {
    return <p>No hay texto para construir el árbol.</p>;
  }

  function togglePlay() {
    if (index >= last) {
      setIndex(0);
      setPlaying(true);
    } else {
      setPlaying(!playing);
    }
  }

  function goTo(i: number) {
    setPlaying(false);
    setIndex(Math.min(Math.max(i, 0), last));
  }

  const merged = current.merged;
  const highlighted = merged ? new Set([merged.left, merged.right, merged.parent]) : null;

  let description: string;
  if (merged) {
    description = `Se unen ${nodeName(merged.left)} y ${nodeName(merged.right)} → nodo nuevo de frecuencia ${merged.parent.freq}.`;
  } else if (last === 0) {
    description = "El texto solo tiene un símbolo distinto: su código es «0».";
  } else {
    description = "Inicio: cada símbolo es un árbol de un solo nodo con su frecuencia. Siempre se unen los dos de menor frecuencia.";
  }
  if (finished && last > 0) {
    description += ` Árbol completo: la raíz suma los ${current.forest[0].freq.toLocaleString()} caracteres del texto.`;
  }

  return (
    <section className="tree-anim-section">
      <h2>Construcción del árbol de Huffman</h2>

      <div className="tree-anim-controls">
        <button onClick={() => goTo(0)} disabled={index === 0} title="Ir al inicio">⏮</button>
        <button onClick={() => goTo(index - 1)} disabled={index === 0} title="Paso anterior">◀</button>
        <button onClick={togglePlay}>
          {playing ? "⏸ Pausa" : index >= last && last > 0 ? "↻ Repetir" : "▶ Reproducir"}
        </button>
        <button onClick={() => goTo(index + 1)} disabled={index >= last} title="Paso siguiente">▶</button>

        <select value={speedMs} onChange={(e) => setSpeedMs(Number(e.target.value))}>
          <option value={900}>Lenta</option>
          <option value={450}>Normal</option>
          <option value={150}>Rápida</option>
          <option value={40}>Muy rápida</option>
        </select>
      </div>

      <input
        className="tree-anim-slider"
        type="range"
        min={0}
        max={Math.max(last, 0)}
        value={index}
        onChange={(e) => goTo(Number(e.target.value))}
        disabled={last === 0}
      />

      <p className="tree-anim-step">
        Paso {current.step} de {current.totalSteps} · {current.forest.length}{" "}
        {current.forest.length === 1 ? "árbol" : "árboles"} en el bosque
      </p>
      <p className="tree-anim-description">{description}</p>

      <div className="tree-anim-canvas">
        <svg
          width={layout.width}
          height={layout.height}
          role="img"
          aria-label="Árbol de Huffman en construcción"
        >
          {layout.edges.map((e, i) => (
            <g key={i}>
              <line className="tree-edge" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
              <text
                className="tree-edge-bit"
                x={(e.x1 + e.x2) / 2 + (e.bit === "0" ? -8 : 8)}
                y={(e.y1 + e.y2) / 2}
              >
                {e.bit}
              </text>
            </g>
          ))}

          {layout.nodes.map(({ node, x, y }) => {
            const isLeaf = node.symbol !== null;
            const isNew = merged !== null && node === merged.parent;
            const isHot = highlighted !== null && highlighted.has(node);
            const label = isLeaf ? symbolLabel(node.symbol!) : String(node.freq);
            const classes = [
              "tree-node",
              isLeaf ? "tree-node-leaf" : "tree-node-inner",
              isHot ? "tree-node-hot" : "",
              isNew ? "tree-node-new" : "",
            ].join(" ");

            return (
              <g key={node.order} className={classes}>
                <circle cx={x} cy={y} r={RADIUS} />
                <text
                  className="tree-node-label"
                  x={x}
                  y={y}
                  style={{ fontSize: label.length > 3 ? 8 : 11 }}
                >
                  {label}
                </text>
                {isLeaf && (
                  <text className="tree-node-freq" x={x} y={y + RADIUS + 12}>
                    {node.freq}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {finished && last > 0 && (
        <div className="tree-anim-codes">
          <h3>Códigos resultantes</h3>
          <p className="tree-anim-hint">
            Los símbolos más frecuentes quedaron con los códigos más cortos. ␠ es el espacio y ↵ el
            salto de línea; los caracteres invisibles se muestran con su valor en hexadecimal.
          </p>
          <table>
            <thead>
              <tr><th>Símbolo</th><th>Veces</th><th>Código</th><th>Bits</th></tr>
            </thead>
            <tbody>
              {codeRows.map((r) => (
                <tr key={r.symbol}>
                  <td>{symbolLabel(r.symbol)}</td>
                  <td>{r.freq.toLocaleString()}</td>
                  <td className="tree-anim-code">{r.code}</td>
                  <td>{r.code.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}