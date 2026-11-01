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
}

export function countFrequencies(bytes: Uint8Array){
    const freqs = new Map<number, number>();
    for(const b of bytes) freqs.set(b, (freqs.get(b) ?? 0) + 1);
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

export function encodeToBits(bytes: Uint8Array, codes: Map<number, string>): string{
    const parts: string[] = [];
    
    for(const b of bytes){
        parts.push(codes.get(b)!);
    }

    return parts.join("")
}

export function decodeFromBits(bits: string, root: HuffmanNode, totalSymbols: number): Uint8Array{
    const out = new Uint8Array(totalSymbols);

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

export function compress(text: string): Uint8Array {
    const bytes = new TextEncoder().encode(text);
    const freqs =  countFrequencies(bytes);
    const k = freqs.size;

    if (k === 0) return new Uint8Array([0, 0, 0]);

    const root = buildTree(freqs);
    const codes = generateCodes(root);
    const bits = encodeToBits(bytes, codes);

    const padding = (8 - (bits.length % 8)) % 8;
    const dataBytes = (bits.length + padding) / 8;
    const headerSize = 2 + k * 5 + 1;
    const out = new Uint8Array(headerSize + dataBytes);
    const view = new DataView(out.buffer);

    let p = 0;
    view.setUint16(p, k); 
    p+=2;
    
    for(const[symbol, freq] of freqs){
        out[p++] = symbol;
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
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let p = 0;
    const k = view.getUint16(p); p += 2;
    if (k === 0) return "";
    
    const freqs = new Map<number, number>();
    let total = 0;
    for (let i = 0; i < k; i++) {
        const symbol = data[p++];
        const freq = view.getUint32(p); p += 4;
        freqs.set(symbol, freq);
        total += freq;
    }
    const padding = data[p++];
    
    const chunks: string[] = [];
    for (let i = p; i < data.length; i++) chunks.push(data[i].toString(2).padStart(8, "0"));
    let bits = chunks.join("");
    if (padding > 0) bits = bits.slice(0, bits.length - padding);
    
    const root = buildTree(freqs);
    return new TextDecoder().decode(decodeFromBits(bits, root, total));
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