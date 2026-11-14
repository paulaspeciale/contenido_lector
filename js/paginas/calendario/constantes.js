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

/* Fechas bookish sugeridas. Cada una lleva:
     - md: mes-día fijo (las fechas móviles se calculan en main.js);
     - nombre, idea: qué contar ese día;
     - region: de dónde es la efeméride;
     - tipo: qué clase de contenido inspira.
   No son un calendario oficial: son ideas para publicar. */
export const REGIONES = {
  global: "Global",
  espana: "España",
  latam: "LatAm",
  argentina: "Argentina",
  mexico: "México",
  eeuu: "EE. UU.",
  reino: "Reino Unido"
};

export const TIPOS_BOOKISH = {
  libro: "Día del libro",
  romance: "Romance",
  comunidad: "Comunidad",
  lanzamiento: "Lanzamiento",
  temporada: "Temporada"
};

/* Valores de los filtros. «latam» agrupa las fechas de LatAm, Argentina y
   México; los países también se pueden elegir por separado. */
export const FILTROS_REGION = [
  ["todas", "Todas las regiones"],
  ["global", "Global"],
  ["espana", "España"],
  ["latam", "LatAm (todas)"],
  ["argentina", "Argentina"],
  ["mexico", "México"],
  ["eeuu", "EE. UU."],
  ["reino", "Reino Unido"]
];

export const FILTROS_TIPO = [
  ["todos", "Todos los tipos"],
  ["libro", "Día del libro"],
  ["romance", "Romance"],
  ["comunidad", "Comunidad"],
  ["lanzamiento", "Lanzamiento"],
  ["temporada", "Temporada"]
];

export const BOOKISH = [
  { md: "02-01", nombre: "Mes del romance", idea: "Arranca febrero con una lista de romances: contemporáneo, histórico o fantasy. Un post por subgénero.", region: "global", tipo: "romance" },
  { md: "02-07", nombre: "Cuenta atrás de San Valentín", idea: "Prepara la semana: encuesta de tropes, recomendaciones y un reel con tu pareja literaria.", region: "global", tipo: "romance" },
  { md: "02-14", nombre: "San Valentín", idea: "Tropes románticos o tu pareja literaria favorita.", region: "global", tipo: "romance" },
  { md: "03-08", nombre: "Día Internacional de la Mujer", idea: "Autoras que te marcaron: una lista con una frase de cada libro.", region: "global", tipo: "comunidad" },
  { md: "03-17", nombre: "Día del Cómic y del Tebeo", idea: "Novelas gráficas y cómics que recomendarías a quien solo lee narrativa.", region: "espana", tipo: "libro" },
  { md: "03-21", nombre: "Día Mundial de la Poesía", idea: "Un libro de poesía o una frase subrayada.", region: "global", tipo: "libro" },
  { md: "04-02", nombre: "Día Internacional del Libro Infantil y Juvenil", idea: "El libro que te hizo lectora o el que regalarías a una persona joven.", region: "global", tipo: "libro" },
  { md: "04-23", nombre: "Día Mundial del Libro", idea: "Tu libro favorito o tu mejor regalo literario.", region: "global", tipo: "libro" },
  { md: "04-23", nombre: "Sant Jordi", idea: "La fiesta del libro y la rosa en Cataluña: libros, paradas y tu ejemplar firmado.", region: "espana", tipo: "libro" },
  { md: "05-26", nombre: "Día Nacional del Libro (Uruguay)", idea: "Libros uruguayos y autoras que no se suelen ver en las listas.", region: "latam", tipo: "libro" },
  { md: "06-13", nombre: "Día del Escritor (Argentina)", idea: "Una autora o autor con quien serías amiga.", region: "argentina", tipo: "comunidad" },
  { md: "06-15", nombre: "Día Nacional del Libro (Argentina)", idea: "Joyas escondidas o autoras hispanohablantes.", region: "argentina", tipo: "libro" },
  { md: "06-28", nombre: "Día del Orgullo", idea: "Romance queer: libros con representación que recomendarías.", region: "global", tipo: "comunidad" },
  { md: "06-30", nombre: "Mitad de año", idea: "Mid-Year Freak Out Tag: mejores y peores lecturas.", region: "global", tipo: "comunidad" },
  { md: "08-09", nombre: "Día del Amante de los Libros", idea: "Tu historia de amor con los libros en una foto o reel.", region: "global", tipo: "comunidad" },
  { md: "08-24", nombre: "Día del Lector (Argentina)", idea: "Tu ritual de lectura o tu rincón favorito.", region: "argentina", tipo: "comunidad" },
  { md: "09-06", nombre: "Día de Leer un Libro (EE. UU.)", idea: "Lo que estás leyendo hoy.", region: "eeuu", tipo: "libro" },
  { md: "09-08", nombre: "Día Internacional de la Alfabetización", idea: "Cómo te hiciste lectora.", region: "global", tipo: "comunidad" },
  { md: "09-13", nombre: "Día del Bibliotecario (Argentina)", idea: "Tu biblioteca favorita o el préstamo que te salvó la semana.", region: "argentina", tipo: "comunidad" },
  { md: "10-24", nombre: "Día de las Bibliotecas (España)", idea: "Tu biblioteca favorita o tu último préstamo.", region: "espana", tipo: "comunidad" },
  { md: "10-31", nombre: "Halloween", idea: "Libros oscuros: dark academia, gótico, terror.", region: "global", tipo: "temporada" },
  { md: "11-02", nombre: "Día de Muertos (México)", idea: "Lecturas con muerte, duelo o realismo mágico; un altar de libros.", region: "mexico", tipo: "temporada" },
  { md: "11-12", nombre: "Día Nacional del Libro (México)", idea: "Autoras y autores mexicanos que deberían estar en tu estantería.", region: "mexico", tipo: "libro" },
  { md: "12-25", nombre: "Navidad", idea: "Árbol de libros o libros de confort.", region: "global", tipo: "temporada" },
  { md: "12-31", nombre: "Cierre de año", idea: "Wrap-up anual y balance de compras vs. lecturas.", region: "global", tipo: "comunidad" }
];

export const KEY_EV = "calendario_eventos";   // clave propia: no forma parte del respaldo de Ideas
export const TIPOS_EV = { lanzamiento: "Lanzamiento", arc: "Plazo de ARC", colaboracion: "Colaboración", otro: "Otro" };
export const MAX_EV = 200;
export const MAX_TIT_EV = 80;
