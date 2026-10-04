import type { SortGenerator } from "../hooks/useSortAnimation";

export interface PuntoMedicion {
  tamano: number;
  tiempoA: number; // en milisegundos
  tiempoB: number; // en milisegundos
}

export interface ResultadoComparacion {
  nombreA: string;
  nombreB: string;
  puntos: PuntoMedicion[];
  ganador: string;
  veces: number;
  resumen: string;
}

// Mismos tamaños que la gráfica de Python
const TAMANOS = [20, 40, 60, 80, 100];
const TIEMPO_MINIMO_MS = 20; // cada medición dura al menos esto

function generarArreglo(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 1);
}

// Ejecuta el algoritmo muchas veces seguidas y devuelve el promedio por ejecución.
// Así el redondeo del reloj del navegador deja de afectar la medición.
function medir(algoritmo: SortGenerator, base: number[]): number {
  let ejecuciones = 0;
  const inicio = performance.now();
  let fin = inicio;

  do {
    const it = algoritmo(base);
    while (!it.next().done) {
      // solo consumimos los pasos
    }
    ejecuciones++;
    fin = performance.now();
  } while (fin - inicio < TIEMPO_MINIMO_MS);

  return (fin - inicio) / ejecuciones;
}

export function compararAlgoritmos(
  nombreA: string,
  algA: SortGenerator,
  nombreB: string,
  algB: SortGenerator,
  tamanos: number[] = TAMANOS
): ResultadoComparacion {
  const puntos: PuntoMedicion[] = tamanos.map((tamano) => {
    // Un solo arreglo por tamaño, el mismo para los dos algoritmos
    const base = generarArreglo(tamano);

    // Calentamiento para que la primera medición no salga inflada
    medir(algA, base);
    medir(algB, base);

    return {
      tamano,
      tiempoA: medir(algA, base),
      tiempoB: medir(algB, base),
    };
  });

  // Conclusión con base en el tamaño más grande
  const ultimo = puntos[puntos.length - 1];
  const aGana = ultimo.tiempoA <= ultimo.tiempoB;
  const rapido = Math.min(ultimo.tiempoA, ultimo.tiempoB);
  const lento = Math.max(ultimo.tiempoA, ultimo.tiempoB);
  const veces = rapido > 0 ? lento / rapido : 1;
  const ganador = aGana ? nombreA : nombreB;
  const perdedor = aGana ? nombreB : nombreA;

  const resumen =
    veces < 1.05
      ? `${nombreA} y ${nombreB} tardaron prácticamente lo mismo con ${ultimo.tamano} elementos.`
      : `${ganador} fue ${veces.toFixed(1)}x más eficiente que ${perdedor} con ${ultimo.tamano} elementos.`;

  return { nombreA, nombreB, puntos, ganador, veces, resumen };
}

// Paso "bonito" para el eje Y (1, 2 o 5 por una potencia de 10)
function pasoBonito(maximo: number, divisiones: number): number {
  const crudo = maximo / divisiones;
  const magnitud = Math.pow(10, Math.floor(Math.log10(crudo)));
  const normalizado = crudo / magnitud;
  const factor = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  return factor * magnitud;
}

