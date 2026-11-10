/* util.js · Utilidades puras de la página de Ideas.

   Funciones pequeñas, sin estado ni DOM compartido: normalización de texto,
   fechas, creación de elementos, hashtags y comprobaciones de tipos. */
import { ESTADOS, FECHA_MIN, FECHA_MAX } from "./constantes.js";

export function fechaAceptable(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && fechaReal(v) && v >= FECHA_MIN && v <= FECHA_MAX;
}

// Normaliza para buscar: quita tildes, pasa a minúsculas y unifica espacios.
export function normalizar(txt) {
  return String(txt).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Comprueba que una cadena se pueda interpretar como fecha (para metadatos).
export function esFechaISO(s) {
  return typeof s === "string" && !isNaN(Date.parse(s));
}

// ¿La fecha existe de verdad? Date «corrige» días fuera de rango; aquí se
// compara el resultado con los números originales para detectarlo.
export function fechaReal(s) {
  const p = s.split("-").map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
}

export function pad(n) { return (n < 10 ? "0" : "") + n; }
// Fecha local (no UTC) en formato AAAA-MM-DD, la que usan los <input type="date">.
export function isoLocal(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

// Pequeño helper para crear elementos: { text } asigna texto y el resto, atributos.
export function el(tag, props) {
  const n = document.createElement(tag);
  if (props) {
    Object.keys(props).forEach(function (k) {
      if (k === "text") { n.textContent = props[k]; } else { n.setAttribute(k, props[k]); }
    });
  }
  return n;
}

// Texto visible del estado ("publicada", "grabando"...).
export function etiquetaEstado(valor) {
  for (let i = 0; i < ESTADOS.length; i++) { if (ESTADOS[i][0] === valor) return ESTADOS[i][1]; }
  return valor;
}

// ---- Hashtags: se guardan como "#uno #dos", sin repetir ----
export function partirTags(txt) {
  const vistos = Object.create(null);
  const out = [];
  String(txt).split(/[\s,]+/).forEach(function (t) {
    if (!t) return;
    if (t.charAt(0) !== "#") t = "#" + t;
    if (t.length < 2) return;
    const k = t.toLowerCase();
    if (vistos[k]) return;
    vistos[k] = true;
    out.push(t);
  });
  return out;
}

export function tagsATexto(tokens, max) {
  let s = "";
  for (let i = 0; i < tokens.length; i++) {
    const n = s ? s + " " + tokens[i] : tokens[i];
    if (n.length > max) break;
    s = n;
  }
  return s;
}

export function marcaValida(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : 0; }

export function tienePropio(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }
