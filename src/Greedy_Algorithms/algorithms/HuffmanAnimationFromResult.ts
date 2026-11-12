import { nombreSimbolo } from "./Huffman";
import type { NodoHuffman, ResultadoCompresion } from "./Huffman";
import type { AnimData, AnimNode } from "./HuffmanLayout";

export function animationDataFromResult(r: ResultadoCompresion): AnimData {
  const cache = new Map<NodoHuffman, AnimNode>(); 

  function convert(n: NodoHuffman): AnimNode {
    const cached = cache.get(n);
    if (cached) return cached;
    const node: AnimNode = {
      id: n.id,
      label: n.simbolo !== null ? nombreSimbolo(n.simbolo) : null,
      freq: n.frecuencia,
      left: null,
      right: null,
    };
    cache.set(n, node);
    if (n.izq) node.left = convert(n.izq);
    if (n.der) node.right = convert(n.der);
    return node;
  }

  return {
    unit: "bytes",
    leaves: r.hojas.map(convert),
    unions: r.pasos.map((p) => ({ left: convert(p.izq), right: convert(p.der), parent: convert(p.nuevo) })),
  };
}