import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Card from "./Card";
import AlgorithmInterface from "./Sort_Algorithms/AlgorithmInterface";
import GreedyInterface from "./Greedy_Algorithms/GreedyInterface";
import HuffmanInterface from "./Greedy_Algorithms/HuffmanInterface";

function Home() {
    return (
        <div className="page">
            <header className="header">
                <h1 className="header-title">Algorithmview</h1>
            </header>

            <div className="card-container">
                <Card
                    title="Algoritmos de ordenamiento"
                    backgroundColor="#1f2937"
                    tags={["Bubble Sort", "Quick Sort", "Merge Sort"]}
                    route="/algoritmos"
                    animationType="ordenamiento"
                />
                <Card
                    title="Algoritmo de Huffman"
                    backgroundColor="#374151"
                    tags={["Huffman"]}
                    route="/algoritmo_huffman"
                    animationType="huffman"
                />
                <Card
                    title="Compresor de libros"
                    backgroundColor="#374151"
                    tags={["Compresor"]}
                    route="/algoritmos_voracez"
                    animationType="compresor"
                />
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