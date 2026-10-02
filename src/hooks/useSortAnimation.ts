import { useState } from 'react';
import type { SortStep } from '../algorithms/types';
 
export type SortGenerator = (array: number[]) => Generator<SortStep>;
 
export function useSortAnimation(arregloInicial: number[]) {
  const [arreglo, setArreglo] = useState<number[]>(arregloInicial);
  const [indicesActivos, setIndicesActivos] = useState<number[]>([]);
  const [ordenando, setOrdenando] = useState(false);
 
  const iniciarAnimacion = async (algoritmo: SortGenerator, velocidadMs = 300) => {
    if (ordenando) return;
    setOrdenando(true);
 
    const generador = algoritmo(arreglo);
 
    for (const paso of generador) {
      setArreglo(paso.estadoActual);
      setIndicesActivos(paso.indicesActivos);
      await new Promise((resolve) => setTimeout(resolve, velocidadMs));
    }
 
    setIndicesActivos([]);
    setOrdenando(false);
  };
 
  const desordenar = () => {
    if (ordenando) return;
    setArreglo((prev) => [...prev].sort(() => Math.random() - 0.5));
  };
 
  return { arreglo, indicesActivos, ordenando, iniciarAnimacion, desordenar };
}