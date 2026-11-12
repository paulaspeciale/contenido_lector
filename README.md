# Contenido BookTok · Herramientas para lectores creadores

Aplicación web gratuita y sin anuncios, pensada para quienes crean contenido sobre libros en Bookstagram, BookTok y similares. Ayuda a organizar ideas de publicaciones, planificarlas en un calendario y preparar reseñas.

Diseñada e ideada por Paula Speciale, con la ayuda de Claude.

---

## Páginas

| Archivo | Sección | Qué hace |
|---|---|---|
| `index.html` | Inicio | Portada con presentación y tarjetas a cada sección. |
| `resena.html` | Reseñas | Plantilla de reseña de 22 secciones, con versión completa, versión corta, guiones para Reels/TikTok y prompts para IA. |
| `ideas.html` | Ideas | Gestor de 90 ideas de post, con estados, fechas, checklist de producción, hashtags y notas. |
| `calendario.html` | Calendario | Calendario mensual con las ideas que tienen fecha. |
| `glosario.html` | Glosario | Glosario bookish inglés-español (más de 300 términos en 13 categorías): buscador, filtros, imprescindibles, ejemplos y botón de copiar. |
| `bingo.html` | Bingo | Tarjeta «Bingo lector 2027» de 5×5 (24 retos y un espacio libre central). Marca los retos cumplidos, avisa de líneas completas, guarda el progreso en el navegador y permite descargarla como PNG o compartirla. |
| `bio.html` | Bio | Guía para optimizar la bio de Instagram, TikTok y YouTube: límites por red, fórmulas para copiar, contador de caracteres con borradores y checklist. |
| `consistencia.html` | Feed | Guía de 10 pasos para un feed de Instagram consistente, con probador de paleta 60-30-10. |
| `sugerencias.html` | Sugerencias | Formulario para enviar ideas o comentarios. |
| `sobre-mi.html` | Sobre mí | Presentación, redes, enlace a YouTube y formas de donar. |

Archivos compartidos:

- `css/base.css`: variables, tema, tipografía, controles, menú, pie y bloques de lectura. Se carga siempre primero.
- `css/paginas/portada.css`, `ideas.css`, `calendario.css`, `resena.css`, `glosario.css`, `bingo.css`, `bio.css`, `simples.css`: estilos propios de cada página (portada, Ideas, Calendario, Reseñas, Glosario, Bingo, Bio y las páginas simples).
- `css/toc.css`: menú «En esta página» (Ideas, Calendario, Glosario y Bio).
- `js/bingo/bingo.js`, `js/bingo/bingo-iconos.js` y `js/bingo/bingo-exportar.js`: lógica de la tarjeta, sus iconos decorativos y la descarga o el uso compartido como imagen.
- `js/datos/datos-glosario.js`: los términos del glosario (`window.BT.GLOSARIO`).
- `js/nucleo/theme.js`: botón de tema claro / oscuro.
- `fonts/`: carpeta con `courier-prime-latin-400-normal.woff2` y `courier-prime-latin-700-normal.woff2` (los carga `css/base.css`; sin ella se usa Courier New).
- `datos/datos-ideas.json`: las 90 ideas base y sus secciones. `datos/datos-bingo.json`: los retos del Book Bingo. Ninguno se edita desde el navegador.
- `js/nucleo/datos.js`: carga esos JSON con `fetch` y los deja en `window.BT.SECCIONES` y `window.BT.BINGO` (`BT.listo` es una promesa que se resuelve cuando terminan; cada página indica qué necesita con `data-usa`). Hace falta un hosting o servidor local: con doble clic (`file://`) los JSON no cargan.
- `js/paginas/ideas/`: módulos de la página de Ideas (`main.js` como entrada, `constantes.js`, `util.js`, `almacenamiento.js`, `estado.js` y `toc.js`).
- `js/paginas/calendario/`: módulos del Calendario (`main.js`, `constantes.js` y `util.js`).
- `js/nucleo/almacen.js`: escritura segura de datos de Ideas desde otras páginas (`guardarFecha`); lo usa el Calendario.
- `js/paginas/`: scripts clásicos del resto de páginas (`bio.js`, `resena.js`, `glosario.js`, `sugerencias.js`, `consistencia.js`, `sobre-mi.js`).
- `robots.txt`: permite el rastreo y enlaza el sitemap. `sitemap.xml`: las 9 páginas indexables (Sugerencias queda fuera porque lleva `noindex`).

