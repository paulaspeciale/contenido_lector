/* constantes.js · Claves, límites y catálogos de la página de Ideas.

   Se importan desde main.js, estado.js y util.js. No dependen del DOM ni de
   window.BT: solo describen el formato de los datos y de la interfaz. */
// Claves de localStorage. Las dos «ANTIGUA» son de versiones anteriores de la
// app y solo se leen para migrar; nunca se borran.
export const KEY = "ideas_post_90_v1";
export const KEY_META = "ideas_post_90_meta";
export const KEY_DESHACER = "ideas_post_90_deshacer";
export const KEY_ANTIGUA_HECHAS = "ideas_post_90_marcadas";
export const KEY_ANTIGUA_DATOS = "ideas_post_90_datos";
export const DIAS_RESPALDO = 30;   // se avisa una vez al mes si hay cambios sin respaldar
export const TITULO_DETALLE = "Libro, hashtags y notas";
export const MAX_NOTA = 5000;
export const MAX_LIBRO = 200;
export const MAX_HASHTAGS = 500;
export const MAX_SETS = 30;
export const MAX_NOMBRE_SET = 40;

// "publicada" equivale a la casilla "hecha"; "idea" es el estado por defecto.
export const ESTADOS = [
  ["idea", "Idea"],
  ["grabando", "Grabando"],
  ["editando", "Editando"],
  ["programada", "Programada"],
  ["publicada", "Publicada"],
  ["descartada", "Descartada"]
];
// Estados que se guardan en datos[id].estado ("publicada" es la casilla "hecha")
export const INTERMEDIOS = ["grabando", "editando", "programada", "descartada"];
export const FORMATOS = ["Post", "Carrusel", "Reel"];
export const MAX_TEXTO = 300;
export const MAX_SECCION = 60;   // largo máximo del nombre de una sección nueva
export const CUSTOM_RE = /^c[a-z0-9]{6,24}$/;   // ids de las ideas que creas tú
// Rango de fechas aceptado en todos los campos (evita años absurdos o textos).
export const FECHA_MIN = "2000-01-01";
export const FECHA_MAX = "2100-12-31";
// Pasos de producción de cada idea (checklist)
export const PASOS = [
  ["guion", "Guion"],
  ["grabar", "Grabar o foto"],
  ["editar", "Editar"],
  ["caption", "Caption"],
  ["programar", "Programar"]
];
export const CLAVES_PASOS = PASOS.map(function (p) { return p[0]; });
// Redes donde se piensa publicar cada idea (puede ser más de una)
export const REDES = [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"]];
export const CLAVES_REDES = REDES.map(function (r) { return r[0]; });
