import type { SortStep } from "./types";

export function* gnomeSort(array: number[]): Generator<SortStep>{
    const arr = [...array];
    const n = arr.length;
    let i = 0;
    let comparaciones = 0;
    let intercambios = 0;

    while(i < n){
        if(i > 0) comparaciones++;
        
        if(i == 0 || arr[i] >= arr[i-1]){
            i +=1;
        } else{
            [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
            intercambios++
            yield { estadoActual: [...arr], indicesActivos: [i - 1 ,i], comparaciones, intercambios };
            i -= 1
        }
    }

    yield { estadoActual: [...arr], indicesActivos: [], comparaciones, intercambios };
}
