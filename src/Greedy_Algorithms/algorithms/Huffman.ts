export interface NodoHuffman {
  id: number; 
  simbolo: number | null; 
  frecuencia: number;
  izq: NodoHuffman | null;
  der: NodoHuffman | null;
}


export interface PasoHuffman {
  izq: NodoHuffman;
  der: NodoHuffman;
  nuevo: NodoHuffman;
}

export interface ResultadoCompresion {
  frecuencias: Map<number, number>;
  hojas: NodoHuffman[];
  raiz: NodoHuffman;
  pasos: PasoHuffman[];
  codigos: Map<number, string>;
  bitsTotales: number;
  vistaBits: string;
  archivo: Uint8Array;
}

const MAGIA = [0x48, 0x55, 0x46, 0x31];

export function nombreSimbolo(b: number): string {
  if (b === 32) return "␣";
  if (b === 10) return "\\n";
  if (b === 13) return "\\r";
  if (b === 9) return "\\t";
  if (b > 32 && b < 127) return String.fromCharCode(b);
  return "x" + b.toString(16).toUpperCase().padStart(2, "0");
}

export function calcularFrecuencias(bytes: Uint8Array): Map<number, number> {
  const conteo = new Array<number>(256).fill(0);
  for (const b of bytes) conteo[b]++;
  const frecuencias = new Map<number, number>();
  conteo.forEach((f, s) => {
    if (f > 0) frecuencias.set(s, f);
  });
  return frecuencias;
}

export function construirArbol(frecuencias: Map<number, number>): {
  raiz: NodoHuffman;
  hojas: NodoHuffman[];
  pasos: PasoHuffman[];
} {
  const simbolos = [...frecuencias.entries()].sort((a, b) => a[0] - b[0]);
  if (simbolos.length === 0) throw new Error("No hay símbolos para construir el árbol.");

  const hojas: NodoHuffman[] = simbolos.map(([s, f]) => ({
    id: s,
    simbolo: s,
    frecuencia: f,
    izq: null,
    der: null,
  }));

  const cola = [...hojas];
  const pasos: PasoHuffman[] = [];
  let siguienteId = 256;

  while (cola.length > 1) {
    cola.sort((a, b) => a.frecuencia - b.frecuencia || a.id - b.id);
    const izq = cola.shift()!;
    const der = cola.shift()!;
    const nuevo: NodoHuffman = {
      id: siguienteId++,
      simbolo: null,
      frecuencia: izq.frecuencia + der.frecuencia,
      izq,
      der,
    };
    pasos.push({ izq, der, nuevo });
    cola.push(nuevo);
  }

  return { raiz: cola[0], hojas, pasos };
}

export function generarCodigos(raiz: NodoHuffman): Map<number, string> {
  const codigos = new Map<number, string>();
  const recorrer = (n: NodoHuffman, prefijo: string) => {
    if (n.simbolo !== null) {
      codigos.set(n.simbolo, prefijo || "0");
      return;
    }
    recorrer(n.izq!, prefijo + "0");
    recorrer(n.der!, prefijo + "1");
  };
  recorrer(raiz, "");
  return codigos;
}

function empaquetarBits(bytes: Uint8Array, codigos: Map<number, string>) {
  let bitsTotales = 0;
  for (const b of bytes) bitsTotales += codigos.get(b)!.length;

  const datos = new Uint8Array(Math.ceil(bitsTotales / 8));
  let pos = 0;
  for (const b of bytes) {
    for (const bit of codigos.get(b)!) {
      if (bit === "1") datos[pos >> 3] |= 0x80 >> (pos & 7);
      pos++;
    }
  }
  return { datos, bitsTotales };
}

function vistaPreviaBits(bytes: Uint8Array, codigos: Map<number, string>, max = 160): string {
  let cadena = "";
  for (const b of bytes) {
    cadena += codigos.get(b)!;
    if (cadena.length >= max) return cadena.slice(0, max) + "...";
  }
  return cadena;
}

export function comprimir(bytes: Uint8Array): ResultadoCompresion {
  if (bytes.length === 0) throw new Error("No hay datos para comprimir.");

  const frecuencias = calcularFrecuencias(bytes);
  const { raiz, hojas, pasos } = construirArbol(frecuencias);
  const codigos = generarCodigos(raiz);
  const { datos, bitsTotales } = empaquetarBits(bytes, codigos);
  const bitsRelleno = datos.length * 8 - bitsTotales;

  const n = frecuencias.size;
  const tamCabecera = 4 + 4 + 2 + n * 5 + 1;
  const archivo = new Uint8Array(tamCabecera + datos.length);
  const vista = new DataView(archivo.buffer);

  archivo.set(MAGIA, 0);
  vista.setUint32(4, bytes.length);
  vista.setUint16(8, n);
  let pos = 10;
  for (const [s, f] of frecuencias) {
    archivo[pos] = s;
    vista.setUint32(pos + 1, f);
    pos += 5;
  }
  archivo[pos++] = bitsRelleno;
  archivo.set(datos, pos);

  return {
    frecuencias,
    hojas,
    raiz,
    pasos,
    codigos,
    bitsTotales,
    vistaBits: vistaPreviaBits(bytes, codigos),
    archivo,
  };
}

export function descomprimir(archivo: Uint8Array): Uint8Array {
  if (archivo.length < 11 || MAGIA.some((m, i) => archivo[i] !== m)) {
    throw new Error("El archivo no es un .iaa válido.");
  }

  const vista = new DataView(archivo.buffer, archivo.byteOffset, archivo.byteLength);
  const longitud = vista.getUint32(4);
  const n = vista.getUint16(8);
  let pos = 10;

  if (pos + n * 5 + 1 > archivo.length) throw new Error("Cabecera dañada.");

  const frecuencias = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    frecuencias.set(archivo[pos], vista.getUint32(pos + 1));
    pos += 5;
  }
  pos++; 

  if (longitud === 0) return new Uint8Array(0);
  if (n === 0) throw new Error("Cabecera dañada.");

  const datos = archivo.subarray(pos);

  if (longitud > datos.length * 8) throw new Error("Archivo corrupto: faltan datos.");

  const { raiz } = construirArbol(frecuencias); 

  if (raiz.simbolo !== null) {
    return new Uint8Array(longitud).fill(raiz.simbolo); 
  }

  const salida = new Uint8Array(longitud);
  let nodo = raiz;
  let escritos = 0;
  for (let p = 0; escritos < longitud; p++) {
    if (p >> 3 >= datos.length) throw new Error("Archivo corrupto: faltan datos.");
    const bit = (datos[p >> 3] >> (7 - (p & 7))) & 1;
    nodo = bit ? nodo.der! : nodo.izq!;
    if (nodo.simbolo !== null) {
      salida[escritos++] = nodo.simbolo;
      nodo = raiz;
    }
  }
  return salida;
}