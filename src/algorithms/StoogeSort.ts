import type { SortStep } from "./types";

function* stoogeSortRec(
  arr: number[],
  l: number,
  h: number
): Generator<SortStep> {
  if (l >= h) return;

  if (arr[l] > arr[h]) {
    [arr[l], arr[h]] = [arr[h], arr[l]];

    yield { estadoActual: [...arr], indicesActivos: [l, h] };
  }

  if (h - l + 1 > 2) {
    const t = Math.floor((h - l + 1) / 3);

    yield* stoogeSortRec(arr, l, h - t); // Primeros 2/3
    yield* stoogeSortRec(arr, l + t, h); // Últimos 2/3
    yield* stoogeSortRec(arr, l, h - t); // Primeros 2/3 de nuevo
  }
}

export function* stoogeSort(array: number[]): Generator<SortStep> {
  const arr = [...array];

  yield* stoogeSortRec(arr, 0, arr.length - 1);

  yield { estadoActual: [...arr], indicesActivos: [] };
}
