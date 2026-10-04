import type { SortStep } from "./types";

export function* mergeSort(array: number[]): Generator<SortStep> {
  const arr = [...array];

  function* mergeSortRec(inicio: number, fin: number): Generator<SortStep> {
    if (fin - inicio + 1 <= 1) return;

    const mid = inicio + Math.floor((fin - inicio + 1) / 2);

    yield* mergeSortRec(inicio, mid - 1);
    yield* mergeSortRec(mid, fin);

    yield* merge(inicio, mid, fin);
  }

  function* merge(
    inicio: number,
    mid: number,
    fin: number
  ): Generator<SortStep> {
    const leftHalf = arr.slice(inicio, mid);
    const rightHalf = arr.slice(mid, fin + 1);

    let i = 0;
    let j = 0;
    let k = inicio;

    while (i < leftHalf.length && j < rightHalf.length) {
      if (leftHalf[i] < rightHalf[j]) {
        arr[k] = leftHalf[i];
        i++;
      } else {
        arr[k] = rightHalf[j];
        j++;
      }

      yield { estadoActual: [...arr], indicesActivos: [k] };
      k++;
    }

    while (i < leftHalf.length) {
      arr[k] = leftHalf[i];
      i++;

      yield { estadoActual: [...arr], indicesActivos: [k] };
      k++;
    }

    while (j < rightHalf.length) {
      arr[k] = rightHalf[j];
      j++;

      yield { estadoActual: [...arr], indicesActivos: [k] };
      k++;
    }
  }

  yield* mergeSortRec(0, arr.length - 1);

  yield { estadoActual: [...arr], indicesActivos: [] };
}
