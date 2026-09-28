# Vizualizador de alogoritmos de ordenamiento

Integrantes:  
- Ivan Espinoza Aguilar  
- Aldo Froilan Ambriz Gonzalez  
- Andres De Jesus Orocio Pineda  

# Descripcion
Este proyecto es una pagina web diseñada para la visualización y comparación de algoritmos de ordenamiento  
específicamente 6 algoritmos de fuerza bruta y 2 de divide y vencerás los cuales son:  
- Bubble Sort
- Insertion Sort
- Selection Sort
- Gnome Sort
- Exchange Sort
- Stooge Sort
- Quick Sort
- Merge Sort

# Tecnologias utilizadas 
- Node js (Para crear el proyecto de Vite)
- Vite
- React
- Typescript
- Github pages

# Uso de IA (Utilizada para corregir errores, ejemplos de codigo y documentacion)
- Gemini
- Claude

# Requisitos
- Node.js v26.8.2 — verifica si tienes instalado con el comando "node -v".
- Si no coincide, instálala desde https://nodejs.org/](https://nodejs.org/es/download preferentemente la version que diga LTS para que tenga soporte futuro.
- npm (incluido con Node) y Git.

# Cómo empezar
- Clona el repositorio:
git clone

- Instala las dependencias 
npm install

- Levanta el servidor de desarrollo para confirmar que todo corre como deberia de ser:
npm run dev

- Crea tu branch a partir de main, según la tarea que tengas asignada en el backlog:
git checkout -b feature/<nombre-de-tu-tarea>
Ejemplos: feature/quick-sort, feature/topbar, feature/gnome-sort.

# Al terminar la tarea 
npm run lint
git add .
git commit -m "feat: "
git push -u origin feature/

- Mensajes de commit en formato Conventional Commits (feat:, fix:, docs:, chore:).
- Abre un Pull Request hacia main. La rama main está protegida: se requiere mínimo 1 aprobación y resolver todas las conversaciones antes de mergear.
- Mueve tu tarjeta del backlog de in-process a done.
