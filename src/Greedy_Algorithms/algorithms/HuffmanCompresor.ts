export class HuffmanNode{
    symbol: number | null; 
    freq: number;
    order: number; 
    left: HuffmanNode | null = null;
    right: HuffmanNode | null = null;

    constructor(symbol: number | null, freq: number, order: number) {
        this.symbol = symbol;
        this.freq = freq;
        this.order = order;
    }
}

class Heap{
    private data: HuffmanNode[] = [];

    get size(): number {
        return this.data.length;
    }

    private less(a: HuffmanNode, b: HuffmanNode): boolean {
        return a.freq < b.freq || (a.freq === b.freq && a.order < b.order);
    }

    push(node: HuffmanNode): void{
        const eData = this.data;
        eData.push(node);
        let i = eData.length - 1;

        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (!this.less(eData[i], eData[parent])) break;
            [eData[i], eData[parent]] = [eData[parent], eData[i]];
            i = parent;
        }
    }

    pop(): HuffmanNode{
        const eData = this.data;
        const top = eData[0];
        const last = eData.pop()!;
        
        if (eData.length > 0) {
            eData[0] = last;
            let i = 0;
            for (;;) {
                const l = 2 * i + 1;
                const r = l + 1;
                let m = i;
                
                if (l < eData.length && this.less(eData[l], eData[m])) {
                    m = l;
                }
                
                if (r < eData.length && this.less(eData[r], eData[m])) {
                    m = r;
                }
                
                if (m === i) {
                    break;
                }

                [eData[i], eData[m]] = [eData[m], eData[i]];
                i = m;
            }
        }

        return top;
    }

    snapshot(): HuffmanNode[] {
        return [...this.data].sort((a, b) => a.freq - b.freq || a.order - b.order);
    }
}

export function textToSymbols(text: string): number[] {
    return Array.from(text, (ch) => ch.codePointAt(0)!);
}

export function symbolsToText(symbols: ArrayLike<number>): string {
    const parts: string[] = [];
    const CHUNK = 8192;
    for (let i = 0; i < symbols.length; i += CHUNK) {
        const end = Math.min(i + CHUNK, symbols.length);
        parts.push(String.fromCodePoint(...Array.from({ length: end - i }, (_, j) => symbols[i + j])));
    }
    return parts.join("");
}

export function countFrequencies(symbols: Iterable<number>){
    const freqs = new Map<number, number>();
    for(const s of symbols) freqs.set(s, (freqs.get(s) ?? 0) + 1);
    return freqs;
}

export function buildTree(freqs: Map<number, number>): HuffmanNode{
    const heap = new Heap;
    let order = 0;

    const symbols = [...freqs.keys()].sort((a, b) => a - b);
    for (const s of symbols) {
        heap.push(new HuffmanNode(s, freqs.get(s)!, order++));
    }

    while(heap.size > 1){
        const left = heap.pop();
        const right = heap.pop();
        const parent = new HuffmanNode(null, left.freq + right.freq, order++);
        parent.left = left;
        parent.right = right;
        heap.push(parent);
    }

    return heap.pop();
}

export interface TreeStep {
    forest: HuffmanNode[];
    merged: { left: HuffmanNode; right: HuffmanNode; parent: HuffmanNode } | null;
    step: number;
    totalSteps: number;
}

export function* buildTreeSteps(freqs: Map<number, number>): Generator<TreeStep> {
    if (freqs.size === 0) return;

    const heap = new Heap();
    let order = 0;
    const totalSteps = freqs.size - 1;

    const symbols = [...freqs.keys()].sort((a, b) => a - b);
    for (const s of symbols) {
        heap.push(new HuffmanNode(s, freqs.get(s)!, order++));
    }

    yield { forest: heap.snapshot(), merged: null, step: 0, totalSteps };

    let step = 0;
    while (heap.size > 1) {
        const left = heap.pop();
        const right = heap.pop();
        const parent = new HuffmanNode(null, left.freq + right.freq, order++);
        parent.left = left;
        parent.right = right;
        heap.push(parent);

        step++;
        yield { forest: heap.snapshot(), merged: { left, right, parent }, step, totalSteps };
    }
}

