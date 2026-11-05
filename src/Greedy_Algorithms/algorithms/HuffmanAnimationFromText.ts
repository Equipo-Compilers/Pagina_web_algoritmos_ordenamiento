import { buildTreeSteps, countFrequencies, textToSymbols } from "./HuffmanCompresor";
import type { HuffmanNode } from "./HuffmanCompresor";
import type { AnimData, AnimNode } from "./HuffmanLayout";

function symbolLabel(c: number): string {
  if (c === 32) return "␣";
  if (c === 10) return "\\n";
  if (c === 13) return "\\r";
  if (c === 9) return "\\t";
  if (c === 160) return "⍽";
  if (c >= 0x300 && c <= 0x36f) return "◌" + String.fromCodePoint(c);
  const invisible =
    c < 32 || (c >= 127 && c <= 159) || c === 0xad || (c >= 0x200b && c <= 0x200f) || c === 0xfeff;
  if (invisible) return "x" + c.toString(16).toUpperCase().padStart(2, "0");
  return String.fromCodePoint(c);
}

export function animationDataFromText(text: string): AnimData {
  const steps = [...buildTreeSteps(countFrequencies(textToSymbols(text)))];
  const cache = new Map<HuffmanNode, AnimNode>();

  function convert(n: HuffmanNode): AnimNode {
    const cached = cache.get(n);
    if (cached) return cached;
    const node: AnimNode = {
      id: n.order,
      label: n.symbol !== null ? symbolLabel(n.symbol) : null,
      freq: n.freq,
      left: null,
      right: null,
    };
    cache.set(n, node);
    if (n.left) node.left = convert(n.left);
    if (n.right) node.right = convert(n.right);
    return node;
  }

  if (steps.length === 0) return { unit: "caracteres", leaves: [], unions: [] };

  return {
    unit: "caracteres",
    leaves: steps[0].forest.map(convert),
    unions: steps
      .slice(1)
      .map((s) => ({ left: convert(s.merged!.left), right: convert(s.merged!.right), parent: convert(s.merged!.parent) })),
  };
}