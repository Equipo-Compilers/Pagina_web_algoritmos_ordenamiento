import { useState } from 'react';
import type { SortStep } from '../algorithms/types';
 
export type SortGenerator = (array: number[]) => Generator<SortStep>;
 
export function useSortAnimation(arregloInicial: number[]) {
  const [arreglo, setArreglo] = useState<number[]>(arregloInicial);
  const [indicesActivos, setIndicesActivos] = useState<number[]>([]);
  const [ordenando, setOrdenando] = useState(false);
 
  const iniciarAnimacion = async (algoritmo: SortGenerator, velocidadMs = 150) => {
    if (ordenando) return;
    setOrdenando(true);
 
    const generadorPasos = algoritmo(arreglo);
 
    for (const paso of generadorPasos) {
      setArreglo(paso.estadoActual);
      setIndicesActivos(paso.indicesActivos);
      await new Promise((resolve) => setTimeout(resolve, velocidadMs));
    }
 
    setIndicesActivos([]);
    setOrdenando(false);
  };
 
  const reemplazarArreglo = (nuevo: number[]) => {
    if (ordenando) return;
    setArreglo(nuevo);
    setIndicesActivos([]);
  };
 
  return { arreglo, indicesActivos, ordenando, iniciarAnimacion, reemplazarArreglo };
}