import type { SortStep } from "./types";

export function* selectionSort(array: number[]): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;
    let comparaciones = 0;
    let intercambios = 0;

    for(let i = 0; i < n-1; i++){
        let minIdx = i;
        
        for(let j = i+1; j < n; j++){
            comparaciones++;
            yield { estadoActual: [...arr], indicesActivos: [minIdx, j], comparaciones, intercambios };
            
            if(arr[j] < arr[minIdx]){
                minIdx=j;
            }
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            intercambios++;
            yield { estadoActual: [...arr], indicesActivos: [i, minIdx], comparaciones, intercambios };
        }
    }

    yield { estadoActual: [...arr], indicesActivos: [], comparaciones, intercambios };
}
