import './App.css';
import { useState } from 'react';
import { generador, generadorOrdenado, generadorCasiInvertido } from './generador';
import { useSortAnimation } from './hooks/useSortAnimation';
import type { SortGenerator } from './hooks/useSortAnimation';
import { bubbleSort } from './algorithms/BubbleSort';
import { selectionSort } from './algorithms/SelectionSort';
import { insertionSort } from './algorithms/InsertionSort';
import { gnomeSort } from './algorithms/GnomeSort';
import { exchangeSort } from './algorithms/ExchangeSort';

const CANTIDAD = 15;
 
const algoritmos: Record<string, { nombre: string; fn: SortGenerator }> = {
  bubble: { nombre: 'Bubble Sort', fn: bubbleSort },
  selection: { nombre: 'Selection Sort', fn: selectionSort },
  insertion: { nombre: 'Insertion Sort', fn: insertionSort },
  gnome: { nombre: 'Gnome Sort', fn: gnomeSort },
  exchange: { nombre: 'Exchange Sort', fn: exchangeSort},
};
 
type AlgoritmoId = keyof typeof algoritmos;
 
export default function App() {
  const [algoritmoSeleccionado, setAlgoritmoSeleccionado] = useState<AlgoritmoId>('bubble');
  const [valorInput, setValorInput] = useState('');
 
  const { arreglo, indicesActivos, ordenando, iniciarAnimacion, reemplazarArreglo } =
    useSortAnimation(generador(CANTIDAD));
 
  const maximo = Math.max(...arreglo);
 
  const manejarArregloPersonalizado = () => {
    const numeros = valorInput
      .split(',')
      .map((parte) => parseInt(parte.trim(), 10))
      .filter((n) => !Number.isNaN(n));
 
    if (numeros.length > 0) {
      reemplazarArreglo(numeros);
    }
  };
 
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
            onClick={() => reemplazarArreglo(generador(CANTIDAD))}
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
              onClick={() => setAlgoritmoSeleccionado(id as AlgoritmoId)}
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
 
        <aside className="panelDerecho"> codigo</aside>
      </main>
 
      <footer className="controles">
        <button
          className="botonPildora"
          onClick={() => reemplazarArreglo(generador(CANTIDAD))}
          disabled={ordenando}
        >
          aleatorio
        </button>
        <button
          className="botonPildora"
          onClick={() => reemplazarArreglo(generadorOrdenado(CANTIDAD))}
          disabled={ordenando}
        >
          ordenado
        </button>
        <button
          className="botonPildora"
          onClick={() => reemplazarArreglo(generadorCasiInvertido(CANTIDAD))}
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
      </footer>
    </div>
  );
}