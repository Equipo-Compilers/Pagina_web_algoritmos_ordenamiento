export function generador(cantidad: number) {
const arreglo =[];
for (let i = 0; i < cantidad; i++) {
  arreglo.push(Math.floor(Math.random() * 600)+1);
}
return arreglo;
}