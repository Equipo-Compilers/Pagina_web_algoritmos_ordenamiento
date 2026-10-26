import { useState, useRef, useEffect } from 'react';
import type { SortStep } from '../algorithms/types';

export type SortGenerator = (array: number[]) => Generator<SortStep>;

export interface Estadisticas {
  comparaciones: number;
  intercambios: number;
  pasos: number;
  tiempoMs: number;
}

const ESTADISTICAS_INICIALES: Estadisticas = {
  comparaciones: 0,
  intercambios: 0,
  pasos: 0,
  tiempoMs: 0,
};

export function useSortAnimation(arregloInicial: number[], velocidadActual: number) {
  const [arreglo, setArreglo] = useState<number[]>(arregloInicial);
  const [indicesActivos, setIndicesActivos] = useState<number[]>([]);
  const [ordenando, setOrdenando] = useState(false);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>(ESTADISTICAS_INICIALES);

  const [lineaActual, setLineaActual] = useState<number>(1);

  const velocidadRef = useRef(velocidadActual);
  const detenerRef = useRef(false);

  const estadisticasBaseRef = useRef<Estadisticas>(ESTADISTICAS_INICIALES);

  useEffect(() => {
    velocidadRef.current = velocidadActual;
  }, [velocidadActual]);


  const iniciarAnimacion = async (algoritmo: SortGenerator) => {
    if (ordenando) return;
    setOrdenando(true);
    detenerRef.current = false;

    const base = estadisticasBaseRef.current;
    const tiempoInicio = performance.now();
    const generadorPasos = algoritmo(arreglo);
    let contadorPaso = 0;
    let ultimoComparaciones = 0;
    let ultimoIntercambios = 0;

    let arregloAnterior = [...arreglo];
    let ultimoIndice = -1;

    for (const paso of generadorPasos) {
      if (detenerRef.current) break;

      contadorPaso++;
      ultimoComparaciones = paso.comparaciones ?? 0;
      ultimoIntercambios = paso.intercambios ?? 0;

      const huboCambio = paso.estadoActual.some((val, idx) => val !== arregloAnterior[idx]);
      const indiceActual = paso.indicesActivos[0] ?? -1;


      if (indiceActual !== -1 && ultimoIndice !== -1 && indiceActual < ultimoIndice) {
        setLineaActual(1);
        await new Promise((resolve) => setTimeout(resolve, velocidadRef.current / 2));
      }
      ultimoIndice = indiceActual;

      setLineaActual(4);
      setIndicesActivos(paso.indicesActivos);

      setEstadisticas({
        comparaciones: base.comparaciones + ultimoComparaciones,
        intercambios: base.intercambios + ultimoIntercambios,
        pasos: base.pasos + contadorPaso,
        tiempoMs: base.tiempoMs + (performance.now() - tiempoInicio),
      });

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

    estadisticasBaseRef.current = {
      comparaciones: base.comparaciones + ultimoComparaciones,
      intercambios: base.intercambios + ultimoIntercambios,
      pasos: base.pasos + contadorPaso,
      tiempoMs: base.tiempoMs + (performance.now() - tiempoInicio),
    };

    setIndicesActivos([]);
    setOrdenando(false);
  };

  const reemplazarArreglo = (nuevo: number[]) => {
    if (ordenando) return;
    setArreglo(nuevo);
    setIndicesActivos([]);
    setEstadisticas(ESTADISTICAS_INICIALES);
    estadisticasBaseRef.current = ESTADISTICAS_INICIALES;
  };

  const detenerAnimacion = () => {
    detenerRef.current = true;
  };

  return {
    arreglo,
    indicesActivos,
    ordenando,
    iniciarAnimacion,
    detenerAnimacion,
    reemplazarArreglo,
    lineaActual,
    estadisticas,
  };
}