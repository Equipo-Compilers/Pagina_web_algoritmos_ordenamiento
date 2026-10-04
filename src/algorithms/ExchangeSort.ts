import type { SortStep } from "./types";

export function* exchangeSort(array: number[]): Generator<SortStep> { 
    
const arr = [...array];
  
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let huboIntercambio = false;

    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        huboIntercambio = true;

        yield { estadoActual: [...arr], indicesActivos: [j, j + 1] };
      }
    }

    if (!huboIntercambio) break;
  }

  yield { estadoActual: [...arr], indicesActivos: [] };




}