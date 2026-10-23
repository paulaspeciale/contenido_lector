# Contenido BookTok · Herramientas para lectores creadores

Aplicación web gratuita y sin anuncios, pensada para quienes crean contenido sobre libros en Bookstagram, BookTok y similares. Ayuda a organizar ideas de publicaciones, planificarlas en un calendario y preparar reseñas.

Diseñada e ideada por Paula Speciale, con la ayuda de Claude.

---

## Páginas

| Archivo | Sección | Qué hace |
|---|---|---|
| `index.html` | Inicio | Portada (marcador «Próximamente»). |
| `resenia.html` | Reseñas | Plantilla de reseña de 22 secciones, con versión completa y versión corta (TikTok / Reel). |
| `ideas_post_90.html` | Ideas | Gestor de 90 ideas de post, con estados, fechas, checklist de producción, hashtags y notas. |
| `calendario_ideas_90.html` | Calendario | Calendario mensual con las ideas que tienen fecha. |
| `glosario.html` | Glosario | Glosario bookish: siglas, tropos y géneros del inglés al español, con buscador, filtros, ejemplos y botón de copiar. |
| `bingo.html` | Bingo | Marcador «Próximamente». |
| `sugerencias.html` | Sugerencias | Formulario para enviar ideas o comentarios. |
| `sobre_mi.html` | Sobre mí | Presentación, redes, enlace a YouTube y formas de donar. |

Archivos compartidos:

- `base.css`: variables, tema, tipografía, controles, menú, pie y bloques de lectura. Se carga siempre primero.
- `ideas.css`, `calendario.css`, `resenia.css`, `glosario.css`, `simples.css`: estilos propios de cada página.
- `toc.css`: menú «En esta página» (Ideas, Calendario y Glosario).
- `datos-glosario.js`: los términos del glosario (`window.BT.GLOSARIO`).
- `theme.js`: botón de tema claro / oscuro.
- `fonts/`: carpeta con `courier-prime-latin-400-normal.woff2` y `courier-prime-latin-700-normal.woff2` (los carga `base.css`; sin ella se usa Courier New).
- `reseniabooktook.txt`: nota de trabajo con los cuatro pilares de contenido; no forma parte de la web.
- `datos-ideas.js`: las 90 ideas base y sus secciones (`window.BT.SECCIONES`).
- `app.js`: lógica de la página de Ideas.

---

## Cómo funciona

### Ideas de post (`ideas_post_90.html` + `app.js`)

La lista base de 90 ideas vive en `datos-ideas.js` (`window.BT.SECCIONES`), organizada en 8 secciones más una novena, «Mis ideas», para las tuyas. Cada idea tiene un formato sugerido (Post, Carrusel o Reel) y una marca de origen: ★ plantillas clásicas, ◆ tendencias.

Por cada idea puedes:

- Marcarla como **hecha** (equivale al estado «Publicada») y como **favorita**.
- Cambiar su **estado**: Idea, Grabando, Editando, Programada, Publicada o Descartada.
- Asignarle una **fecha de publicación**.
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

### Calendario (`calendario_ideas_90.html`)

Lee los datos guardados por la página de Ideas (`localStorage`) y los textos base de `datos-ideas.js`, y dibuja un calendario mensual (semana de lunes a domingo). No tiene lista propia de ideas: no hay nada que mantener sincronizado.

- Cada día muestra las publicaciones con fecha, con el color del formato y de la cinta de estado. Las publicadas aparecen tachadas.
- Al tocar un día se ve su detalle.
- En pantallas pequeñas las publicaciones se resumen en puntos de color.
- Se actualiza solo al volver a la pestaña o cuando cambian los datos en otra pestaña.
- Muestra un resumen del mes (publicaciones y cuántas están publicadas).
- Se puede importar un respaldo JSON **solo para verlo**: no modifica tu progreso.
- Incluye un menú «En esta página» con enlaces a cada bloque.

### Reseñas (`resenia.html`)

