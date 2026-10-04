import './App.css';
import { useState } from 'react';
import { generador } from './generador';
import { useSortAnimation } from './hooks/useSortAnimation';
import type { SortGenerator } from './hooks/useSortAnimation';
import { bubbleSort } from './algorithms/BubbleSort';
import { selectionSort } from './algorithms/SelectionSort';
import { insertionSort } from './algorithms/InsertionSort';
import { gnomeSort } from './algorithms/GnomeSort';
import { exchangeSort } from './algorithms/ExchangeSort';
import { stoogeSort } from './algorithms/StoogeSort';
import { quickSort } from './algorithms/QuickSort';
import { mergeSort } from './algorithms/MergeSort';
import { codigosAlgoritmos } from './algorithms/CodigosAlgoritmos';

const CANTIDAD_INICIAL = 18;
 
const algoritmos: Record<string, { nombre: string; fn: SortGenerator }> = {
  bubble: { nombre: 'Bubble Sort', fn: bubbleSort },
  selection: { nombre: 'Selection Sort', fn: selectionSort },
  insertion: { nombre: 'Insertion Sort', fn: insertionSort },
  gnome: { nombre: 'Gnome Sort', fn: gnomeSort },
  exchange: { nombre: 'Exchange Sort', fn: exchangeSort},
  stooge: { nombre: 'Stooge Sort', fn: stoogeSort},
  quick: { nombre: 'Quick Sort', fn: quickSort},
  merge: { nombre: 'Merge Sort', fn: mergeSort},
};

type AlgoritmoId = keyof typeof algoritmos;

export default function App() {
  const [velocidad, setVelocidad] = useState<number>(1);
  const [cantidad, setCantidad] = useState<number>(CANTIDAD_INICIAL);
  const [algoritmoSeleccionado, setAlgoritmoSeleccionado] = useState<AlgoritmoId>('bubble');
  const [valorInput, setValorInput] = useState('');

  const pausaMilisegundos = Math.round(150/velocidad);


  const { arreglo, indicesActivos, ordenando, iniciarAnimacion, detenerAnimacion, reemplazarArreglo,lineaActual } =
    useSortAnimation(generador(cantidad), pausaMilisegundos);


  const manejarArregloPersonalizado = () => {
    const numeros = valorInput.split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
    if (numeros.length > 0) {
      reemplazarArreglo(numeros);
      setValorInput('');
    }
  };

  const manejarCambioTamano = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaCantidad = Number(e.target.value);
    setCantidad(nuevaCantidad);
    reemplazarArreglo(generador(nuevaCantidad));
  };

  const maximo = Math.max(...arreglo);

  return (
    <div className="pantallaCompleta">
      <header className="cabecera">
        <span className="logo">the compilers</span>

        <div className="grupoBotones">
          <button
            className="botonPildora"
            onClick={() => iniciarAnimacion(algoritmos[algoritmoSeleccionado].fn)}
            disabled={ordenando}
          >
            {ordenando ? 'ordenando...' : 'start'}
          </button>
          
          
          <button
            className="botonPildora"
            onClick={detenerAnimacion}
            disabled={!ordenando}
          >
            stop
          </button>

          <button
            className="botonPildora"
            onClick={() => reemplazarArreglo(generador(cantidad))}
            disabled={ordenando}
          >
            reset
          </button>
          <button className="botonPildora">graphic</button>
        </div>
      </header>

      <main className="areaCentral">
        <aside className="panelIzquierdo">
          {Object.entries(algoritmos).map(([id, algoritmo]) => (
            <button
              key={id}
              onClick={() => {
                setAlgoritmoSeleccionado(id as AlgoritmoId);
                const desordenado = [...arreglo].sort(() => Math.random() - 0.5);
                reemplazarArreglo(desordenado);
              }}
              disabled={ordenando}
              className={`botonAlgoritmo ${algoritmoSeleccionado === id ? 'botonAlgoritmo-activo' : ''}`}
            >
              {algoritmo.nombre}
            </button>
          ))}
        </aside>

        <section className="lienzo">
          {arreglo.map((altura, indice) => {
            const estaActivo = indicesActivos.includes(indice);
            return (
              <div
                key={indice}
                className={`barra ${estaActivo ? 'barra-activa' : ''}`}
                style={{ height: `${(altura * 100) / maximo}%` }}
              >
                {altura}
              </div>
            );
          })}
        </section>

        
        <aside className="panelDerecho panelDerecho-codigo">
          <div className="codigoTitulo">Código en ejecución</div>
          {(codigosAlgoritmos[algoritmoSeleccionado] || ["Selecciona un algoritmo"]).map((lineaTexto, idx) => {
            const numeroLineaReal = idx + 1;
            const esLineaActiva = lineaActual === numeroLineaReal; 
            return (
              <div 
                key={idx} 
                className={`lineaCodigo ${esLineaActiva ? 'lineaActiva' : ''}`}
              >
                {lineaTexto}
              </div>
            );
          })}
        </aside>

      </main>

      <footer className="controles">
        <button
          className="botonPildora"
          onClick={() => reemplazarArreglo(generador(cantidad))}
          disabled={ordenando}
        >
          aleatorio
        </button>

       <button
          className="botonPildora"
          onClick={() => {
            const invertido = [...arreglo].sort((a, b) => b - a);
            if (invertido.length > 1) {
              const temp = invertido[0];
              invertido[0] = invertido[1];
              invertido[1] = temp;
            }
            reemplazarArreglo(invertido);
          }}
          disabled={ordenando}
        >
          casi invertido
        </button>
        
        <input
          type="text"
          className="arregloUsuario"
          placeholder="ej: 5, 3, 8, 1"
          value={valorInput}
          onChange={(e) => setValorInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && manejarArregloPersonalizado()}
          disabled={ordenando}
        />

        <div className="controlVelocidad">
          <label>tamaño del arreglo: {cantidad}</label>
          <input
            type="range"
            min={5}
            max={40}
            value={cantidad}
            onChange={manejarCambioTamano}
            disabled={ordenando}
          />
        </div>

        <div className="controlVelocidad">
          <label>velocidad</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0.5, 1, 4, 8, 16].map((mult) => (
              <button
                key={mult}
                className={`botonPildora ${velocidad === mult ? 'botonAlgoritmo-activo' : ''}`}
                onClick={() => setVelocidad(mult)}
                
                style={{ padding: '8px 12px', minWidth: '45px', cursor: 'pointer' }}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

      </footer>
    </div>
  );
}