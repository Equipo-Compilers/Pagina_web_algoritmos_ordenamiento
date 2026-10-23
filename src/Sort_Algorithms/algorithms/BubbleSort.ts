import type { SortStep } from "./types";

export function* bubbleSort(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const n = arr.length;
  let comparaciones = 0;
  let intercambios = 0;

  for (let i = 0; i < n - 1; i++) {
    let huboIntercambio = false;

    for (let j = 0; j < n - 1 - i; j++) {
      comparaciones++;
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        intercambios++;
        huboIntercambio = true;

        yield { estadoActual: [...arr], indicesActivos: [j, j + 1], comparaciones, intercambios };
      }
    }

    if (!huboIntercambio) break;
  }

  yield { estadoActual: [...arr], indicesActivos: [], comparaciones, intercambios };
}