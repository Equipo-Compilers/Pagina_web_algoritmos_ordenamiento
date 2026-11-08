# Vizualizador de alogoritmos de ordenamiento

Integrantes:  
- Ivan Espinoza Aguilar  
- Aldo Froilan Ambriz Gonzalez  
- Andres De Jesus Orocio Pineda  

# Descripcion
Este proyecto es una pagina web diseñada para la visualización y comparación de algoritmos de ordenamiento  
específicamente 6 algoritmos de fuerza bruta y 2 de divide y vencerás.
Incluyendo al algoritmo de Huffman que funciona como compresor de textos y de libros.

# Objetivos
EL objetivo principal es el análisis y visualización de cómo se ejecutan algoritmos de ordenamiento a su vez que se hacen comparaciones sobre un algoritmo y otro algoritmo al mismo tiempo.
A su vez se busca analizar el algoritmo de Huffman mediante un compresor de texto que se ingresa en el navegador y mediante un compresor de libros utilizando la página web de project Gutenberg para descargar los libros de esta misma y poderlos comprimir en un formato propio.

# Algoritmos implementados
- Bubble Sort
- Insertion Sort
- Selection Sort
- Gnome Sort
- Exchange Sort
- Stooge Sort
- Quick Sort
- Merge Sort
- Huffman

# Tecnologias utilizadas 
- Node js (Para crear el proyecto de Vite)
- Vite
- React
- Typescript
- Css
- Vercel

#Formato de carpetas en el GitHub
La arquitectura del repositorio sigue una organización estándar para facilitar el desarrollo y despliegue continuo. A continuación se detalla el propósito de los directorios y archivos principales:

- **`.github/workflows/`**: Contiene las configuraciones de GitHub Actions para automatización e integración continua.
- **`api/`**: Directorio destinado al código backend o funciones serverless.
- **`public/`**: Almacena archivos estáticos y recursos que se sirven directamente (imágenes, iconos, etc.).
- **`scripts/`**: Contiene scripts de utilidad para tareas de automatización o configuración del proyecto.
- **`src/`**: Carpeta principal donde reside el código fuente de la aplicación (componentes, estilos, lógica, etc.).

# Uso de IA (Utilizada para corregir errores, ejemplos de codigo y documentacion)
- Gemini
- Claude

# Requisitos
- Node.js v24.21.0 — verifica si tienes instalado con el comando "node -v".
- Si no coincide, instálala desde https://nodejs.org/es/download preferentemente la version que diga LTS para que tenga soporte futuro.
- npm (incluido con Node) y Git.

# Cómo empezar a trabajar 
- Clona el repositorio:
```bash
git clone https://github.com/Equipo-Compilers/Pagina_web_algoritmos_ordenamiento_tecnica_voraz.git
```
- Instala las dependencias 
```bash
npm install
```

- Levanta el servidor de desarrollo para confirmar que todo corre como deberia de ser:
```bash
npm run dev
```

- Crea tu branch a partir de main, según la tarea que tengas asignada en el backlog:
```bash
git checkout -b feature/<nombre-de-tu-tarea>
```
Ejemplos: feature/quick-sort, feature/topbar, feature/gnome-sort.

# Estándares de Formato y Estilo de Código
Para mantener la consistencia, el orden y la legibilidad del código en este repositorio, hemos establecido la siguiente regla de formato manual para nuestros archivos fuente (incluyendo hojas de estilo como `GreedyInterface.css`):

-Indentación (Tabuladores): Todo el código utiliza una separación estricta de **4 espacios** por cada nivel de indentación. 
-Estructura CSS: En los archivos de estilos, cada propiedad dentro de un bloque de clase o identificador se indenta con un tabulador debajo de la declaración principal para facilitar su lectura.
-Herramientas: Este formato se mantiene manualmente desde la configuración del editor de código (por ejemplo, ajustando el *Tab Size* a 4 en VS Code), sin necesidad de formateadores externos.

# Al terminar la tarea 
```bash
npm run lint
git add .
git commit -m "feat: "
git push -u origin feature/
```
- Mensajes de commit en formato Conventional Commits (feat:, fix:, docs:, chore:).
- Abre un Pull Request hacia main. La rama main está protegida: se requiere mínimo 1 aprobación y resolver todas las conversaciones antes de mergear.
- Mueve tu tarjeta del backlog de in-process a done.

# Deployment
El despliegue de esta página es a traves de Vercel automatizado para que cada vez que se actualice algo del contenido en la rama principal del repositorio se realice un deploy nuevo para actualizar la pagina web.

# Aprendizaje y conclusiones
El aprendizaje que nos llevamos de esta expansion de la actividad es el cómo funcionan algoritmos con mayores capacidades y que se sigue utilizando en el multiples paginas actualmente la conexión con la página Project Gutenberg es una lección muy buena porque multiples paginas se pueden conectar con muchas otras páginas para ofrecer multiples servicios lo cual en este proyecto, aunque conectemos con una ya es una lección muy buena.
