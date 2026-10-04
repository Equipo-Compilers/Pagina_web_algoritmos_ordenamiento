import { useState } from 'react';
import { generador } from '../generador';
import { useSortAnimation } from '../hooks/useSortAnimation';
import type { SortGenerator } from '../hooks/useSortAnimation';
import { complejidades } from '../algorithms/Complejidades';
import './DualComparasion.css';

interface AlgoritmoInfo {
  nombre: string;
  fn: SortGenerator;
}

interface DualComparisionProps {
  algoritmos: Record<string, AlgoritmoInfo>;
  cantidad: number;
  onCerrar: () => void;
}

const PAUSA_MS = 150;

export default function DualComparision({ algoritmos, cantidad, onCerrar }: DualComparisionProps) {
  const ids = Object.keys(algoritmos);

  const [algoA, setAlgoA] = useState<string>(ids[0]);
  const [algoB, setAlgoB] = useState<string>(ids[1] ?? ids[0]);

  const [arregloBase] = useState<number[]>(() => generador(cantidad));

  const ladoA = useSortAnimation(arregloBase, PAUSA_MS);
  const ladoB = useSortAnimation(arregloBase, PAUSA_MS);

  const ordenando = ladoA.ordenando || ladoB.ordenando;
  const mismoAlgoritmo = algoA === algoB;

  const reiniciar = () => {
    const nuevo = generador(cantidad);
    ladoA.reemplazarArreglo([...nuevo]);
    ladoB.reemplazarArreglo([...nuevo]);
  };

  const iniciar = () => {
    if (mismoAlgoritmo || ordenando) return;
    ladoA.iniciarAnimacion(algoritmos[algoA].fn);
    ladoB.iniciarAnimacion(algoritmos[algoB].fn);
  };

  const maximoA = Math.max(...ladoA.arreglo);
  const maximoB = Math.max(...ladoB.arreglo);

  const renderLado = (
    idSeleccionado: string,
    cambiarId: (id: string) => void,
    lado: typeof ladoA,
    maximo: number
  ) => (
    <div className="columnaComparacion">
      <select
        className="selectComparacion"
        value={idSeleccionado}
        onChange={(e) => {
          cambiarId(e.target.value);
          reiniciar();
        }}
        disabled={ordenando}
      >
        {ids.map((id) => (
          <option key={id} value={id}>{algoritmos[id].nombre}</option>
        ))}
      </select>

      <div className="lienzoComparacion">
        {lado.arreglo.map((valor, indice) => (
          <div
            key={indice}
            className={`barraComparacion ${lado.indicesActivos.includes(indice) ? 'barraComparacion-activa' : ''}`}
            style={{ height: `${(valor * 100) / maximo}%` }}
          >
            {valor}
          </div>
        ))}
      </div>

      <div className="estadisticasComparacion">
        <div><strong>Comparaciones:</strong> {lado.estadisticas.comparaciones}</div>
        <div><strong>Intercambios:</strong> {lado.estadisticas.intercambios}</div>
        <div><strong>Pasos:</strong> {lado.estadisticas.pasos}</div>
        <div><strong>Tiempo:</strong> {lado.estadisticas.tiempoMs.toFixed(0)} ms</div>
        <div className="separadorComparacion" />
        <div>Mejor caso: {complejidades[idSeleccionado]?.mejor}</div>
        <div>Promedio: {complejidades[idSeleccionado]?.promedio}</div>
        <div>Peor caso: {complejidades[idSeleccionado]?.peor}</div>
        <div>Espacio: {complejidades[idSeleccionado]?.espacio}</div>
      </div>
    </div>
  );

  return (
    <div className="fondoComparacion" onClick={onCerrar}>
      <div className="modalComparacion" onClick={(e) => e.stopPropagation()}>
        <div className="encabezadoComparacion">
          <h2 className="tituloComparacion">Comparar dos algoritmos</h2>
          <button className="botonCerrarComparacion" onClick={onCerrar}>✕</button>
        </div>

        {mismoAlgoritmo && (
          <p className="avisoComparacion">Elige dos algoritmos distintos para comparar.</p>
        )}

        <div className="columnasComparacion">
          {renderLado(algoA, setAlgoA, ladoA, maximoA)}
          <div className="vsComparacion">VS</div>
          {renderLado(algoB, setAlgoB, ladoB, maximoB)}
        </div>

        <div className="controlesComparacion">
          <button className="botonComparacion" onClick={reiniciar} disabled={ordenando}>
            reiniciar
          </button>
          <button
            className="botonComparacion botonComparacion-iniciar"
            onClick={iniciar}
            disabled={ordenando || mismoAlgoritmo}
          >
            {ordenando ? 'ordenando...' : 'iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}