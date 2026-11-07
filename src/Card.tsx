import { Link } from "react-router-dom";
import "./Card.css";

type TipoAnimacion = "ordenamiento" | "huffman" | "compresor";

interface CardProps {
  title: string;
  backgroundColor: string;
  tags: string[];
  route: string;
  animationType?: TipoAnimacion;
}

export default function Card({ title, backgroundColor, tags, route, animationType }: CardProps){
    return(
        <div className="card">
            <Link to={route} className="card-route">

            <div className="graph-card" style={{ backgroundColor: backgroundColor }}>
                <GraficoAnimado tipo={animationType} />
            </div>

            <div className="card-info">
                <div className="card-header">
                    <h3>{title}</h3>
                    <button className="btn-training">Training</button>
                </div>

                <div className="card-tags">
                    {tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                    ))}
                </div>
            </div>

            </Link>

        </div>
    );
}

function GraficoAnimado({ tipo }: { tipo?: TipoAnimacion }) {
  if (tipo === "ordenamiento") {
    return (
      <div className="anim-barras">
        <div className="barral b1"></div>
        <div className="barral b2"></div>
        <div className="barral b3"></div>
        <div className="barral b4"></div>
        <div className="barral b5"></div>
      </div>
    );
  }

  if (tipo === "huffman") {
    return (
      <div className="anim-arbol">
        <div className="nodo raiz"></div>
        <div className="ramas">
          <div className="linea linea-izq"></div>
          <div className="linea linea-der"></div>
          <div className="nodo hijo-izq"></div>
          <div className="nodo hijo-der"></div>
        </div>
      </div>
    );
  }

  if (tipo === "compresor") {
    return (
      <div className="anim-compresor">
        <div className="archivo">101101001101</div>
      </div>
    );
  }

  return null;
}