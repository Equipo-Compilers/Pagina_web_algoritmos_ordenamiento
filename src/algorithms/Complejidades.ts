export interface Complejidad {
  mejor: string;
  promedio: string;
  peor: string;
  espacio: string;
}

export const complejidades: Record<string, Complejidad> = {
  bubble: { mejor: 'O(n)', promedio: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)' },
  selection: { mejor: 'O(n²)', promedio: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)' },
  insertion: { mejor: 'O(n)', promedio: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)' },
  gnome: { mejor: 'O(n)', promedio: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)' },
  exchange: { mejor: 'O(n²)', promedio: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)' },
  stooge: { mejor: 'O(n^2.71)', promedio: 'O(n^2.71)', peor: 'O(n^2.71)', espacio: 'O(n)' },
  quick: { mejor: 'O(n log n)', promedio: 'O(n log n)', peor: 'O(n²)', espacio: 'O(n)' },
  merge: { mejor: 'O(n log n)', promedio: 'O(n log n)', peor: 'O(n log n)', espacio: 'O(n)' },
};