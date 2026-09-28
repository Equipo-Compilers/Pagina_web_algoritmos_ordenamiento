import { useState } from 'react';
import { bubbleSort } from './BubbleSort';
import './App.css';

export default function App() {
  const [arreglo, setArreglo] = useState<number[]>([64, 34, 25, 12, 22, 11, 90, 50, 80]);
  const [indicesActivos, setIndicesActivos] = useState<number[]>([]);
  const [ordenando, setOrdenando] = useState(false);

  const iniciarAnimacion = async () => {
    if (ordenando) return;
    setOrdenando(true);

    const generador = bubbleSort(arreglo);

    for (const paso of generador) {
      setArreglo(paso.estadoActual);
      setIndicesActivos(paso.indicesActivos);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIndicesActivos([]);
    setOrdenando(false);
  };

  const desordenar = () => {
    setArreglo((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="contenedor">
      <h1 className="titulo">Visualizador de Bubble Sort</h1>

      <div className="area-barras">
        {arreglo.map((valor, indice) => {
          const estaActivo = indicesActivos.includes(indice);
          return (
            <div
              key={indice}
              className={`barra ${estaActivo ? 'barra-activa' : ''}`}
              style={{ height: `${valor}px` }}
            >
              {valor}
            </div>
          );
        })}
      </div>

      <div className="controles">
        <button onClick={iniciarAnimacion} disabled={ordenando} className="boton boton-iniciar">
          {ordenando ? 'Ordenando...' : 'Iniciar Ordenamiento'}
        </button>

        <button onClick={desordenar} disabled={ordenando} className="boton boton-desordenar">
          Desordenar
        </button>
      </div>
    </div>
  );
}