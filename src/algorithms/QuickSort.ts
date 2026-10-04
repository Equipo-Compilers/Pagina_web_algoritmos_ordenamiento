import type { SortStep } from "./types";

export function* quickSort(array: number[]): Generator<SortStep> {
  const arr = [...array];
  let comparaciones = 0;
  let intercambios = 0;

  function* quickSortRec(inicio: number, fin: number): Generator<SortStep> {
    if (fin - inicio + 1 <= 1) return;

    const sub = arr.slice(inicio, fin + 1);
    const pivot = sub[Math.floor(sub.length / 2)];

    comparaciones += sub.length;

    const left = sub.filter((x) => x < pivot);
    const middle = sub.filter((x) => x === pivot);
    const right = sub.filter((x) => x > pivot);

    const combinado = [...left, ...middle, ...right];
    for (let k = 0; k < combinado.length; k++) {
      if (arr[inicio + k] !== combinado[k]) {
        arr[inicio + k] = combinado[k];
        intercambios++;

        yield { estadoActual: [...arr], indicesActivos: [inicio + k], comparaciones, intercambios };
      }
    }

    yield* quickSortRec(inicio, inicio + left.length - 1);
    yield* quickSortRec(inicio + left.length + middle.length, fin);
  }

  yield* quickSortRec(0, arr.length - 1);

  yield { estadoActual: [...arr], indicesActivos: [], comparaciones, intercambios };
}