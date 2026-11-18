/* ==========================================================================
   plan.js · Formato de intercambio del plan de contenido y escritura de sus
   publicaciones en el calendario.

   La IA devuelve un único bloque JSON con esta forma:
     {
       "tipo": "plan-calendario",
       "version": 1,
       "inicio": "AAAA-MM-DD",
       "publicaciones": [
         { "dia": 1, "fecha": "AAAA-MM-DD", "titulo": "…", "formato": "Reel",
           "gancho": "…", "cta": "…", "produccion": "…" }
       ]
     }

   Este módulo no toca el DOM. Sirve para el generador de prompt (leer y
   validar) y para escribir los eventos en localStorage. El gancho, el CTA y
   la producción se validan y se muestran en la revisión, pero no se guardan
   en el calendario: allí solo viven fecha, título, formato y tipo de evento.

   Las fechas se calculan con días locales (nunca con zonas horarias) y se
   aceptan tanto el número de día del plan como una fecha explícita. Si vienen
   los dos y no coinciden, manda el número de día. Si el usuario elige otra
   fecha de inicio, el plan entero se recoloca desde ella.
   ========================================================================== */
import { KEY_EV, KEY_RESP, MAX_EV, MAX_TIT_EV, FORMATOS } from "../paginas/calendario/constantes.js";

export const TIPO_PLAN = "plan-calendario";
export const VERSION_PLAN = 1;
export const MAX_PUBLICACIONES = 1000;
export const MAX_EVENTOS = MAX_EV;   // límite real del calendario

