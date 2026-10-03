export function generador(cantidad: number): number[] {
  return Array.from({ length: cantidad }, () => Math.floor(Math.random() * 90) + 10);
}

export function generadorOrdenado(cantidad: number): number[] {
  return generador(cantidad).sort((a, b) => a - b);
}

export function generadorCasiInvertido(cantidad: number): number[] {
  const arr = generador(cantidad).sort((a, b) => b - a);

  if (arr.length > 1) {
    const temp = arr[0];
    arr[0] = arr[1];
    arr[1] = temp;
  }
  return arr;
}