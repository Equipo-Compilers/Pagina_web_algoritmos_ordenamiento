import './App.css';
import { useState } from 'react';
import { generador } from './generador';

export default function App() {
  const [arreglo, setArreglo] = useState<number[]>(generador(15));
  const maximo = Math.max(...arreglo);
  return (
    <div className="pantallaCompleta"> 
<header className="cabecera">
  <span className="logo">the compilers</span>
  
  <div className="grupoBotones">
    <button className="botonPildora">start</button>
    <button className="botonPildora">reset</button> 
    <button className="botonPildora">graphic</button>
  </div>
</header>

<main className="areaCentral">

  <aside className="panelIzquierdo"> algoritmos</aside>

  <section className="lienzo"> 

    {arreglo.map((altura, index) => (
      <div key={index} className="barra" style={{ height: `${(altura *100)/maximo}%` }} >{altura}</div>

    ))}
  </section>

  <aside className="panelDerecho"> codigo</aside>
  
  </main>  


<footer className="controles">
  <button className="botonPildora" onClick={() => setArreglo(generador(15))}>
    aleatorio
  </button>
  <button className="botonPildora"> ordenado</button>
  <button className="botonPildora"> casi invertido</button>
  <input type="text" className="arregloUsuario" placeholder="arreglo"/>
</footer> 

    
    </div>);
  }
