export function generador(cantidad: number): number[] {
  return Array.from({ length: cantidad }, () => Math.floor(Math.random() * 90) + 10);
}
