import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AlgorithmInterface from "./Sort_Algorithms/AlgorithmInterface";
import GreddyInterface from "./Greedy_Algorithms/GreedyInterface";

function Inicio() {
    return (
      
        <div className="body">
          <header className="cabecera">
             <h1>Algorithmview</h1>
            <img src="../\Pagina_web_algoritmos_ordenamiento\Pagina_web_algoritmos_ordenamiento\src\Logo" alt="logo" className="logo"/>
           

          </header>
            <div className="enlaces">
               <div className="contenedorEnlaces"><Link to="/algoritmos">Ir a visualizar algoritmos</Link></div> 
               <div className="contenedorEnlaces"> <Link to="/algoritmos_voracez">Ir a algoritmos voracez</Link></div>
            </div>
        </div>
    );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Pagina_web_algoritmos_ordenamiento_tecnica_voraz/" element={<Inicio />} />
        <Route path="/" element={<Inicio />} />
        <Route path="/algoritmos" element={< AlgorithmInterface />} />
        <Route path="/algoritmos_voracez" element={< GreddyInterface />} />
      </Routes>
    </BrowserRouter>
  );
}