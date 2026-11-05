import { useEffect, useMemo, useState } from "react";
import { codesFromTree, forestAtStep, layoutForest, RADIUS } from "../algorithms/HuffmanLayout";
import type { AnimData, AnimNode } from "../algorithms/HuffmanLayout";
import "./HuffmanTreeAnimation.css";

interface HuffmanTreeAnimationProps {
  data: AnimData;
  step: number;
  onStepChange: (step: number) => void;
  showCodes?: boolean;
}

function nodeName(n: AnimNode): string {
  return n.label !== null ? `'${n.label}' (${n.freq})` : `subárbol (${n.freq})`;
}

export default function HuffmanTreeAnimation({
  data,
  step,
  onStepChange,
  showCodes = false,
}: HuffmanTreeAnimationProps) {
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(450);
  const total = data.unions.length;

  useEffect(() => {
    setPlaying(true);
  }, [data]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => onStepChange(step + 1), speedMs);
    return () => clearTimeout(id);
  }, [playing, step, total, speedMs, onStepChange]);

  const forest = useMemo(() => forestAtStep(data, step), [data, step]);
  const layout = useMemo(() => layoutForest(forest), [forest]);

  const finished = data.leaves.length > 0 && step >= total;
  const codeRows = useMemo(
    () => (showCodes && finished && total > 0 ? codesFromTree(forest[0]) : []),
    [showCodes, finished, total, forest]
  );

  if (data.leaves.length === 0) {
    return <p>No hay texto para construir el árbol.</p>;
  }

  function goTo(s: number) {
    setPlaying(false);
    onStepChange(Math.min(Math.max(s, 0), total));
  }

  function togglePlay() {
    if (step >= total) {
      onStepChange(0);
      setPlaying(true);
    } else {
      setPlaying(!playing);
    }
  }

  const union = step > 0 ? data.unions[step - 1] : null;
  const highlighted = union ? new Set<AnimNode>([union.left, union.right, union.parent]) : null;

  let description: string;
  if (total === 0) {
    description = "El texto solo tiene un símbolo distinto: su código es «0» y no hay uniones.";
  } else if (union) {
    description = `Se unen ${nodeName(union.left)} y ${nodeName(union.right)} → nodo nuevo de frecuencia ${union.parent.freq}.`;
  } else {
    description = "Inicio: cada símbolo es un árbol de un solo nodo con su frecuencia. Siempre se unen los dos de menor frecuencia.";
  }
  if (finished && total > 0) {
    description += ` Árbol completo: la raíz suma los ${forest[0].freq.toLocaleString()} ${data.unit} del texto.`;
  }

  return (
    <div className="tree-anim">
      <div className="tree-anim-controls">
        <button onClick={() => goTo(0)} disabled={step === 0} title="Ir al inicio">⏮</button>
        <button onClick={() => goTo(step - 1)} disabled={step === 0} title="Paso anterior">◀</button>
        <button onClick={togglePlay} disabled={total === 0}>
          {playing ? "⏸ Pausa" : step >= total && total > 0 ? "↻ Repetir" : "▶ Reproducir"}
        </button>
        <button onClick={() => goTo(step + 1)} disabled={step >= total} title="Paso siguiente">▶</button>

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
        max={total}
        value={step}
        onChange={(e) => goTo(Number(e.target.value))}
        disabled={total === 0}
      />

      <p className="tree-anim-step">
        Paso {step} de {total} · {forest.length} {forest.length === 1 ? "árbol" : "árboles"} en el bosque
      </p>
      <p className="tree-anim-description">{description}</p>

      <div className="tree-anim-canvas">
        <svg width={layout.width} height={layout.height} role="img" aria-label="Árbol de Huffman en construcción">
          {layout.edges.map((e, i) => (
            <g key={i}>
              <line className="tree-edge" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
              <text
                className="tree-edge-bit"
                x={(e.x1 + e.x2) / 2 + (e.bit === "0" ? -9 : 9)}
                y={(e.y1 + e.y2) / 2}
              >
                {e.bit}
              </text>
            </g>
          ))}

          {layout.nodes.map(({ node, x, y }) => {
            const leaf = node.label !== null;
            const text = leaf ? node.label! : String(node.freq);
            const classes = [
              "tree-node",
              leaf ? "tree-node-leaf" : "tree-node-inner",
              highlighted?.has(node) ? "tree-node-hot" : "",
              union && node === union.parent ? "tree-node-new" : "",
            ].join(" ");

            return (
              <g key={node.id} className={classes}>
                <circle cx={x} cy={y} r={RADIUS} />
                <text className="tree-node-label" x={x} y={y} style={{ fontSize: text.length > 2 ? 9 : 13 }}>
                  {text}
                </text>
                {leaf && (
                  <text className="tree-node-freq" x={x} y={y + RADIUS + 13}>
                    {node.freq}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {codeRows.length > 0 && (
        <div className="tree-anim-codes">
          <h3>Códigos resultantes</h3>
          <p className="tree-anim-hint">
            Los símbolos más frecuentes quedaron con los códigos más cortos. ␣ es el espacio,
            \n el salto de línea y los caracteres invisibles se muestran como x + su valor en hexadecimal.
          </p>
          <table>
            <thead>
              <tr><th>Símbolo</th><th>Veces</th><th>Código</th><th>Bits</th></tr>
            </thead>
            <tbody>
              {codeRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.label}</td>
                  <td>{r.freq.toLocaleString()}</td>
                  <td className="tree-anim-code">{r.code}</td>
                  <td>{r.code.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}