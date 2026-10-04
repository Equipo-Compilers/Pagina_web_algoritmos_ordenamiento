export const codigosAlgoritmos: Record<string, string[]> = {
  bubble: [
    "for (let i = 0; i < n - 1; i++) {",
    "  let huboIntercambio = false;",
    "  for (let j = 0; j < n - 1 - i; j++) {",
    "    if (arr[j] > arr[j + 1]) {",
    "      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];",
    "      huboIntercambio = true;",
    "    }",
    "  }",
    "}"
  ],
 
  selection: [
    "for (let i = 0; i < n - 1; i++) {",
    "  let min = i;",
    "  for (let j = i + 1; j < n; j++) {",
    "    if (arr[j] < arr[min]) min = j;",
    "  }",
    "  if (min !== i) [arr[i], arr[min]] = [arr[min], arr[i]];",
    "}"
  ],
 
  insertion: [
    "for (let i = 1; i < n; i++) {",
    "  let key = arr[i];",
    "  let j = i - 1;",
    "  while (j >= 0 && arr[j] > key) {",
    "    arr[j + 1] = arr[j];",
    "    j--;",
    "  }",
    "  arr[j + 1] = key;",
    "}"
  ],
 
  gnome: [
    "let index = 0;",
    "while (index < n) {",
    "  if (index === 0 || arr[index] >= arr[index - 1]) {",
    "    index++;",
    "  } else {",
    "    [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];",
    "    index--;",
    "  }",
    "}"
  ],
 
  merge: [
    "function mergeSort(arr, inicio, fin) {",
    "  if (fin - inicio + 1 <= 1) return;",
    "  const mid = inicio + Math.floor((fin - inicio + 1) / 2);",
    "  mergeSort(arr, inicio, mid - 1);",
    "  mergeSort(arr, mid, fin);",
    "  merge(arr, inicio, mid, fin);",
    "}",
  ],
 
  quick: [
    "function quickSort(arr, inicio, fin) {",
    "  if (fin - inicio + 1 <= 1) return;",
    "  const pivot = arr[medio];",
    "  const left = elementos < pivot;",
    "  const middle = elementos === pivot;",
    "  const right = elementos > pivot;",
    "  colocar [left, middle, right] en arr;",
    "  quickSort(arr, inicio, inicio + left.length - 1);",
    "  quickSort(arr, inicio + left.length + middle.length, fin);",
    "}"
  ],

  exchange: [
    "for (let i = 0; i < n - 1; i++) {",
    "  for (let j = i + 1; j < n; j++) {",
    "    if (arr[i] > arr[j]) {",
    "      [arr[i], arr[j]] = [arr[j], arr[i]];",
    "    }",
    "  }",
    "}"
  ],
 
  stooge: [
    "function stoogeSort(arr, l, h) {",
    "  if (l >= h) return;",
    "  if (arr[l] > arr[h]) {",
    "    [arr[l], arr[h]] = [arr[h], arr[l]];",
    "  }",
    "  if (h - l + 1 > 2) {",
    "    const t = Math.floor((h - l + 1) / 3);",
    "    stoogeSort(arr, l, h - t);",
    "    stoogeSort(arr, l + t, h);",
    "    stoogeSort(arr, l, h - t);",
    "  }",
    "}"
  ]
};