import type { SortStep } from "./types";
 
export function* exchangeSort(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const n = arr.length;
  let comparaciones = 0;
  let intercambios = 0;
 
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      comparaciones++;
      if (arr[i] > arr[j]) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        intercambios++;
        yield { estadoActual: [...arr], indicesActivos: [i, j], comparaciones, intercambios };
      }
    }
  }
 
  yield { estadoActual: [...arr], indicesActivos: [], comparaciones, intercambios};
}
 