export function generateCodes(root: HuffmanNode): Map<number, string> {
    const codes = new Map<number, string>();

    function walk(node: HuffmanNode | null, prefix: string): void{
        if (node === null){
            return;
        }

        if (node.symbol !== null) {
            codes.set(node.symbol, prefix === "" ? "0" : prefix);
            return;
        }

        walk(node.left, prefix + "0");
        walk(node.right, prefix + "1");
    }

    walk(root, "");
    return codes;
}

export function encodeToBits(symbols: ArrayLike<number>, codes: Map<number, string>): string{
    const parts: string[] = [];

    for(let i = 0; i < symbols.length; i++){
        parts.push(codes.get(symbols[i])!);
    }

    return parts.join("");
}

export function decodeFromBits(bits: string, root: HuffmanNode, totalSymbols: number): Uint32Array{
    const out = new Uint32Array(totalSymbols);

    if (root.symbol !== null) {
        out.fill(root.symbol);
        return out;
    }

    let node = root;
    let n = 0;

    for (let i = 0; i < bits.length && n < totalSymbols; i++) {
        node = (bits[i] === "0" ? node.left : node.right)!;

        if (node.symbol !== null) {
            out[n++] = node.symbol;
            node = root;
        }
    }

    return out;
}

const FORMAT_MARK = 0xA2;
const ENTRY_SIZE = 7;

export function compress(text: string): Uint8Array {
    const symbols = textToSymbols(text);
    const freqs = countFrequencies(symbols);
    const k = freqs.size;

    if (k === 0) return new Uint8Array([FORMAT_MARK, 0, 0, 0, 0]);

    const root = buildTree(freqs);
    const codes = generateCodes(root);
    const bits = encodeToBits(symbols, codes);

    const padding = (8 - (bits.length % 8)) % 8;
    const dataBytes = (bits.length + padding) / 8;
    const headerSize = 1 + 4 + k * ENTRY_SIZE + 1;
    const out = new Uint8Array(headerSize + dataBytes);
    const view = new DataView(out.buffer);

    let p = 0;
    out[p++] = FORMAT_MARK;
    view.setUint32(p, k);
    p += 4;

    for(const[symbol, freq] of freqs){
        out[p++] = (symbol >> 16) & 0xff;
        out[p++] = (symbol >> 8) & 0xff;
        out[p++] = symbol & 0xff;
        view.setUint32(p, freq);
        p += 4;
    }

    out[p++] = padding;

    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;

        for (let j = 0; j < 8; j++) {
            byte = (byte << 1) | (bits[i + j] === "1" ? 1 : 0);
        }
        out[p++] = byte;
    }

    return out;
}

export function decompress(data: Uint8Array): string {
    if (data.length < 5 || data[0] !== FORMAT_MARK) {
        throw new Error("Formato no reconocido: no es un archivo .iaa de esta versión.");
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let p = 1;
    const k = view.getUint32(p); p += 4;
    if (k === 0) return "";

    if (p + k * ENTRY_SIZE + 1 > data.length) {
        throw new Error("Archivo .iaa incompleto o dañado.");
    }

    const freqs = new Map<number, number>();
    let total = 0;
    for (let i = 0; i < k; i++) {
        const symbol = (data[p] << 16) | (data[p + 1] << 8) | data[p + 2];
        p += 3;
        const freq = view.getUint32(p); p += 4;
        freqs.set(symbol, freq);
        total += freq;
    }
    const padding = data[p++];

    const chunks: string[] = [];
    for (let i = p; i < data.length; i++) chunks.push(data[i].toString(2).padStart(8, "0"));
    let bits = chunks.join("");
    if (padding > 0) bits = bits.slice(0, bits.length - padding);

    if (total > bits.length) {
        throw new Error("Archivo .iaa incompleto o dañado.");
    }

    const root = buildTree(freqs);
    return symbolsToText(decodeFromBits(bits, root, total));
}


export interface CompressionStats {
    originalBytes: number;
    compressedBytes: number;
    ratio: number;
    savedPercent: number; 
}
 
export function getStats(text: string, compressed: Uint8Array): CompressionStats {
    const originalBytes = new TextEncoder().encode(text).length;
    const compressedBytes = compressed.length;
    const ratio = originalBytes === 0 ? 1 : compressedBytes / originalBytes;
    return { originalBytes, compressedBytes, ratio, savedPercent: (1 - ratio) * 100 };
}
 

export function readTextFile(file: File): Promise<string> {
    return file.text();  
}
 
export function downloadBytes(data: Uint8Array, filename: string): void {
    const blob = new Blob([data as BlobPart], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}