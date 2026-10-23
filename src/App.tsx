import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AlgorithmInterface from "./Sort_Algorithms/AlgorithmInterface";
import GreddyInterface from "./Greedy_Algorithms/GreedyInterface";

function Inicio() {
    return (
        <div className="container">
            <div className="enlaces">
                <Link to="/algoritmos">Ir a visualizar algoritmos</Link>
                <Link to="/algoritmos_voracez">Ir a algoritmos voracez</Link>
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