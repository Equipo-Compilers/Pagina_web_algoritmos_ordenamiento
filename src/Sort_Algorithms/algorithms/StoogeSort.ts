import type { SortStep } from "./types";

export function* stoogeSort(array: number[]): Generator<SortStep> {
  const arr = [...array];
  let comparaciones = 0;
  let intercambios = 0;

  function* stoogeSortRec(l: number, h: number): Generator<SortStep> {
    if (l >= h) return;

    comparaciones++;
    if (arr[l] > arr[h]) {
      [arr[l], arr[h]] = [arr[h], arr[l]];
      intercambios++;

      yield { estadoActual: [...arr], indicesActivos: [l, h], comparaciones, intercambios };
    }

    if (h - l + 1 > 2) {
      const t = Math.floor((h - l + 1) / 3);

      yield* stoogeSortRec(l, h - t);
      yield* stoogeSortRec(l + t, h);
      yield* stoogeSortRec(l, h - t);
    }
  }

  yield* stoogeSortRec(0, arr.length - 1);

  yield { estadoActual: [...arr], indicesActivos: [], comparaciones, intercambios };
}