export interface AnimNode {
  id: number;
  label: string | null;
  freq: number;
  left: AnimNode | null;
  right: AnimNode | null;
}

export interface AnimUnion {
  left: AnimNode;
  right: AnimNode;
  parent: AnimNode;
}

export interface AnimData {
  unit: string;
  leaves: AnimNode[];
  unions: AnimUnion[];
}

export function forestAtStep(data: AnimData, step: number): AnimNode[] {
  let roots = [...data.leaves];
  for (let i = 0; i < step; i++) {
    const u = data.unions[i];
    roots = roots.filter((r) => r !== u.left && r !== u.right);
    roots.push(u.parent);
  }
  return roots.sort((a, b) => a.freq - b.freq || a.id - b.id);
}

export const RADIUS = 19;
export const LEAF_SPACING = 44;
export const LEVEL_HEIGHT = 72;
export const TREE_GAP = 24;
export const MARGIN = 28;

export interface PlacedNode { node: AnimNode; x: number; y: number }
export interface PlacedEdge { x1: number; y1: number; x2: number; y2: number; bit: "0" | "1" }
export interface Layout {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  width: number;
  height: number;
}

const isLeaf = (n: AnimNode) => n.left === null || n.right === null;

export function layoutForest(forest: AnimNode[]): Layout {
  const nodes: PlacedNode[] = [];
  const edges: PlacedEdge[] = [];
  let cursor = MARGIN;
  let maxDepth = 0;

  function place(node: AnimNode, depth: number): number {
    maxDepth = Math.max(maxDepth, depth);
    const y = MARGIN + depth * LEVEL_HEIGHT;

    if (isLeaf(node)) {
      const x = cursor;
      cursor += LEAF_SPACING;
      nodes.push({ node, x, y });
      return x;
    }

    const lx = place(node.left!, depth + 1);
    const rx = place(node.right!, depth + 1);
    const x = (lx + rx) / 2;
    edges.push({ x1: x, y1: y, x2: lx, y2: y + LEVEL_HEIGHT, bit: "0" });
    edges.push({ x1: x, y1: y, x2: rx, y2: y + LEVEL_HEIGHT, bit: "1" });
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
    width: Math.max(cursor - TREE_GAP - LEAF_SPACING + MARGIN, 120),
    height: MARGIN * 2 + maxDepth * LEVEL_HEIGHT + 20,
  };
}

export interface CodeRow { label: string; freq: number; code: string }

export function codesFromTree(root: AnimNode): CodeRow[] {
  const rows: CodeRow[] = [];
  function walk(n: AnimNode, prefix: string) {
    if (isLeaf(n)) {
      rows.push({ label: n.label ?? "?", freq: n.freq, code: prefix === "" ? "0" : prefix });
      return;
    }
    walk(n.left!, prefix + "0");
    walk(n.right!, prefix + "1");
  }
  walk(root, "");
  return rows.sort((a, b) => a.code.length - b.code.length || b.freq - a.freq);
}