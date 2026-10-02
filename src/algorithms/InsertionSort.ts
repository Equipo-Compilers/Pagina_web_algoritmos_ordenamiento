import type { SortStep } from "./types";

export function* insertionSort(array: number[]): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;

    for(let i = 1; i < n; i++){
        let clave = arr[i];
        let j = i - 1;

        while(j >= 0 && arr[j] > clave){
            arr[j + 1] = arr[j];
            yield { estadoActual: [...arr], indicesActivos: [j, j + 1] };
            j -= 1;
        }
        arr[j + 1] = clave;
        yield { estadoActual: [...arr], indicesActivos: [j + 1] };
    }

    yield { estadoActual: [...arr], indicesActivos: [] };
}
