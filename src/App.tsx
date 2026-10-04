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
import { complejidades } from './algorithms/Complejidades';
import { compararAlgoritmos, generarGraficaSVG } from './algorithms/Graficas';

const CANTIDAD_INICIAL = 18;

const algoritmos: Record<string, { nombre: string; fn: SortGenerator }> = {
  bubble: { nombre: 'Bubble Sort', fn: bubbleSort },
  selection: { nombre: 'Selection Sort', fn: selectionSort },
  insertion: { nombre: 'Insertion Sort', fn: insertionSort },
  gnome: { nombre: 'Gnome Sort', fn: gnomeSort },
  exchange: { nombre: 'Exchange Sort', fn: exchangeSort },
  stooge: { nombre: 'Stooge Sort', fn: stoogeSort },
  quick: { nombre: 'Quick Sort', fn: quickSort },
  merge: { nombre: 'Merge Sort', fn: mergeSort },
};

type AlgoritmoId = keyof typeof algoritmos;

export default function App() {
  const [velocidad, setVelocidad] = useState<number>(1);
  const [cantidad, setCantidad] = useState<number>(CANTIDAD_INICIAL);
  const [algoritmoSeleccionado, setAlgoritmoSeleccionado] = useState<AlgoritmoId>('bubble');
  const [valorInput, setValorInput] = useState('');
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);

  // Estados de la gráfica comparativa
  const [mostrarGrafica, setMostrarGrafica] = useState(false);
  const [algoA, setAlgoA] = useState<AlgoritmoId>('bubble');
  const [algoB, setAlgoB] = useState<AlgoritmoId>('quick');
  const [graficaSVG, setGraficaSVG] = useState<string | null>(null);
  const [resumen, setResumen] = useState('');
  const [calculando, setCalculando] = useState(false);

  const pausaMilisegundos = Math.round(150 / velocidad);

  const {
    arreglo,
    indicesActivos,
    ordenando,
    iniciarAnimacion,
    detenerAnimacion,
    reemplazarArreglo,
    lineaActual,
    estadisticas,
  } = useSortAnimation(generador(cantidad), pausaMilisegundos);

  const manejarArregloPersonalizado = () => {
    const numeros = valorInput
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
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

  const manejarGraficar = () => {
    setCalculando(true);
    setGraficaSVG(null);

    // El setTimeout deja que se pinte "calculando..." antes de medir
    setTimeout(() => {
      const usaStooge = algoA === 'stooge' || algoB === 'stooge';
      // Stooge Sort es muy lento, por eso se usan tamaños menores con él
      const tamanos = usaStooge ? [10, 20, 30, 40, 50] : undefined;

      const resultado = compararAlgoritmos(
        algoritmos[algoA].nombre,
        algoritmos[algoA].fn,
        algoritmos[algoB].nombre,
        algoritmos[algoB].fn,
        tamanos
      );
      setGraficaSVG(generarGraficaSVG(resultado));
      setResumen(resultado.resumen);
      setCalculando(false);
    }, 50);
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

          <button
            className="botonPildora"
            onClick={() => setMostrarGrafica(true)}
            disabled={ordenando}
          >
            graphic
          </button>
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
          <button
            className="iconoEstadisticas"
            onClick={() => setMostrarEstadisticas((v) => !v)}
            title="Ver estadísticas"
          >
            📊
          </button>

          {mostrarEstadisticas && (
            <div className="panelEstadisticas">
              <div><strong>Comparaciones:</strong> {estadisticas.comparaciones}</div>
              <div><strong>Intercambios:</strong> {estadisticas.intercambios}</div>
              <div><strong>Pasos:</strong> {estadisticas.pasos}</div>
              <div><strong>Tiempo:</strong> {estadisticas.tiempoMs.toFixed(0)} ms</div>
              <div className="separadorEstadisticas" />
              <div><strong>Complejidad teórica</strong></div>
              <div>Mejor caso: {complejidades[algoritmoSeleccionado]?.mejor}</div>
              <div>Promedio: {complejidades[algoritmoSeleccionado]?.promedio}</div>
              <div>Peor caso: {complejidades[algoritmoSeleccionado]?.peor}</div>
              <div>Espacio: {complejidades[algoritmoSeleccionado]?.espacio}</div>
            </div>
          )}

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
          {(codigosAlgoritmos[algoritmoSeleccionado] || ['Selecciona un algoritmo']).map((lineaTexto, idx) => {
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

      {mostrarGrafica && (
        <div className="fondoModal" onClick={() => setMostrarGrafica(false)}>
          <div className="modalGrafica" onClick={(e) => e.stopPropagation()}>
            <div className="selectoresGrafica">
              <select value={algoA} onChange={(e) => setAlgoA(e.target.value as AlgoritmoId)}>
                {Object.entries(algoritmos).map(([id, a]) => (
                  <option key={id} value={id}>{a.nombre}</option>
                ))}
              </select>
              <span>vs</span>
              <select value={algoB} onChange={(e) => setAlgoB(e.target.value as AlgoritmoId)}>
                {Object.entries(algoritmos).map(([id, a]) => (
                  <option key={id} value={id}>{a.nombre}</option>
                ))}
              </select>
              <button
                className="botonPildora"
                onClick={manejarGraficar}
                disabled={calculando || algoA === algoB}
              >
                {calculando ? 'calculando...' : 'graficar'}
              </button>
            </div>

            {algoA === algoB && (
              <p className="resumenGrafica">Elige dos algoritmos distintos.</p>
            )}

            {graficaSVG && (
              <>
                <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: graficaSVG }} />
                <p className="resumenGrafica">{resumen}</p>
              </>
            )}

            <button className="botonPildora" onClick={() => setMostrarGrafica(false)}>
              cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
