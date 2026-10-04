import { useState, useRef, useEffect } from 'react';
import type { SortStep } from '../algorithms/types';
 
export type SortGenerator = (array: number[]) => Generator<SortStep>;
 
export function useSortAnimation(arregloInicial: number[],velocidadActual: number) {
  const [arreglo, setArreglo] = useState<number[]>(arregloInicial);
  const [indicesActivos, setIndicesActivos] = useState<number[]>([]);
  const [ordenando, setOrdenando] = useState(false);
 
  const cancelarRef = useRef(false);
  const [lineaActual, setLineaActual] = useState<number>(1);
 
  const velocidadRef = useRef(velocidadActual);
  const detenerRef = useRef(false);

  useEffect(() => {
    velocidadRef.current = velocidadActual;
  }, [velocidadActual]);


  const iniciarAnimacion = async (algoritmo: SortGenerator, velocidadMs = 150) => {
    if (ordenando) return;
    setOrdenando(true);
    detenerRef.current = false;

    const generadorPasos = algoritmo(arreglo);
    let contadorPaso = 1;

 
    

 let arregloAnterior = [...arreglo];
 let ultimoIndice = -1;

    for (const paso of generadorPasos) {
      if (detenerRef.current) break;
      
     
  const huboCambio = paso.estadoActual.some((val, idx) => val !== arregloAnterior[idx]);      
      const indiceActual = paso.indicesActivos[0] ?? -1;

      
      if (indiceActual !== -1 && ultimoIndice !== -1 && indiceActual < ultimoIndice) {
        setLineaActual(1);
        await new Promise((resolve) => setTimeout(resolve, velocidadRef.current / 2));
      }
      ultimoIndice = indiceActual;

      setLineaActual(4);
      setIndicesActivos(paso.indicesActivos);
      
      await new Promise((resolve) => setTimeout(resolve, velocidadRef.current / 2));

      
      if (huboCambio) {
        setLineaActual(5); 
      } else {
        setLineaActual(3);
      }
      
      setArreglo(paso.estadoActual);
      arregloAnterior = [...paso.estadoActual];

      
      await new Promise((resolve) => setTimeout(resolve, velocidadRef.current / 2));
    }







 
    setIndicesActivos([]);
    setOrdenando(false);
  };
 
  const reemplazarArreglo = (nuevo: number[]) => {
    if (ordenando) return;
    setArreglo(nuevo);
    setIndicesActivos([]);
  };
  const detenerAnimacion = () => {
    detenerRef.current = true;
  };
 
  return { arreglo, indicesActivos, ordenando, iniciarAnimacion, detenerAnimacion, reemplazarArreglo,lineaActual };

}