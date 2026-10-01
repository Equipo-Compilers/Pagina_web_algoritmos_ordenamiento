export interface SortStep {
  estadoActual: number[];
  indicesActivos: number[];
}

export function* bubbleSort(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let huboIntercambio = false;

    // Reducimos el rango en cada pasada: los últimos "i" elementos ya quedaron ordenados
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        huboIntercambio = true;

        // Regresa cada vez que se realiza un intercambio
        yield { estadoActual: [...arr], indicesActivos: [j, j + 1] };
      }
    }

    // Si no hubo ningún intercambio, el arreglo ya está ordenado: cortamos antes
    if (!huboIntercambio) break;
  }

  yield { estadoActual: [...arr], indicesActivos: [] };
}