import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Card from "./Card";
import AlgorithmInterface from "./Sort_Algorithms/AlgorithmInterface";
import GreedyInterface from "./Greedy_Algorithms/GreedyInterface";
import HuffmanInterface from "./Greedy_Algorithms/HuffmanInterface";


function Home() {
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
        <Route path="/Pagina_web_algoritmos_ordenamiento_tecnica_voraz/" element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/algoritmos" element={<AlgorithmInterface />} />
        <Route path="/algoritmo_huffman" element={<HuffmanInterface/>} />
        <Route path="/algoritmos_voracez" element={<GreedyInterface />} />
      </Routes>
    </BrowserRouter>
  );
}