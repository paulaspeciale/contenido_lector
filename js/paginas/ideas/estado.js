/* estado.js · Limpieza y serialización del estado de Ideas.

   Todo lo que llega de localStorage, de un respaldo importado o de la nube
   pasa por limpiarDato(), limpiarSets() y limpiarEstado(). Devuelven solo los
   campos conocidos, con tipo y longitud válidos, para que un archivo manipulado
   no pueda romper la app ni colar datos raros.

   limpiarEstado() y limpiarDato() reciben la base de ideas y el número de
   secciones porque main.js los construye a partir de window.BT.SECCIONES. */
import {
  CUSTOM_RE, FORMATOS, INTERMEDIOS, MAX_HASHTAGS, MAX_LIBRO, MAX_NOTA,
  MAX_SECCION, MAX_SETS, MAX_NOMBRE_SET, MAX_TEXTO, CLAVES_PASOS, CLAVES_REDES
} from "./constantes.js";
import { fechaAceptable, normalizar, tagsATexto, partirTags, marcaValida, tienePropio } from "./util.js";

export function limpiarDato(d, hecha, numSecciones) {
  const limpio = {};
  if (!d || typeof d !== "object") return limpio;
  if (d.fav === true) limpio.fav = true;
  if (!hecha && typeof d.estado === "string" && INTERMEDIOS.indexOf(d.estado) !== -1) limpio.estado = d.estado;
  if (typeof d.fecha === "string" && fechaAceptable(d.fecha)) limpio.fecha = d.fecha;
  if (typeof d.libro === "string" && d.libro.trim()) limpio.libro = d.libro.slice(0, MAX_LIBRO);
  if (typeof d.hashtags === "string" && d.hashtags.trim()) limpio.hashtags = d.hashtags.slice(0, MAX_HASHTAGS);
  if (typeof d.nota === "string" && d.nota) limpio.nota = d.nota.slice(0, MAX_NOTA);
  if (Array.isArray(d.pasos)) {
    const p = CLAVES_PASOS.filter(function (k) { return d.pasos.indexOf(k) !== -1; });
    if (p.length) limpio.pasos = p;
  }
  if (Array.isArray(d.redes)) {
    const rs = CLAVES_REDES.filter(function (k) { return d.redes.indexOf(k) !== -1; });
    if (rs.length) limpio.redes = rs;
  }
  // Edición de ideas: texto/formato/sección propios, orden de prioridad y borrado
  if (typeof d.texto === "string" && d.texto.trim()) limpio.texto = d.texto.replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO + 40);
  if (typeof d.formato === "string" && FORMATOS.indexOf(d.formato) !== -1) limpio.formato = d.formato;
  if (typeof d.sec === "number" && d.sec >= 0 && d.sec < numSecciones && Math.floor(d.sec) === d.sec) limpio.sec = d.sec;
  // Sección creada por la persona: se guarda su nombre en cada idea que pertenece a ella
  if (typeof d.secNombre === "string") {
    const sn = d.secNombre.replace(/\s+/g, " ").trim().slice(0, MAX_SECCION);
    if (sn) limpio.secNombre = sn;
  }
  if (typeof d.orden === "number" && isFinite(d.orden)) limpio.orden = d.orden;
  if (d.propia === true) limpio.propia = true;
  if (d.borrada === true) limpio.borrada = true;
  if (limpio.secNombre) delete limpio.sec;
  return limpio;
}

// Valida y normaliza los conjuntos de hashtags: nombre único, sin duplicados
// (comparando sin tildes ni mayúsculas) y con los tags en formato «#uno #dos».
export function limpiarSets(arr) {
  const out = [];
  const vistos = Object.create(null);
  if (!Array.isArray(arr)) return out;
  arr.forEach(function (s) {
    if (out.length >= MAX_SETS || !s || typeof s !== "object") return;
    const nombre = typeof s.nombre === "string" ? s.nombre.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE_SET) : "";
    const tags = typeof s.tags === "string" ? tagsATexto(partirTags(s.tags), MAX_HASHTAGS) : "";
    const k = normalizar(nombre);
    if (!nombre || !tags || vistos[k]) return;
    vistos[k] = true;
    out.push({ nombre: nombre, tags: tags });
  });
  return out;
}

// Una idea propia es válida si tiene el formato de id esperado, está marcada como propia y tiene texto (o está borrada).
export function idPropioValido(id, limpio) {
  return CUSTOM_RE.test(id) && !!limpio && limpio.propia === true && (!!limpio.texto || limpio.borrada === true);
}

// Reconstruye un estado válido a partir de un objeto cualquiera (localStorage,
// respaldo o nube). Devuelve null si no tiene forma de estado. Descarta ids
// desconocidos, campos inválidos y marcas que no sean números positivos.
export function limpiarEstado(obj, baseInfo, numSecciones) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const candidatas = Object.create(null);
  const hechas = {};
  const datos = {};
  const mod = {};
  if (Array.isArray(obj.hechas)) {
    obj.hechas.forEach(function (id) {
      id = String(id);
      if (id.length <= 40) candidatas[id] = true;
    });
  }
  if (obj.datos && typeof obj.datos === "object" && !Array.isArray(obj.datos)) {
    Object.keys(obj.datos).forEach(function (id) {
      if (id.length > 40 || !(baseInfo[id] || CUSTOM_RE.test(id))) return;
      const limpio = limpiarDato(obj.datos[id], !!candidatas[id], numSecciones);
      if (!baseInfo[id] && !idPropioValido(id, limpio)) return;
      if (Object.keys(limpio).length) datos[id] = limpio;
    });
  }
  Object.keys(candidatas).forEach(function (id) {
    if (baseInfo[id] || tienePropio(datos, id)) hechas[id] = true;
  });
  if (obj.mod && typeof obj.mod === "object" && !Array.isArray(obj.mod)) {
    Object.keys(obj.mod).forEach(function (id) {
      if ((baseInfo[id] || tienePropio(datos, id)) && marcaValida(obj.mod[id])) mod[id] = obj.mod[id];
    });
  }
  return { hechas: hechas, datos: datos, sets: limpiarSets(obj.sets), mod: mod, modSets: marcaValida(obj.modSets) };
}

export function estadoVacio() { return { hechas: {}, datos: {}, sets: [], mod: {}, modSets: 0 }; }

// Forma que se guarda en localStorage y en los respaldos JSON. «version: 1»
// permite reconocer respaldos de esta versión al importar.
export function serializarEstado(state) {
  return { version: 1, hechas: Object.keys(state.hechas), datos: state.datos, sets: state.sets, mod: state.mod, modSets: state.modSets };
}
