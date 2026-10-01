import type { SortStep } from "./types";

export function* selectionSort(array: number[]): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;

    for(let i = 0; i < n-1; i++){
        let minIdx = i;
        
        for(let j = i+1; j < n; j++){
            yield { estadoActual: [...arr], indicesActivos: [minIdx, j] };
            
            if(arr[j] < arr[minIdx]){
                minIdx=j;
            }
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            yield { estadoActual: [...arr], indicesActivos: [i, minIdx] };
        }
    }

    yield { estadoActual: [...arr], indicesActivos: [] };
}
