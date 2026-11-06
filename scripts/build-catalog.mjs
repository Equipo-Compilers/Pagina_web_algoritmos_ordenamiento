// scripts/build-catalog.mjs — genera public/catalog.json a partir del catálogo OFICIAL
// de Project Gutenberg (pg_catalog.csv, que ellos publican para uso automático y
// actualizan cada semana). La búsqueda de tu página usa ese archivo: no depende de ningún
// servicio externo.
//
// Uso (desde la carpeta del proyecto, la que tiene package.json; necesita Node 18 o más nuevo):
//     node scripts/build-catalog.mjs
//
// Opciones:
//     --langs=es,en,fr   solo incluye libros en esos idiomas (el archivo queda más pequeño)
//     --input=archivo.csv  usa un CSV que ya descargaste a mano, en vez de bajarlo
//     --output=ruta.json   dónde guardar el resultado (por defecto public/catalog.json)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CSV_URL = "https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv";

const args = process.argv.slice(2);
function option(name) {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : null;
}
const input = option("input");
const output = option("output") ?? "public/catalog.json";
const langFilter = option("langs")
  ? option("langs").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  : null;

// Lector de CSV: campos entre comillas, "" como comilla escapada y saltos de línea dentro de un campo
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Convierte las filas del CSV en la lista compacta [id, título, autores, idiomas]
export function buildBooks(rows, langs = null) {
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (re) => header.findIndex((h) => re.test(h));
  const cId = col(/^(text#|id)$/), cType = col(/^type$/), cTitle = col(/^title$/);
  const cLang = col(/^language$/), cAuthors = col(/^authors?$/);
  if ([cId, cTitle, cLang, cAuthors].includes(-1)) {
    throw new Error(`El CSV no tiene las columnas esperadas. Encabezado encontrado: ${rows[0].join(" | ")}`);
  }

  const books = [];
  for (const r of rows.slice(1)) {
    if (cType !== -1 && r[cType]?.trim() !== "Text") continue; // solo libros de texto (no audio, imágenes...)
    const id = Number(r[cId]);
    if (!Number.isInteger(id) || id <= 0) continue;
    const title = (r[cTitle] ?? "").replace(/\s+/g, " ").trim();
    if (!title) continue;
    const languages = (r[cLang] ?? "").split(";").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (langs && !languages.some((l) => langs.includes(l))) continue;
    const authors = (r[cAuthors] ?? "").replace(/\s+/g, " ").trim();
    books.push([id, title, authors, languages.join(";")]);
  }
  return books.sort((a, b) => a[0] - b[0]);
}

async function main() {
  let text;
  if (input) {
    console.log(`Leyendo ${input} ...`);
    text = await readFile(input, "utf8");
  } else {
    console.log(`Descargando ${CSV_URL} ...`);
    const res = await fetch(CSV_URL);
    if (!res.ok) {
      throw new Error(`Gutenberg respondió HTTP ${res.status}. Descarga el CSV a mano desde esa dirección y ejecuta de nuevo con --input=ruta/al/archivo.csv`);
    }
    text = await res.text();
  }

  const books = buildBooks(parseCsv(text.replace(/^﻿/, "")), langFilter);
  if (books.length === 0) throw new Error("No se encontró ningún libro de texto en el CSV.");

  const json = JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: books.length, books });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, json, "utf8");

  const byLang = new Map();
  for (const b of books) for (const l of b[3].split(";")) byLang.set(l, (byLang.get(l) ?? 0) + 1);
  const top = [...byLang].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l, n]) => `${l}: ${n}`).join(", ");
  console.log(`Listo: ${books.length.toLocaleString()} libros -> ${output} (${(json.length / 1e6).toFixed(1)} MB). Idiomas principales: ${top}`);
}

// Solo se ejecuta cuando lo llamas desde la terminal (no cuando otro archivo lo importa).
// fileURLToPath convierte bien rutas con espacios, acentos y letras de unidad de Windows (C:\...)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("\nError:", err.message);
    process.exit(1);
  });
}