const DIAS_MAX = 3660;          // diez años: más que cualquier plan razonable
const MAX_TEXTO = 4000;         // gancho, CTA y producción en la revisión
const RE_ISO = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- Fechas ISO sin zona horaria ---------- */
function pad(n) { return (n < 10 ? "0" : "") + n; }
function isoDe(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function deIso(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }

export function fechaValida(s) {
  if (typeof s !== "string" || !RE_ISO.test(s)) return false;
  const d = deIso(s);
  return isoDe(d) === s && s >= "2000-01-01" && s <= "2100-12-31";
}

export function sumarDias(iso, n) {
  const d = deIso(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
}

/* ---------- Extracción del JSON ---------- */

/* Devuelve el objeto del plan que haya dentro de un texto (JSON pegado,
   archivo .json, .txt o .md con prosa y vallas Markdown). Prioriza los
   objetos con «publicaciones»; si no hay ninguno, devuelve el último objeto
   JSON válido para que la validación explique qué falta. */
export function extraerJson(texto) {
  const bruto = String(texto == null ? "" : texto).replace(/^\uFEFF/, "").trim();
  if (!bruto) return null;

  // 1. El texto entero ya es JSON.
  try {
    const entero = JSON.parse(bruto);
    if (esObjeto(entero)) return entero;
  } catch (e) { /* se sigue buscando */ }

  let primero = null, conPublicaciones = null;

  // 2. Bloques cercados con ``` o ```json.
  const re = /```(?:json|JSON)?\s*([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(bruto)) !== null) {
    const trozo = m[1].trim();
    try {
      const valor = JSON.parse(trozo);
      if (!esObjeto(valor)) continue;
      if (esObjetoPlan(valor)) conPublicaciones = valor;
      else if (!primero) primero = valor;
    } catch (e) { /* el bloque no era JSON: se prueba con el escaneo */ }
  }
  if (conPublicaciones) return conPublicaciones;

  // 3. Escaneo de llaves equilibradas: sirve para JSON sin vallas o rodeado
  //    de prosa. Respeta las cadenas y los escapes.
  const objetos = objetosEquilibrados(bruto);
  objetos.forEach(function (valor) {
    if (esObjetoPlan(valor)) conPublicaciones = valor;
    else if (!primero) primero = valor;
  });
  return conPublicaciones || primero;
}

function esObjeto(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
function esObjetoPlan(v) { return esObjeto(v) && Array.isArray(v.publicaciones); }

function objetosEquilibrados(texto) {
  const out = [];
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] !== "{") continue;
    let nivel = 0, cadena = false, escape = false;
    for (let j = i; j < texto.length; j++) {
      const c = texto[j];
      if (cadena) {
        if (escape) escape = false;
        else if (c === "\\") escape = true;
        else if (c === '"') cadena = false;
      } else if (c === '"') {
        cadena = true;
      } else if (c === "{") {
        nivel++;
      } else if (c === "}") {
        nivel--;
        if (nivel === 0) {
          try { out.push(JSON.parse(texto.slice(i, j + 1))); } catch (e) { /* no era JSON */ }
          break;
        }
      }
    }
  }
  return out;
}

/* ---------- Validación y normalización ---------- */

function limpiar(v) { return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : ""; }
function sinAcentos(s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function textoLargo(v) { return typeof v === "string" ? v.trim().slice(0, MAX_TEXTO) : ""; }

function normalizarFormato(v) {
  const clave = sinAcentos(limpiar(v).toLowerCase());
  if (!clave) return "";
  const mapa = { post: "Post", carrusel: "Carrusel", carousel: "Carrusel", reel: "Reel", reels: "Reel", video: "Reel" };
  if (mapa[clave]) return mapa[clave];
  for (let i = 0; i < FORMATOS.length; i++) {
    const f = FORMATOS[i];
    if (clave.indexOf(sinAcentos(f.toLowerCase())) !== -1) return f;
  }
  return "";
}

function clavePublicacion(fecha, titulo) {
  return fecha + "|" + titulo.replace(/\s+/g, " ").trim().toLowerCase();
}

/* Valida un objeto ya extraído y devuelve el plan listo para revisar.
   opciones.inicio: fecha elegida en la interfaz (manda sobre la del archivo).
   opciones.semanas: desplazamiento entero en semanas (puede ser negativo). */
export function normalizarPlan(valor, opciones) {
  const errores = [], avisos = [];
  const opt = opciones && typeof opciones === "object" ? opciones : {};
  const o = esObjeto(valor) ? valor : null;

  if (!o) {
    return { ok: false, plan: null, errores: ["El contenido no es un objeto JSON."], avisos: avisos };
  }
  if (o.tipo !== undefined && o.tipo !== TIPO_PLAN) {
    avisos.push("El campo «tipo» no es «" + TIPO_PLAN + "»; se intentará leer igualmente.");
  }
  if (o.version !== undefined && Number(o.version) !== VERSION_PLAN) {
    avisos.push("La versión del plan no es " + VERSION_PLAN + "; se intentará leer igualmente.");
  }

  const lista = Array.isArray(o.publicaciones) ? o.publicaciones : null;
  if (!lista) {
    return { ok: false, plan: null, errores: ["Falta la lista «publicaciones» del plan."], avisos: avisos };
  }
  if (!lista.length) {
    return { ok: false, plan: null, errores: ["El plan no tiene publicaciones."], avisos: avisos };
  }
  if (lista.length > MAX_PUBLICACIONES) {
    return {
      ok: false, plan: null,
      errores: ["El plan trae " + lista.length + " publicaciones; el máximo es " + MAX_PUBLICACIONES + "."],
      avisos: avisos
    };
  }

  const inicioArchivo = fechaValida(o.inicio) ? o.inicio : "";
  const inicioElegido = fechaValida(opt.inicio) ? opt.inicio : "";
  const inicio = inicioElegido || inicioArchivo;
  const cambioDeInicio = !!(inicioElegido && inicioArchivo && inicioElegido !== inicioArchivo);
  if (!inicio) {
    errores.push("No hay una fecha de inicio válida. Elige la fecha del primer día del plan.");
  } else if (cambioDeInicio) {
    avisos.push("El archivo indica que empieza el " + inicioArchivo + "; se usará la fecha elegida (" + inicioElegido + ") y se moverán todas las publicaciones.");
  }

  let semanas = 0;
  if (opt.semanas !== undefined && opt.semanas !== null && opt.semanas !== "") {
    const n = Number(opt.semanas);
    if (!Number.isInteger(n) || n < -520 || n > 520) {
      errores.push("El desplazamiento debe ser un número entero de semanas entre -520 y 520.");
    } else {
      semanas = n;
    }
  }
  const desplazamiento = semanas * 7;

  const vistos = Object.create(null);
  const publicaciones = [];

  lista.forEach(function (p, i) {
    const pos = "Publicación " + (i + 1);
    if (!esObjeto(p)) {
      errores.push(pos + ": no es un objeto.");
      return;
    }

    const diaNum = Number(p.dia);
    const diaOk = Number.isInteger(diaNum) && diaNum >= 1 && diaNum <= DIAS_MAX;
    const fechaTexto = limpiar(p.fecha);
    const fechaOk = fechaValida(fechaTexto);

    let base = "";
    if (diaOk && inicio) {
      base = sumarDias(inicio, diaNum - 1);
      if (fechaOk && fechaTexto !== base && !cambioDeInicio) {
        avisos.push(pos + ": la fecha (" + fechaTexto + ") no coincide con el día " + diaNum + "; se usará " + base + ".");
      }
    } else if (fechaOk) {
      base = fechaTexto;
    } else {
      errores.push(pos + ": necesita un «dia» entero entre 1 y " + DIAS_MAX + " o una «fecha» válida (AAAA-MM-DD).");
      return;
    }

    const fecha = desplazamiento ? sumarDias(base, desplazamiento) : base;
    if (!fechaValida(fecha)) {
      errores.push(pos + ": la fecha resultante (" + fecha + ") queda fuera del calendario (2000-2100).");
      return;
    }

    let titulo = limpiar(p.titulo);
    if (!titulo) {
      errores.push(pos + ": falta el título.");
      return;
    }
    if (titulo.length > MAX_TIT_EV) {
      avisos.push(pos + ": el título se recorta a " + MAX_TIT_EV + " caracteres.");
      titulo = titulo.slice(0, MAX_TIT_EV).trim();
    }

    const formato = normalizarFormato(p.formato);
    if (!formato) avisos.push(pos + ": formato desconocido; se guardará sin formato.");

    const clave = clavePublicacion(fecha, titulo);
    if (vistos[clave]) {
      avisos.push(pos + ": está repetida (" + fecha + " · " + titulo + "); se omite.");
      return;
    }
    vistos[clave] = true;

    publicaciones.push({
      dia: diaOk ? diaNum : null,
      fecha: fecha,
      titulo: titulo,
      formato: formato,
      gancho: textoLargo(p.gancho),
      cta: textoLargo(p.cta),
      produccion: textoLargo(p.produccion)
    });
  });

  if (!publicaciones.length && !errores.length) {
    errores.push("No hay ninguna publicación válida en el plan.");
  }

  const plan = publicaciones.length ? { inicio: inicio, semanas: semanas, publicaciones: publicaciones } : null;
  return { ok: !!plan && errores.length === 0, plan: plan, errores: errores, avisos: avisos };
}

/* Cuenta las publicaciones del plan que se pueden añadir ahora mismo, sin
   escribir nada. Se usa para la revisión previa del generador. */
export function analizarImportacion(plan) {
  const pubs = plan && Array.isArray(plan.publicaciones) ? plan.publicaciones : [];
  const eventos = leerEventos();
  const claves = Object.create(null);
  eventos.forEach(function (e) { claves[claveEvento(e)] = true; });

  let duplicados = 0;
  pubs.forEach(function (p) {
    if (claves[clavePublicacion(p.fecha, p.titulo)]) duplicados++;
  });
  const hueco = Math.max(0, MAX_EV - eventos.length);
  const unicas = pubs.length - duplicados;
  const sinSitio = Math.max(0, unicas - hueco);

  return {
    total: pubs.length,
    duplicados: duplicados,
    disponibles: hueco,
    sinSitio: sinSitio,
    anadibles: unicas - sinSitio,
    maximo: MAX_EV
  };
}

/* Escribe las publicaciones como eventos del calendario. Es idempotente por
   fecha + título y respeta el límite de MAX_EV. Si localStorage falla, no
   deja cambios a medias. */
export function importarPlan(plan) {
  const pubs = plan && Array.isArray(plan.publicaciones) ? plan.publicaciones : [];
  const vacio = { ok: false, anadidos: 0, duplicados: 0, sinSitio: 0, total: 0, error: "" };
  if (!pubs.length) return Object.assign({}, vacio, { error: "El plan no tiene publicaciones." });

  let eventos;
  try {
    eventos = leerEventos();
  } catch (e) {
    return Object.assign({}, vacio, { error: "No se pudieron leer los eventos guardados." });
  }

  const claves = Object.create(null), ids = Object.create(null);
  eventos.forEach(function (e) {
    if (e && typeof e.id === "string") ids[e.id] = true;
    if (e && typeof e.titulo === "string") claves[claveEvento(e)] = true;
  });

  let hueco = Math.max(0, MAX_EV - eventos.length);
  let duplicados = 0, sinSitio = 0;
  const nuevos = [];

  pubs.forEach(function (p) {
    const clave = clavePublicacion(p.fecha, p.titulo);
    if (claves[clave]) { duplicados++; return; }
    if (!hueco) { sinSitio++; return; }

    const ev = {
      id: nuevoId(ids),
      fecha: p.fecha,
      titulo: p.titulo,
      tipo: "publicacion"
    };
    if (p.formato) ev.formato = p.formato;

    ids[ev.id] = true;
    claves[clave] = true;
    nuevos.push(ev);
    hueco--;
  });

  if (!nuevos.length) {
    return { ok: true, anadidos: 0, duplicados: duplicados, sinSitio: sinSitio, total: pubs.length, error: "" };
  }

  try {
    localStorage.setItem(KEY_EV, JSON.stringify({ version: 1, eventos: eventos.concat(nuevos) }));
    marcarCambio();
  } catch (e) {
    return {
      ok: false, anadidos: 0, duplicados: duplicados, sinSitio: sinSitio, total: pubs.length,
      error: "No se pudo guardar en el navegador. Es posible que el almacenamiento esté lleno o bloqueado."
    };
  }

  return { ok: true, anadidos: nuevos.length, duplicados: duplicados, sinSitio: sinSitio, total: pubs.length, error: "" };
}

/* ---------- Almacenamiento ---------- */

function leerEventos() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY_EV));
    return o && Array.isArray(o.eventos) ? o.eventos.filter(function (e) { return e && typeof e === "object"; }) : [];
  } catch (e) {
    return [];
  }
}

function claveEvento(e) {
  const fecha = e && typeof e.fecha === "string" ? e.fecha : "";
  const titulo = e && typeof e.titulo === "string" ? e.titulo : "";
  return clavePublicacion(fecha, titulo);
}

function nuevoId(usados) {
  let id;
  do {
    id = "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  } while (usados[id]);
  return id;
}

/* El calendario usa KEY_RESP para avisar de cambios sin respaldar. */
function marcarCambio() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY_RESP));
    const o = r && typeof r === "object" ? r : {};
    o.cambio = Date.now();
    localStorage.setItem(KEY_RESP, JSON.stringify(o));
  } catch (e) { /* el aviso de respaldo no es crítico */ }
}
