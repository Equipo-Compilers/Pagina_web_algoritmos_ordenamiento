import type { SortStep } from './types';

export function* insertionSort(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const n = arr.length;
  let comparaciones = 0;
  let intercambios = 0;

  for (let i = 1; i < n; i++) {
    const clave = arr[i];
    let j = i - 1;

    while (j >= 0) {
      comparaciones++;
      if (arr[j] <= clave) break;

      arr[j + 1] = arr[j];
      intercambios++;
      yield { estadoActual: [...arr], indicesActivos: [j, j + 1], comparaciones, intercambios };
      j -= 1;
    }

    arr[j + 1] = clave;
    yield { estadoActual: [...arr], indicesActivos: [j + 1], comparaciones, intercambios };
  }

  yield { estadoActual: [...arr], indicesActivos: [], comparaciones, intercambios };
}