---

## Estructura del código

La web es estática: no hay compilación, frameworks ni servidor propio. Cada página es un HTML con su CSS y su JavaScript. Para entender o modificar el código conviene tener en cuenta estas reglas.

```text
/
├─ index.html, ideas.html, calendario.html, resena.html, glosario.html,
│  bingo.html, bio.html, consistencia.html, sugerencias.html, sobre-mi.html
├─ css/
│  ├─ base.css
│  ├─ toc.css
│  └─ paginas/        estilos propios de cada página
├─ js/
│  ├─ nucleo/         theme.js, datos.js, almacen.js
│  ├─ paginas/
│  │  ├─ ideas/       main.js, constantes.js, util.js, almacenamiento.js,
│  │  │               estado.js, toc.js
│  │  ├─ calendario/  main.js, constantes.js, util.js
│  │  └─ bio.js, resena.js, glosario.js, sugerencias.js, consistencia.js,
│  │                  sobre-mi.js
│  ├─ bingo/          bingo.js, bingo-iconos.js, bingo-exportar.js
│  └─ datos/          datos-glosario.js
├─ datos/             datos-ideas.json, datos-bingo.json
├─ robots.txt         rastreo permitido + enlace al sitemap
├─ sitemap.xml        10 páginas indexables
├─ fonts/             Courier Prime (SIL OFL)
└─ README.md
```

### Orden de carga

1. **`css/base.css`** siempre primero; después el CSS propio de la página.
2. **`js/nucleo/theme.js`** en el `<head>` de todas las páginas. Aplica el tema antes de pintar para que no parpadee.
3. **`js/nucleo/datos.js`** (solo Ideas, Calendario y Bingo), con `data-usa` indicando qué JSON necesita:
   - `data-usa="ideas"`: `datos/datos-ideas.json` → `window.BT.SECCIONES`.
   - `data-usa="bingo"`: `datos/datos-bingo.json` → `window.BT.BINGO`.
4. **`js/paginas/ideas/main.js`** (Ideas, módulo ES), **`js/nucleo/almacen.js` + `js/paginas/calendario/main.js`** (Calendario, módulo ES) o **`js/bingo/bingo.js` + `js/bingo/bingo-iconos.js` + `js/bingo/bingo-exportar.js`** (Bingo).
5. Glosario, Bio, Reseñas, Sugerencias, Sobre mí y Consistencia no usan `js/nucleo/datos.js`: cada una carga su script de `js/paginas/` al final del HTML (el Glosario además carga `js/datos/datos-glosario.js`).

`js/nucleo/datos.js` expone `window.BT.listo`, una promesa que **siempre** se resuelve con `{ ok, errores }`. Ninguna página debe quedarse esperando: si un JSON falla, se muestra un aviso y se usa lo que haya (por ejemplo, `js/bingo/bingo.js` tiene una lista de retos de respaldo).

### Datos y estado