// Devuelve la gráfica como texto SVG, al estilo de la gráfica de clase
export function generarGraficaSVG(resultado: ResultadoComparacion): string {
  const { puntos, nombreA, nombreB } = resultado;

  const ancho = 640;
  const alto = 420;
  const m = { izq: 85, der: 25, arriba: 45, abajo: 60 };
  const areaAncho = ancho - m.izq - m.der;
  const areaAlto = alto - m.arriba - m.abajo;

  // Colores por defecto de matplotlib
  const colorA = "#1f77b4";
  const colorB = "#ff7f0e";

  // Tiempos en segundos, como en la gráfica de Python
  const datosA = puntos.map((p) => p.tiempoA / 1000);
  const datosB = puntos.map((p) => p.tiempoB / 1000);
  const maxDato = Math.max(...datosA, ...datosB, 1e-9);

  // Márgenes del 5% como matplotlib
  const tamMin = puntos[0].tamano;
  const tamMax = puntos[puntos.length - 1].tamano;
  const margenX = (tamMax - tamMin) * 0.05 || 1;
  const xMin = tamMin - margenX;
  const xMax = tamMax + margenX;

  const paso = pasoBonito(maxDato, 5);
  const yMin = -maxDato * 0.05;
  const yMax = maxDato * 1.05;
  const decimales = Math.min(8, Math.max(0, -Math.floor(Math.log10(paso))));

  const x = (t: number) => m.izq + ((t - xMin) / (xMax - xMin)) * areaAncho;
  const y = (v: number) => m.arriba + areaAlto - ((v - yMin) / (yMax - yMin)) * areaAlto;

  // Cuadrícula y marcas del eje Y
  let cuadriculaY = "";
  for (let v = 0; v <= yMax; v += paso) {
    cuadriculaY += `
      <line x1="${m.izq}" y1="${y(v)}" x2="${ancho - m.der}" y2="${y(v)}" stroke="#b0b0b0" stroke-width="0.8"/>
      <line x1="${m.izq - 5}" y1="${y(v)}" x2="${m.izq}" y2="${y(v)}" stroke="#000" />
      <text x="${m.izq - 9}" y="${y(v) + 4}" text-anchor="end" fill="#000" font-size="11">${v.toFixed(decimales)}</text>`;
  }

  // Cuadrícula y marcas del eje X, cada 10 elementos
  let cuadriculaX = "";
  for (let t = Math.ceil(tamMin / 10) * 10; t <= tamMax; t += 10) {
    cuadriculaX += `
      <line x1="${x(t)}" y1="${m.arriba}" x2="${x(t)}" y2="${m.arriba + areaAlto}" stroke="#b0b0b0" stroke-width="0.8"/>
      <line x1="${x(t)}" y1="${m.arriba + areaAlto}" x2="${x(t)}" y2="${m.arriba + areaAlto + 5}" stroke="#000" />
      <text x="${x(t)}" y="${m.arriba + areaAlto + 20}" text-anchor="middle" fill="#000" font-size="11">${t}</text>`;
  }

  const linea = (datos: number[], color: string, etiqueta: string) => {
    const ruta = puntos
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.tamano)} ${y(datos[i])}`)
      .join(" ");
    const circulos = puntos
      .map(
        (p, i) =>
          `<circle cx="${x(p.tamano)}" cy="${y(datos[i])}" r="4" fill="${color}"><title>${etiqueta}, ${p.tamano} elementos: ${datos[i].toFixed(8)} s</title></circle>`
      )
      .join("");
    return `<path d="${ruta}" fill="none" stroke="${color}" stroke-width="2"/>${circulos}`;
  };

  return `
<svg viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:sans-serif">
  <rect x="0" y="0" width="${ancho}" height="${alto}" fill="#ffffff" rx="8"/>
  <text x="${m.izq + areaAncho / 2}" y="26" text-anchor="middle" fill="#000" font-size="15">Comparación de algoritmos de ordenamiento</text>
  ${cuadriculaY}
  ${cuadriculaX}
  <rect x="${m.izq}" y="${m.arriba}" width="${areaAncho}" height="${areaAlto}" fill="none" stroke="#000"/>
  ${linea(datosA, colorA, nombreA)}
  ${linea(datosB, colorB, nombreB)}
  <text x="${m.izq + areaAncho / 2}" y="${alto - 14}" text-anchor="middle" fill="#000" font-size="12">Número de elementos</text>
  <text transform="translate(18 ${m.arriba + areaAlto / 2}) rotate(-90)" text-anchor="middle" fill="#000" font-size="12">Tiempo (segundos)</text>
  <g transform="translate(${m.izq + 10} ${m.arriba + 10})">
    <rect x="0" y="0" width="150" height="50" rx="4" fill="#ffffff" fill-opacity="0.9" stroke="#cccccc"/>
    <line x1="8" y1="16" x2="30" y2="16" stroke="${colorA}" stroke-width="2"/><circle cx="19" cy="16" r="4" fill="${colorA}"/>
    <text x="38" y="20" fill="#000" font-size="12">${nombreA}</text>
    <line x1="8" y1="36" x2="30" y2="36" stroke="${colorB}" stroke-width="2"/><circle cx="19" cy="36" r="4" fill="${colorB}"/>
    <text x="38" y="40" fill="#000" font-size="12">${nombreB}</text>
  </g>
</svg>`;
}

