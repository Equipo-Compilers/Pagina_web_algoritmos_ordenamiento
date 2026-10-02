export function generador(cantidad: number): number[] {
  const arreglo: number[] = [];
  for (let i = 0; i < cantidad; i++) {
    arreglo.push(Math.floor(Math.random() * 600) + 1);
  }
  return arreglo;
}
 
export function generadorOrdenado(cantidad: number): number[] {
  const paso = 600 / cantidad;
  const arreglo: number[] = [];
  for (let i = 0; i < cantidad; i++) {
    arreglo.push(Math.round(paso * (i + 1)));
  }
  return arreglo;
}
 
export function generadorCasiInvertido(cantidad: number): number[] {
  const arreglo = generadorOrdenado(cantidad).reverse();
  const a = Math.floor(Math.random() * cantidad);
  const b = Math.floor(Math.random() * cantidad);
  [arreglo[a], arreglo[b]] = [arreglo[b], arreglo[a]];
  return arreglo;
}