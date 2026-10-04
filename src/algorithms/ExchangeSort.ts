import type { SortStep } from "./types";
 
export function* exchangeSort(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const n = arr.length;
 
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      if (arr[i] > arr[j]) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        yield { estadoActual: [...arr], indicesActivos: [i, j] };
      }
    }
  }
 
  yield { estadoActual: [...arr], indicesActivos: [] };
}
 