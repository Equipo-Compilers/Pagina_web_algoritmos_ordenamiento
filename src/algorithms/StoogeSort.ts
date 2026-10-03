import type { SortStep } from "./types";

export function* stoogeSort(array: number[]): Generator<SortStep> {
  const arr = [...array];

  function* stoogeSortRec(l: number, h: number): Generator<SortStep> {
    if (l >= h) return;

    if (arr[l] > arr[h]) {
      [arr[l], arr[h]] = [arr[h], arr[l]];

      yield { estadoActual: [...arr], indicesActivos: [l, h] };
    }

    if (h - l + 1 > 2) {
      const t = Math.floor((h - l + 1) / 3);

      yield* stoogeSortRec(l, h - t); // Primeros 2/3
      yield* stoogeSortRec(l + t, h); // Últimos 2/3
      yield* stoogeSortRec(l, h - t); // Primeros 2/3 de nuevo
    }
  }

  yield* stoogeSortRec(0, arr.length - 1);

  yield { estadoActual: [...arr], indicesActivos: [] };
}
