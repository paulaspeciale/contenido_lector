/* constantes.js · Claves, catálogos y listas fijas del Calendario.

   Se importan desde main.js. No dependen del DOM ni del estado: solo describen
   qué se guarda, cómo se llama cada cosa y las fechas bookish sugeridas. */
export const KEY = "ideas_post_90_v1";
export const NOTA_SYNC = " Se sincroniza con tus otros dispositivos al abrir Ideas.";
export const KEY_CFG = "calendario_config";   // clave propia: solo guarda la meta semanal
export const KEY_RESP = "calendario_respaldo"; // fechas (ms) del último cambio y del último respaldo de eventos y meta
export const META_MAX = 21;
export const FORMATOS = ["Post", "Carrusel", "Reel"];
export const ESTADOS = { idea: 1, grabando: 1, editando: 1, programada: 1, publicada: 1, descartada: 1 };
export const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const NOMBRES_EST = { idea: "Idea", grabando: "Grabando", editando: "Editando", programada: "Programada", publicada: "Publicada", descartada: "Descartada" };

export const REDES = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };

export const BOOKISH = {
  "02-14": ["San Valentín", "Tropes románticos o tu pareja literaria favorita."],
  "03-21": ["Día Mundial de la Poesía", "Un libro de poesía o una frase subrayada."],
  "04-02": ["Día del Libro Infantil", "El libro que te hizo lectora."],
  "04-23": ["Día del Libro", "Tu libro favorito o tu mejor regalo literario."],
  "06-13": ["Día del Escritor (Argentina)", "Una autora o autor con quien serías amiga."],
  "06-15": ["Día Nacional del Libro (Argentina)", "Joyas escondidas o autoras hispanohablantes."],
  "06-30": ["Mitad de año", "Mid-Year Freak Out Tag: mejores y peores lecturas."],
  "08-24": ["Día del Lector (Argentina)", "Tu ritual de lectura o tu rincón favorito."],
  "09-08": ["Día de la Alfabetización", "Cómo te hiciste lectora."],
  "08-09": ["Día del Amante de los Libros", "Tu historia de amor con los libros en una foto o reel."],
  "09-06": ["Día de Leer un Libro (EE. UU.)", "Lo que estás leyendo hoy."],
  "10-24": ["Día de las Bibliotecas", "Tu biblioteca favorita o tu último préstamo."],
  "10-31": ["Halloween", "Libros oscuros: dark academia, gótico, terror."],
  "12-25": ["Navidad", "Árbol de libros o libros de confort."],
  "12-31": ["Cierre de año", "Wrap-up anual y balance de compras vs. lecturas."]
};

export const KEY_EV = "calendario_eventos";   // clave propia: no forma parte del respaldo de Ideas
export const TIPOS_EV = { lanzamiento: "Lanzamiento", arc: "Plazo de ARC", colaboracion: "Colaboración", otro: "Otro" };
export const MAX_EV = 200;
export const MAX_TIT_EV = 80;