- **Datos fijos**: `datos/datos-ideas.json` y `datos/datos-bingo.json` se leen, se validan y se congelan (`Object.freeze`) para que ningún script los altere. `js/datos/datos-glosario.js` se carga como JavaScript y también queda disponible en `window.BT`.
- **Progreso de la persona** (`localStorage`): se escribe solo desde `js/paginas/ideas/main.js`, `js/nucleo/almacen.js`, `js/nucleo/theme.js`, `js/bingo/bingo.js` y los scripts de Calendario y Bio. Las claves están en la tabla de [Almacenamiento de datos](#almacenamiento-de-datos).
- **Ideas** es la fuente de verdad del progreso de las ideas. El Calendario **solo lee** ese estado y cambia la fecha mediante `window.BT.almacen.guardarFecha()`; nunca reescribe el progreso completo.
- **Todo dato que llega de fuera** (localStorage, un JSON importado o la nube) pasa por una función de limpieza (`limpiarEstado`, `limpiarDato`, `limpiarSets`, `leerEventos`…). Se descartan ids, campos y tipos desconocidos.
- **Sincronización**: cada idea y el conjunto de hashtags llevan una marca `mod`. Gana la marca más reciente. Fuera de la versión publicada no hay nube: todo es local.

### Modelo de estado de Ideas

`localStorage["ideas_post_90_v1"]` guarda:

```js
{
  hechas:  { "1": true },        // ideas publicadas (la casilla «hecha» manda)
  datos:   { "1": { /* … */ } }, // campos: fav, estado, fecha, libro, hashtags,
                                 // nota, pasos, redes, texto, formato, sec,
                                 // secNombre, orden, propia, borrada
  sets:    [{ nombre, tags }],   // conjuntos de hashtags
  mod:     { "1": 1712345678 },  // marca de la última edición de cada idea
  modSets: 1712345678            // marca de los conjuntos
}
```

Las ideas base tienen ids de texto (`"1"`…`"90"`); las propias empiezan por `c` (`CUSTOM_RE`). Las secciones nuevas no se guardan en una lista aparte: cada idea guarda `secNombre` y las secciones se reconstruyen a partir de esos nombres.

### Responsabilidades por archivo

| Archivo | Responsabilidad |
|---|---|
| `js/nucleo/datos.js` | Cargar, validar y congelar los JSON; publicar `BT.SECCIONES`, `BT.BINGO` y `BT.listo`. |
| `js/paginas/ideas/main.js` | Estado y interfaz de Ideas: pintar, filtrar, ordenar, editar, importar/exportar, deshacer y sincronizar. |
| `js/paginas/ideas/estado.js` | Limpieza, validación y serialización del estado guardado. |
| `js/paginas/ideas/constantes.js`, `util.js`, `almacenamiento.js`, `toc.js` | Claves y catálogos, funciones puras, acceso a `localStorage` y menú «En esta página». |
| `js/paginas/calendario/main.js` | Rejilla mensual, detalle del día, meta/racha, eventos y respaldo del Calendario. |
| `js/paginas/calendario/constantes.js`, `util.js` | Claves, listas, fechas bookish y ayudantes de fecha/DOM. |
| `js/nucleo/almacen.js` | Cambiar solo la fecha de una idea desde otra página, respetando las marcas de sincronización. |
| `js/nucleo/theme.js` | Tema claro/oscuro, botón flotante y `data-seccion` para el color de cada página. |
| `js/bingo/bingo.js` / `js/bingo/bingo-iconos.js` / `js/bingo/bingo-exportar.js` | Tarjeta de Bingo, progreso, glifos decorativos y exportación a PNG. |
| `js/datos/datos-glosario.js` | Datos del glosario; el HTML solo los presenta. |
| `js/paginas/*.js` | Lógica específica del resto de páginas (Bio, Reseñas, Glosario, Sugerencias, Sobre mí y Consistencia). |

### Convenciones y comentarios

- JavaScript en módulos ES en Ideas y Calendario (cada página tiene una carpeta con `main.js` como entrada); el resto sigue en IIFE con `"use strict"`. Se evita crear variables globales; lo compartido va en `window.BT`.
- Nombres y comentarios en español, en el mismo tono que la interfaz.
- Cada archivo empieza con una cabecera que explica **qué hace, de qué depende y qué expone**.
- Los bloques grandes se separan con banners `// ---- … ----` o `/* ---------- … ---------- */`.
- Los comentarios explican el **porqué** de la lógica no evidente (validaciones, orden, sincronización, accesibilidad). No se comentan líneas obvias.
- Al añadir un campo a una idea hay que actualizarlo también en `CAMPOS` y en la limpieza de `js/paginas/ideas/main.js` y `js/paginas/ideas/estado.js`; si no, no viajará a la nube ni al respaldo.
- No cambiar ids, selectores, claves de `localStorage` ni el orden de los datos sin revisar todas las páginas que los usan.

---

## Cómo funciona

### Ideas de post (`ideas.html` + `js/paginas/ideas/main.js`)

La lista base de 90 ideas vive en `datos/datos-ideas.json` (se carga con `js/nucleo/datos.js` en `window.BT.SECCIONES`), organizada en 8 secciones más una novena, «Mis ideas», para las tuyas. Cada idea tiene un formato sugerido (Post, Carrusel o Reel) y una marca de origen: ★ plantillas clásicas, ◆ tendencias.

Por cada idea puedes:

- Marcarla como **hecha** (equivale al estado «Publicada») y como **favorita**.
- Cambiar su **estado**: Idea, Grabando, Editando, Programada, Publicada o Descartada.
- Asignarle una **fecha de publicación**.
- Marcar en qué **red o redes** se publicará (Instagram, TikTok, YouTube; puede ser más de una). Se puede filtrar por red, va en el CSV y en el `.ics`, y el Calendario la muestra en el detalle del día. Se guarda en `datos[id].redes`, así que entra en el respaldo JSON y en la sincronización.
- Seguir su **checklist de producción**: Guion, Grabar o foto, Editar, Caption, Programar.
- Guardar el **libro**, los **hashtags** y **notas**. Si repites un libro en varias ideas, la app te avisa.
- **Copiar** al portapapeles el texto listo para pegar (notas, libro y hashtags).
- **Editar** o **borrar** cualquier idea. Las borradas se pueden restaurar desde «Ideas borradas».
- Crear **ideas propias**, visibles solo para ti. Al crear o editar una idea puedes elegir «＋ Nueva sección…» y escribir su nombre: la sección aparece al final de la lista (después de «Mis ideas»), se suma al menú «En esta página» y desaparece sola cuando ya no tiene ideas. Si el nombre coincide con una sección existente, se usa esa.
- Navegar con el menú **«En esta página»**: columna fija a la derecha en pantallas anchas y panel plegable en móvil. Salta a cada bloque y a cada sección de ideas, abre la sección al llegar, resalta la que estás viendo y oculta los enlaces de las secciones que los filtros esconden.

Herramientas generales:

- **Búsqueda** por texto, libro, hashtags o notas, sin distinguir tildes ni mayúsculas.
- **Filtros** por estado, formato, fecha (con fecha, sin fecha, esta semana, vencidas), producción y favoritas.
- **Orden** original, por fecha o por prioridad manual (botones para subir, bajar, ir al inicio o al final).
- **Sorpréndeme**: elige al azar una idea en estado «Idea» entre las visibles.
- **Conjuntos de hashtags**: grupos guardados que se añaden a una idea con un toque, sin duplicados.
- **Progreso y respaldo**: exportar a JSON (respaldo), CSV o calendario `.ics`; importar un respaldo; desmarcar todas las hechas; y un botón **Deshacer** tras un reinicio o una importación.
- **Aviso de respaldo**: la app avisa si nunca has exportado o si pasaron 30 días con cambios sin respaldar.

### Calendario (`calendario.html` + `js/paginas/calendario/main.js`)

Lee los datos de Ideas (`localStorage`) y `datos/datos-ideas.json`, y dibuja un calendario mensual (lunes a domingo). Escribe en Ideas solo la fecha, mediante `js/nucleo/almacen.js`.

- **Detalle del día**: va justo bajo la rejilla; en móvil, al tocar un día la página baja hasta él. Cada publicación tiene campo de fecha, «Quitar fecha» y, si está vencida, «Mover a hoy» y «+7 días». Cambiar o quitar una fecha, o borrar un evento, ofrece un botón **Deshacer**.
- **Teclado**: las flechas mueven el día seleccionado (un solo día entra en el orden de tabulación). Los cambios de día y de mes se anuncian con un aviso breve para lectores de pantalla.
- **Vencidas**: fecha pasada y sin publicar ni descartar; se marcan en la rejilla y en el resumen.
- **Meta semanal**: cuenta las **publicadas** y muestra también las planificadas. Escribe 0 para quitarla. Se guarda en `calendario_config`.
- **Racha y cumplimiento** (solo lectura): semanas seguidas con al menos tantas publicadas como la meta (1 si no hay meta), mejor racha y porcentaje de ideas con fecha hasta hoy ya publicadas.
- **Días libres**: de hoy al domingo, sin publicaciones.
- **Eventos propios** (lanzamientos, plazos de ARC, colaboraciones): se añaden con el formulario del día (Enter funciona). Se guardan en `calendario_eventos`.
- **Fechas bookish**: sugerencias fijas (incluye internacionales y el primer jueves de marzo, fecha móvil), se pueden ocultar.
- **Aviso de respaldo**: si hay eventos o meta que nunca exportaste, o los cambiaste después del último respaldo, aparece un aviso con botón «Exportar ahora» (usa `calendario_respaldo`).
- **Respaldo aparte**: «Exportar / Importar eventos y meta» (JSON propio, `tipo: "calendario"`); al importar se suman los eventos que falten. No entran en el JSON de Ideas.
- «Hoy» se actualiza al pasar la medianoche y al volver a la pestaña.
- Se puede cargar un respaldo JSON de Ideas **solo para verlo**.
- El menú «En esta página» marca la sección visible.

### Reseñas (`resena.html`)

Plantilla de reseña con índice de enlaces internos. Permite alternar entre cuatro vistas: **completa**, **corta** de 5 puntos (gancho y calificación, de qué trata, lo mejor, lo que no funcionó y veredicto), **guiones** para Reels/TikTok y **prompts para IA**. Desde cada vista se puede copiar el texto plano; la versión completa también se puede imprimir o guardar en PDF.

### Glosario (`glosario.html` + `js/datos/datos-glosario.js`)

Glosario bookish inglés → español con **304 términos** en **13 categorías**, agrupadas en 5 bloques (de lo básico a lo específico):

| Bloque | Categorías |
|---|---|
| Lo básico | Siglas y abreviaturas |
| Romance | Tropes románticos · Devoción, protección y dinámica de pareja · Spice y nivel de explicitud |
| Historias | Géneros y subgéneros · Personajes y arquetipos · Trama, ritmo y finales · Fantasía, paranormal y romantasy |
| Opinar y reseñar | Reacciones, jerga y valoración · Content warnings habituales |
| Comunidad y estética | Comunidad y hábitos lectores · Ediciones y publicación · Estética para Bookstagram |

Las categorías y los términos van de los más usados a los menos. Cada término tiene el inglés, la traducción al español y, según el caso, una explicación, un ejemplo de uso y enlaces «Ver también».

- **Imprescindibles**: 50 términos marcados como tal (borde de color y sello «Imprescindible») y una sección de accesos rápidos con los más usados.
- **Búsqueda** sin distinguir tildes ni mayúsculas, que mira también la explicación y el ejemplo.
- **Filtros** por categoría, orden (popularidad o A–Z) y «Solo imprescindibles». Con un filtro o una búsqueda activos se abren las categorías con resultados.
- **Ver los restantes**: cada categoría muestra primero 8 términos y el resto se despliega con un botón. Spice y Content warnings empiezan plegadas.
- **Copiar** deja el término con su significado listo para pegar (con ventana de respaldo si el navegador no deja copiar).
- **Enlaces directos** a un término por su `id` (se genera a partir del inglés): `glosario.html#tbr`. Al llegar, se abre su categoría y el término se resalta. También funciona con una categoría: `glosario.html#tropes`.
- Menú «En esta página» con los bloques que tengan resultados.
- No guarda nada en el navegador: no hay nada que respaldar.

### Sugerencias (`sugerencias.html`)

Formulario con validación nativa del navegador, que se envía con un POST normal a FormSubmit con su **captcha activado**. En el script hay una constante `FORM_URL`: pega ahí la dirección con código aleatorio que da FormSubmit (`https://formsubmit.co/el/CODIGO`), **nunca tu correo**. Protecciones extra: campo trampa `_honey` y rechazo de envíos en menos de 3 s. Tras enviar, FormSubmit vuelve a la página con `?enviado=1` y se muestra el mensaje de éxito. Con `FORM_URL` vacía el formulario se oculta y se muestra un aviso con enlaces a las redes (no se simula el envío). No se muestra ningún correo en la página.

### Sobre mí (`sobre-mi.html`)

Presentación, enlaces a TikTok, Instagram y YouTube, y donaciones por Mercado Pago (alias con botón de copiar) y Cafecito. PayPal está retirado hasta tener un enlace PayPal.me, para no exponer un correo personal.

### Tema claro / oscuro (`js/nucleo/theme.js`)

Sigue la preferencia del dispositivo y permite cambiarla con un botón flotante. La elección se guarda en el navegador y se sincroniza entre pestañas.

---

## Almacenamiento de datos

Todo el progreso se guarda **en el navegador** con `localStorage`, sin servidor propio:

| Clave | Contenido |
|---|---|
| `ideas_post_90_v1` | Estado completo: hechas, datos de cada idea (incluido `secNombre`, el nombre de su sección nueva), conjuntos de hashtags y marcas de modificación. |
| `ideas_post_90_meta` | Fechas del último respaldo y del último cambio. |
| `ideas_post_90_deshacer` | Copia para el botón «Deshacer». |
| `ideas_post_90_corrupto` | Copia del dato original si no se pudo leer (solo aparece en ese caso). |
| `calendario_config` | Meta semanal del Calendario. |
| `calendario_eventos` | Eventos propios del Calendario. |
| `calendario_respaldo` | Fechas (en ms) del último cambio y del último respaldo de eventos y meta; solo sirve para el aviso del Calendario. |
| `bingo_2027_v1` | Índices de las casillas marcadas en el Bingo. |
| `bio_borradores_v1` | Borradores de los campos de Bio (un texto por red). |
| `bio_checklist_v1` | Casillas marcadas en el checklist de Bio. |
| `tema_preferido` | Tema claro u oscuro. |

Importante:

- Los datos viven solo en ese navegador y dispositivo. Si se borran los datos del navegador, se pierden: por eso existe el **respaldo en JSON**.
- La app migra automáticamente desde las claves antiguas (`ideas_post_90_marcadas` e `ideas_post_90_datos`).
- Al importar un archivo, se comprueba que parezca un respaldo, se muestra cuántas ideas trae, y los datos se validan y se limpian antes de aplicarse.
- Los cambios se guardan con una pequeña espera (400 ms) para agrupar teclas, y siempre se vuelcan al cerrar o ocultar la pestaña.
- Si los datos guardados están dañados, la app no los sobrescribe: guarda una copia y ofrece descargarla.

### Sincronización entre dispositivos

Solo funciona en la **versión publicada** de la página, cuando el entorno ofrece las capacidades `db` y `user`. Cada idea se guarda como un documento privado del usuario y los conjuntos de hashtags como otro. Ante un conflicto gana la modificación más reciente. Los cambios se envían en segundo plano, con reintentos si no hay conexión. Fuera de ese entorno la app funciona igual, solo de forma local.

**Cómo se decide qué versión gana.** Cada idea (y el conjunto de hashtags) lleva una marca de modificación (`mod`). Al comparar la copia local con la de la nube, gana la marca mayor.

- **Reloj híbrido.** La marca nueva se calcula como el mayor valor entre la hora del dispositivo, la marca anterior de esa idea + 1 y la mayor marca vista en cualquier documento (local o remoto) + 1. Así, un dispositivo con el reloj atrasado no pierde ediciones hechas después de ver los datos de la nube. La hora del dispositivo solo influye cuando es la mayor de las tres.
- **Ideas sin marca.** Los datos anteriores a la sincronización (o migrados desde las claves antiguas) no tenían marca y perdían siempre frente a cualquier copia remota. Ahora, al cargar (y cuando otra pestaña cambia los datos), reciben la fecha del último cambio local (`ultimoCambio`; si no existe, `ultimoRespaldo`). Si no hay ninguna fecha guardada, reciben la marca `1`: pierden frente a una copia remota, pero se suben si en la nube no existe esa idea.

La capacidad `downloads` también es propia de la versión publicada; en ella se oculta la exportación `.ics` y las descargas pasan por esa capacidad.

---

## Tecnologías

- **HTML5** semántico: `<details>`, `<dialog>`, `<progress>`, formularios con validación nativa.
- **CSS3** sin preprocesadores: variables CSS, Grid, Flexbox, `prefers-color-scheme`, `prefers-reduced-motion`, estilos de impresión (`@media print`) y áreas seguras de iOS (`env(safe-area-inset-*)`).
- **JavaScript** puro (módulos ES en Ideas y Calendario; IIFE con `"use strict"` en el resto; `const`/`let`, `Promise` y otras APIs modernas), sin frameworks ni librerías ni paso de compilación.
- **APIs del navegador**: `localStorage`, `Blob` y `URL.createObjectURL` (descargas), `FileReader` (importar), Clipboard API con respaldo `execCommand`, `ResizeObserver`, `TextEncoder`.
- **Formatos de exportación**: JSON, CSV (con protección contra inyección de fórmulas) e iCalendar (`.ics`, con plegado de líneas a 75 bytes).
- **Tipografías**: serifa del sistema («Iowan Old Style» / Palatino / Georgia) para el texto y **Courier Prime** (SIL OFL, autohospedada en la carpeta `fonts/`, subconjunto latino) para etiquetas, con «American Typewriter» / Courier New como respaldo. No se carga ninguna fuente de servidores externos.
- **Servicios externos**: solo la imagen del botón de Cafecito y los enlaces a redes y donaciones.

## Diseño

Estética de **librería antigua (cottagecore)**: papel con grano generado con un filtro SVG, dobles filetes, versalitas y tipografía de máquina de escribir. Paleta de papel crema, tinta berenjena, burdeos y dorado, con un color de «tela de encuadernación» por sección. Todo está en las variables de `:root` de `css/base.css` (`light-dark(claro, oscuro)`).

## Accesibilidad

- Objetivos táctiles de al menos 2,5 a 2,75 rem.
- Etiquetas `aria-*`, regiones `role="status"` y `aria-current` en el menú y en el índice.
- Anuncios para lectores de pantalla al copiar, guardar o restaurar.
- Contraste adecuado en modo claro y oscuro, y respeto de `prefers-reduced-motion`.
- Animaciones de apertura de secciones, barra de progreso y celebración al publicar (confeti y sello), desactivadas con `prefers-reduced-motion` (también en el JS).
- Menú principal desplazable con el dedo en móvil.

---

## Cómo usarla

1. Mantén la estructura de carpetas (`css/`, `js/`, `datos/`, `fonts/`) junto a los HTML. Por ejemplo, `ideas.html` necesita `css/base.css`, `css/paginas/ideas.css`, `css/toc.css`, `js/nucleo/theme.js`, `js/nucleo/datos.js`, `datos/datos-ideas.json` y la carpeta `js/paginas/ideas/`; `calendario.html` necesita `css/base.css`, `css/paginas/calendario.css`, `css/toc.css`, `js/nucleo/theme.js`, `js/nucleo/datos.js`, `datos/datos-ideas.json`, `js/nucleo/almacen.js` y la carpeta `js/paginas/calendario/`; `glosario.html` necesita `css/base.css`, `css/paginas/glosario.css`, `css/toc.css`, `js/nucleo/theme.js`, `js/datos/datos-glosario.js` y `js/paginas/glosario.js`.
2. Abre `index.html` en el navegador, o sube la carpeta a cualquier hosting estático.
3. **No requiere instalación ni servidor propio**, pero sí debe abrirse desde un servidor (el hosting o uno local) para que `fetch` pueda leer los JSON y para que el navegador cargue los módulos ES de Ideas y Calendario. Con doble clic (`file://`) funcionan la portada, Reseñas, Bio, Glosario, Sugerencias y Sobre mí; Ideas, Calendario y Bingo necesitan servidor.

### Publicar y SEO

Antes de publicar, sustituye **`TU-DOMINIO.com`** por tu dominio real. Aparece en:

- el `canonical`, `og:url`, `hreflang` y el JSON-LD de los 10 HTML;
- `robots.txt` (línea `Sitemap:`);
- `sitemap.xml` (las 9 `<loc>`).

Puedes hacerlo de una vez con un buscar y reemplazar en toda la carpeta. Después:

1. Sube también `robots.txt` y `sitemap.xml` a la raíz del hosting.
2. Da de alta el sitio en Google Search Console y envía `https://TU-DOMINIO.com/sitemap.xml`.
3. Si cambias una URL o añades una página, actualiza su `canonical`, el `sitemap.xml` y el menú de todos los HTML.

Cada página ya incluye `title` y `meta description` únicos, `robots`, `canonical`, Open Graph, Twitter Card, `hreflang="es"` + `x-default` y JSON-LD (`WebPage`/`WebSite` + `BreadcrumbList`; `ProfilePage` en Sobre mí). `sugerencias.html` es la única con `noindex`.

## Cómo modificarla

- **Agregar o cambiar ideas base**: edita `datos/datos-ideas.json`. Cada idea necesita `id`, `texto` y `formato`. Los `id` son lo que usa el progreso guardado: **no los renumeres ni los reutilices**; añade las nuevas al final (91, 92…) y no cambies el orden de las secciones.
- **Una sola fuente de ideas**: tanto Ideas como Calendario leen `datos/datos-ideas.json`, así que no hay nada más que actualizar.
- **Agregar términos al glosario**: edita `js/datos/datos-glosario.js`. Dentro de la categoría que corresponda, añade una fila `[inglés, español, explicación, imprescindible, ejemplo]`: la explicación y el ejemplo pueden ir vacíos (`""`) y el cuarto valor es `1` para marcar un imprescindible. El `id` (el ancla) se genera solo a partir del inglés. Para que una fila con varios términos separados por « · » se divida en fichas, añade su texto inglés a la lista `SPLIT`. Una categoría nueva se añade a la lista `C` y a un bloque de `GLOSARIO_GRUPOS`; los imprescindibles de acceso rápido están en `GLOSARIO_DESTACADOS` y los enlaces «Ver también» en `GLOSARIO_VER_TAMBIEN`. `glosario.html` y `js/paginas/glosario.js` no hay que tocarlos: lo construyen todo desde los datos.
- **Cambiar estados o pasos de producción**: modifica `ESTADOS` y `PASOS` en `js/paginas/ideas/constantes.js` y los colores correspondientes en `css/base.css`.
- **Retos del bingo**: edita `datos/datos-bingo.json` (exactamente 24 retos; el espacio libre se coloca en el centro). Si el JSON no carga, `js/bingo/bingo.js` usa su lista de respaldo. Los iconos se asignan por palabras clave en `js/bingo/bingo-iconos.js`.
- **Menú principal**: está copiado en cada HTML. Al añadir una página, actualiza el `<nav class="menu">` en todas (y la tarjeta de `index.html`). Añade también su nombre a `PAGINAS` en `js/nucleo/theme.js` para el color de sección.
- **Colores**: están en las variables de `:root` al inicio de `css/base.css`.
- **Formulario de sugerencias**: pega en `FORM_URL` (en `js/paginas/sugerencias.js`) la dirección con código aleatorio de FormSubmit (no el correo).
- **Versiones coherentes**: `js/paginas/ideas/main.js` comprueba al iniciar que el HTML tenga todos los elementos que necesita. Si copias un archivo nuevo sin el otro, muestra un aviso en lugar de fallar en silencio. Tu progreso no se toca.

## Límites conocidos

- Sin sincronización fuera de la versión publicada: cada navegador tiene su propia copia.
- Resolución de conflictos por «gana la última marca», a nivel de idea completa (no se fusionan campos). Si dos dispositivos editan la misma idea sin conexión, se conserva una de las dos versiones.
- Una idea local sin ninguna fecha de cambio guardada (marca `1`) pierde frente a una copia remota, aunque tuviera ediciones propias más nuevas. No se pregunta a la persona en ese caso.
- Si un dispositivo llegó a tener el reloj muy adelantado y subió una marca enorme, los demás la superarán a partir de ahí: no se pierden ediciones, pero las marcas quedan grandes.
- El botón de exportar espera a que se resuelva la capacidad `downloads`, pero sin tiempo límite ni aviso si tarda o falla.
- Las ideas propias son privadas; para que otros las vean hay que enviarlas por Sugerencias.
- La racha y el cumplimiento usan la fecha puesta a cada idea (no el día real de publicación) y la meta semanal actual, así que cambiar la meta recalcula todo el historial.
- El Calendario solo lee el `localStorage` del dispositivo: en un segundo dispositivo aparece vacío hasta abrir Ideas (que es quien sincroniza con la nube).
- Una fecha cambiada desde el Calendario se sube a la nube cuando se carga Ideas. Si Ideas ya estaba abierta en otra pestaña, no se sube hasta recargarla o pulsar «Sincronizar ahora».
- Requiere navegadores recientes: `light-dark()` y `:has()` no tienen respaldo en versiones antiguas.
- `css/base.css` redefine algunos selectores (`h1`, `body`, `button`, `.guia`…) en una segunda capa; funciona, pero conviene unificarlos algún día.
- El formulario de Sugerencias muestra un aviso en lugar del formulario hasta configurar `FORM_URL`.
- Privacidad: ningún archivo debe contener correos personales. Si la web se publica, revisa también el historial de versiones anteriores, que pudo exponerlo.
- «Sobre mí» no tiene foto todavía (hay un comentario en el HTML con la etiqueta lista).