Plantilla de reseña con índice de enlaces internos. Permite alternar entre versión completa y versión corta de 5 puntos (gancho y calificación, de qué trata, lo mejor, lo que no funcionó y veredicto), copiar la plantilla como texto plano e imprimir o guardar en PDF.

### Glosario (`glosario.html` + `datos-glosario.js`)

Lista de términos bookish, hoy con dos categorías: **Siglas** (ARC, ALC, CR, DNF, FMC/MMC, HEA, HFN, KU, NA/YA, RH, TBR, CW/TW, WIP) y **Tropos y géneros** (enemies to lovers, friends to lovers, fake dating, age gap, grumpy and sunshine, slow burn, romantasy, dark academia, omegaverse, spicy). Cada término lleva el significado en inglés, la traducción al español, una explicación, un ejemplo de uso y, si hace falta, una nota.

- **Búsqueda** sin distinguir tildes ni mayúsculas, que mira también el significado y el ejemplo.
- **Filtros** por categoría y por tipo (Sigla, Tropo, Género, Contenido).
- **Copiar** deja el término con su significado listo para pegar (con ventana de respaldo si el navegador no deja copiar).
- **Enlaces directos** a un término por su `id`: `glosario.html#tbr`. Al llegar, el término se resalta.
- No guarda nada en el navegador: no hay nada que respaldar.

### Sugerencias (`sugerencias.html`)

Formulario con validación nativa del navegador, que se envía con un POST normal a FormSubmit con su **captcha activado**. En el script hay una constante `FORM_URL`: pega ahí la dirección con código aleatorio que da FormSubmit (`https://formsubmit.co/el/CODIGO`), **nunca tu correo**. Protecciones extra: campo trampa `_honey` y rechazo de envíos en menos de 3 s. Tras enviar, FormSubmit vuelve a la página con `?enviado=1` y se muestra el mensaje de éxito. Con `FORM_URL` vacía el formulario se oculta y se muestra un aviso con enlaces a las redes (no se simula el envío). No se muestra ningún correo en la página.

### Sobre mí (`sobre_mi.html`)

Presentación, enlaces a TikTok, Instagram y YouTube, y donaciones por Mercado Pago (alias con botón de copiar) y Cafecito. PayPal está retirado hasta tener un enlace PayPal.me, para no exponer un correo personal.

### Tema claro / oscuro (`theme.js`)

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
- **JavaScript** puro (IIFE con `"use strict"`; estilo mayormente ES5, pero `app.js` y el calendario usan también `const`/`let`, `Promise` y otras APIs modernas), sin frameworks ni librerías ni paso de compilación.
- **APIs del navegador**: `localStorage`, `Blob` y `URL.createObjectURL` (descargas), `FileReader` (importar), Clipboard API con respaldo `execCommand`, `ResizeObserver`, `TextEncoder`.
- **Formatos de exportación**: JSON, CSV (con protección contra inyección de fórmulas) e iCalendar (`.ics`, con plegado de líneas a 75 bytes).
- **Tipografías**: serifa del sistema («Iowan Old Style» / Palatino / Georgia) para el texto y **Courier Prime** (SIL OFL, autohospedada en la carpeta `fonts/`, subconjunto latino) para etiquetas, con «American Typewriter» / Courier New como respaldo. No se carga ninguna fuente de servidores externos.
- **Servicios externos**: solo la imagen del botón de Cafecito y los enlaces a redes y donaciones.

## Diseño

Estética de **librería antigua (cottagecore)**: papel con grano generado con un filtro SVG, dobles filetes, versalitas y tipografía de máquina de escribir. Paleta de seis colores: Forged Iron `#414143`, Smoked Amethyst `#594752`, Old Lavender `#7B6B7A`, Maud `#867C7D`, Weathered Stone `#BAB8B5` y Brume `#E8E3DF`.

## Accesibilidad

- Objetivos táctiles de al menos 2,5 a 2,75 rem.
- Etiquetas `aria-*`, regiones `role="status"` y `aria-current` en el menú y en el índice.
- Anuncios para lectores de pantalla al copiar, guardar o restaurar.
- Contraste adecuado en modo claro y oscuro, y respeto de `prefers-reduced-motion`.
- Animaciones de apertura de secciones, barra de progreso y celebración al publicar (confeti y sello), desactivadas con `prefers-reduced-motion` (también en el JS).
- Menú principal desplazable con el dedo en móvil.

---

## Cómo usarla

1. Deja todos los archivos juntos en la misma carpeta, junto con la subcarpeta `fonts/` (`ideas_post_90.html` necesita `base.css`, `ideas.css`, `toc.css`, `theme.js`, `datos-ideas.js` y `app.js`; `calendario_ideas_90.html` necesita `base.css`, `calendario.css`, `toc.css`, `theme.js` y `datos-ideas.js`; `glosario.html` necesita `base.css`, `glosario.css`, `toc.css`, `theme.js` y `datos-glosario.js`).
2. Abre `index.html` en el navegador, o sube la carpeta a cualquier hosting estático.
3. No requiere instalación ni servidor.

## Cómo modificarla

- **Agregar o cambiar ideas base**: edita `datos-ideas.js`. Cada idea necesita `id`, `texto` y `formato`. Los `id` son lo que usa el progreso guardado: **no los renumeres ni los reutilices**; añade las nuevas al final (91, 92…) y no cambies el orden de las secciones.
- **Una sola fuente de ideas**: tanto Ideas como Calendario leen `datos-ideas.js`, así que no hay nada más que actualizar.
- **Agregar términos al glosario**: edita `datos-glosario.js`. Cada término necesita `id` (único, sin espacios, es el ancla), `termino`, `categoria` (`siglas` o `tropos`), `tipo`, `es` y `def`; `en`, `ejemplo` y `nota` son opcionales. Para una categoría nueva hay que añadir su sección en `glosario.html`, su opción en el filtro y su nombre en la lista `CATS` del script.
- **Cambiar estados o pasos de producción**: modifica `ESTADOS` y `PASOS` en `app.js` y los colores correspondientes en `base.css`.
- **Colores**: están en las variables de `:root` al inicio de `base.css`.
- **Formulario de sugerencias**: pega en `FORM_URL` la dirección con código aleatorio de FormSubmit (no el correo).
- **Versiones coherentes**: `app.js` comprueba al iniciar que el HTML tenga todos los elementos que necesita. Si copias un archivo nuevo sin el otro, muestra un aviso en lugar de fallar en silencio. Tu progreso no se toca.

## Límites conocidos

- Sin sincronización fuera de la versión publicada: cada navegador tiene su propia copia.
- Resolución de conflictos por «gana la última marca», a nivel de idea completa (no se fusionan campos). Si dos dispositivos editan la misma idea sin conexión, se conserva una de las dos versiones.
- Una idea local sin ninguna fecha de cambio guardada (marca `1`) pierde frente a una copia remota, aunque tuviera ediciones propias más nuevas. No se pregunta a la persona en ese caso.
- Si un dispositivo llegó a tener el reloj muy adelantado y subió una marca enorme, los demás la superarán a partir de ahí: no se pierden ediciones, pero las marcas quedan grandes.
- El botón de exportar espera a que se resuelva la capacidad `downloads`, pero sin tiempo límite ni aviso si tarda o falla.
- Las ideas propias son privadas; para que otros las vean hay que enviarlas por Sugerencias.
- Inicio y Bingo están pendientes de contenido.
- El Calendario solo lee el `localStorage` del dispositivo: en un segundo dispositivo aparece vacío hasta abrir Ideas (que es quien sincroniza con la nube).
- Requiere navegadores recientes: `light-dark()` y `:has()` no tienen respaldo en versiones antiguas.
- `base.css` redefine algunos selectores (`h1`, `body`, `button`, `.guia`…) en una segunda capa; funciona, pero conviene unificarlos algún día.
- El formulario de Sugerencias muestra un aviso en lugar del formulario hasta configurar `FORM_URL`.
- Privacidad: ningún archivo debe contener correos personales. Si la web se publica, revisa también el historial de versiones anteriores, que pudo exponerlo.
- «Sobre mí» no tiene foto todavía (hay un comentario en el HTML con la etiqueta lista).
