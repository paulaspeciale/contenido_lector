/* util.js · Utilidades puras del Calendario.

   Fechas ISO, creación de elementos y pequeños ayudantes sin estado. */
export function tiene(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
export function pad(n) { return (n < 10 ? "0" : "") + n; }
export function isoDe(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
export function deIso(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
export function fechaValida(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = deIso(s);
  return isoDe(d) === s && s >= "2000-01-01" && s <= "2100-12-31";
}
export function el(tag, cls, txt) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined) n.textContent = txt;
  return n;
}
export function partir(t) {
  return String(t).replace(/^[★◆]\s*/, "").replace(/\s*\[(?:Post|Carrusel|Reel)\]\s*$/, "");
}

export function juevesMarzo(y) { const d = new Date(y, 2, 1); return "03-" + pad(1 + ((4 - d.getDay() + 7) % 7)); }
