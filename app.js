(function () {
  "use strict";

  // Si app.js se carga sin datos-ideas.js, lo pide él mismo (desde la misma carpeta que app.js)
  // y arranca cuando llega. Solo si ese archivo tampoco se puede cargar sale el cartel rojo.
  function datosListos() {
    return !!(window.BT && window.BT.SECCIONES && window.BT.SECCIONES.length);
  }
  if (datosListos()) {
    iniciar();
  } else {
    const actual = document.currentScript;
    let srcDatos = "datos-ideas.js";
    if (actual && actual.src) srcDatos = actual.src.replace(/[^\/?#]*(?:[?#].*)?$/, "datos-ideas.js");
    const tag = document.createElement("script");
    tag.src = srcDatos;
    tag.onload = iniciar;
    tag.onerror = iniciar;   // si falla, iniciar() muestra el cartel rojo como antes
    document.head.appendChild(tag);
  }

  function iniciar() {

  // ---- Comprobación: el HTML y este archivo tienen que ser de la misma versión ----
  const REQUERIDOS = [
    "lista", "mensaje", "recordatorio", "sync-estado", "sync-ahora", "contador", "favoritas", "total", "progreso",
    "barra", "btn-filtros", "panel-filtros", "por-estado", "buscar", "f-estado", "f-formato", "f-fecha", "f-prod",
    "f-fav", "f-orden", "resultados", "sorpresa", "sorpresa-btn", "limpiar", "deshacer", "dialogo", "dialogo-texto",
    "dialogo-si", "dialogo-no", "lista-sets", "set-nombre", "set-tags", "set-guardar", "set-cancelar", "set-mensaje",
    "abrir-secciones", "cerrar-secciones", "abrir-detalles", "cerrar-detalles", "exportar", "exportar-csv",
    "exportar-ics", "importar", "reiniciar", "total-ideas", "nueva-idea", "dialogo-idea", "dialogo-idea-titulo",
    "idea-texto", "idea-formato", "idea-seccion", "idea-error", "idea-guardar", "idea-cancelar", "copiado",
    "dialogo-copiar", "copiar-texto", "copiar-cerrar", "panel-borradas", "resumen-borradas", "lista-borradas",
    "idea-seccion-nueva", "idea-seccion-nueva-campo"
  ];
  const faltan = REQUERIDOS.filter(function (id) { return !document.getElementById(id); });
  if (!(window.BT && window.BT.SECCIONES && window.BT.SECCIONES.length)) faltan.unshift("datos-ideas.js");
  if (faltan.length) {
    const aviso0 = document.createElement("p");
    aviso0.setAttribute("role", "alert");
    aviso0.style.cssText = "padding:1rem;margin:1rem 0;border:2px solid #c0392b;font:1rem/1.5 system-ui,sans-serif";
    aviso0.textContent = "No se pudo cargar la lista: faltan archivos o están desactualizados (falta " +
      faltan.slice(0, 3).join(", ") + (faltan.length > 3 ? " y " + (faltan.length - 3) + " más" : "") +
      "). Descarga de nuevo los archivos (ideas_post_90.html, datos-ideas.js, base.css, ideas.css, toc.css y app.js) y déjalos juntos en la misma carpeta, " +
      "sustituyendo los anteriores. Tu progreso guardado no se ha tocado.";
    const destino = document.getElementById("lista") || document.body;
    destino.insertBefore(aviso0, destino.firstChild);
    return;
  }

  // ---- Datos: las 90 ideas viven en datos-ideas.js (se carga antes que este archivo) ----
  const SECCIONES = (window.BT && window.BT.SECCIONES) || [];

  const KEY = "ideas_post_90_v1";
  const KEY_META = "ideas_post_90_meta";
  const KEY_DESHACER = "ideas_post_90_deshacer";
  const KEY_ANTIGUA_HECHAS = "ideas_post_90_marcadas";
  const KEY_ANTIGUA_DATOS = "ideas_post_90_datos";
  const DIAS_RESPALDO = 30;   // se avisa una vez al mes si hay cambios sin respaldar
  const TITULO_DETALLE = "Libro, hashtags y notas";
  const MAX_NOTA = 5000, MAX_LIBRO = 200, MAX_HASHTAGS = 500;
  const MAX_SETS = 30, MAX_NOMBRE_SET = 40;

  // "publicada" equivale a la casilla "hecha"; "idea" es el estado por defecto.
  const ESTADOS = [
    ["idea", "Idea"],
    ["grabando", "Grabando"],
    ["editando", "Editando"],
    ["programada", "Programada"],
    ["publicada", "Publicada"],
    ["descartada", "Descartada"]
  ];
  // Estados que se guardan en datos[id].estado ("publicada" es la casilla "hecha")
  const INTERMEDIOS = ["grabando", "editando", "programada", "descartada"];
  const FORMATOS = ["Post", "Carrusel", "Reel"];
  const MAX_TEXTO = 300;
  const MAX_SECCION = 60;   // largo máximo del nombre de una sección nueva
  const CUSTOM_RE = /^c[a-z0-9]{6,24}$/;   // ids de las ideas que creas tú
const FECHA_MIN = "2000-01-01", FECHA_MAX = "2100-12-31";
function fechaAceptable(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && fechaReal(v) && v >= FECHA_MIN && v <= FECHA_MAX;
}
  // Pasos de producción de cada idea (checklist)
  const PASOS = [
    ["guion", "Guion"],
    ["grabar", "Grabar o foto"],
    ["editar", "Editar"],
    ["caption", "Caption"],
    ["programar", "Programar"]
  ];
  const CLAVES_PASOS = PASOS.map(function (p) { return p[0]; });

  // Ideas base (las 90 originales): su texto, formato, sección y posición de origen.
  const baseInfo = Object.create(null);
  const baseIds = [];
  SECCIONES.forEach(function (s, si) {
    s.ideas.forEach(function (i) {
      baseInfo[i.id] = { texto: i.texto, formato: i.formato, sec: si, orden: (baseIds.length + 1) * 1000 };
      baseIds.push(i.id);
    });
  });
  let todas = [];   // ideas activas (sin borrar); se reconstruye en sincronizarEstructura()

  function tituloSeccion(t) { return String(t).replace(/\s*\(\d+\)\s*$/, ""); }

  // ---- Utilidades ----
  function leer(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function escribir(key, valor) {
    try {
      localStorage.setItem(key, JSON.stringify(valor));
      return true;
    } catch (err) {
      console.error("No se pudo guardar en localStorage:", err);
      return false;
    }
  }

  function borrar(key) {
    try { localStorage.removeItem(key); } catch (err) { /* sin acción */ }
  }

  function almacenamientoDisponible() {
    try {
      localStorage.setItem("__prueba", "1");
      localStorage.removeItem("__prueba");
      return true;
    } catch (err) {
      return false;
    }
  }

  function normalizar(txt) {
    return String(txt).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function esFechaISO(s) {
    return typeof s === "string" && !isNaN(Date.parse(s));
  }

  function fechaReal(s) {
    const p = s.split("-").map(Number);
    const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoLocal(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  function el(tag, props) {
    const n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === "text") { n.textContent = props[k]; } else { n.setAttribute(k, props[k]); }
      });
    }
    return n;
  }

  function etiquetaEstado(valor) {
    for (let i = 0; i < ESTADOS.length; i++) { if (ESTADOS[i][0] === valor) return ESTADOS[i][1]; }
    return valor;
  }

  // ---- Hashtags: se guardan como "#uno #dos", sin repetir ----
  function partirTags(txt) {
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

  function tagsATexto(tokens, max) {
    let s = "";
    for (let i = 0; i < tokens.length; i++) {
      const n = s ? s + " " + tokens[i] : tokens[i];
      if (n.length > max) break;
      s = n;
    }
    return s;
  }

  // ---- Estado ----
  // { hechas: {id: true},
  //   datos: {id: {fav, estado, fecha, libro, hashtags, nota, pasos}},
  //   sets: [{nombre, tags}],
  //   mod: {id: marca de tiempo}, modSets: marca de tiempo }   (mod* sirven para sincronizar)
  function limpiarDato(d, hecha) {
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
    // Edición de ideas: texto/formato/sección propios, orden de prioridad y borrado
    if (typeof d.texto === "string" && d.texto.trim()) limpio.texto = d.texto.replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO + 40);
    if (typeof d.formato === "string" && FORMATOS.indexOf(d.formato) !== -1) limpio.formato = d.formato;
    if (typeof d.sec === "number" && d.sec >= 0 && d.sec < SECCIONES.length && Math.floor(d.sec) === d.sec) limpio.sec = d.sec;
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

  function limpiarSets(arr) {
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

  function marcaValida(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : 0; }

  function tienePropio(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }

  // Una idea propia es válida si tiene el formato de id esperado, está marcada como propia y tiene texto (o está borrada).
  function idPropioValido(id, limpio) {
    return CUSTOM_RE.test(id) && !!limpio && limpio.propia === true && (!!limpio.texto || limpio.borrada === true);
  }

  function limpiarEstado(obj) {
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
        const limpio = limpiarDato(obj.datos[id], !!candidatas[id]);
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

  function estadoVacio() { return { hechas: {}, datos: {}, sets: [], mod: {}, modSets: 0 }; }

  
  function serializar() {
    return { version: 1, hechas: Object.keys(state.hechas), datos: state.datos, sets: state.sets, mod: state.mod, modSets: state.modSets };
  }
    const KEY_CORRUPTO = "ideas_post_90_corrupto";
  let guardadoBloqueado = false;   // true si hay datos ilegibles y no se pudo copiar
  let crudoDaniado = "";           // copia en memoria del dato dañado
  let claveCopia = KEY_CORRUPTO;

  function tieneFormatoRespaldo(o) {
    return !!o && typeof o === "object" && !Array.isArray(o) &&
      (Array.isArray(o.hechas) || (!!o.datos && typeof o.datos === "object" && !Array.isArray(o.datos)));
  }

  // Distingue: "vacio" (no existe), "ok", "danado" (existe pero no sirve) e "inaccesible".
  function inspeccionarAlmacen() {
    let crudo = null;
    try { crudo = localStorage.getItem(KEY); } catch (err) { return { tipo: "inaccesible" }; }
    if (crudo === null) return { tipo: "vacio" };
    let parseado;
    try { parseado = JSON.parse(crudo); } catch (err) { return { tipo: "danado", crudo: crudo }; }
    if (!tieneFormatoRespaldo(parseado)) return { tipo: "danado", crudo: crudo };
    const estado = limpiarEstado(parseado);
    return estado ? { tipo: "ok", estado: estado } : { tipo: "danado", crudo: crudo };
  }

  // Guarda el dato dañado sin pisar una copia anterior distinta. Devuelve la clave usada o null.
  function resguardarCopia(crudo) {
    try {
      const previa = localStorage.getItem(KEY_CORRUPTO);
      if (previa === crudo) return KEY_CORRUPTO;
      const destino = previa === null ? KEY_CORRUPTO : KEY_CORRUPTO + "_" + Date.now();
      localStorage.setItem(destino, crudo);
      return localStorage.getItem(destino) === crudo ? destino : null;
    } catch (err) { return null; }
  }

  

  function guardar() {
    if (guardadoBloqueado) return false;   // nunca se sobrescribe un dato ilegible sin copia a salvo
    return escribir(KEY, serializar());
  }

   let state;
  let hayCorrupto = false;
  const insp = inspeccionarAlmacen();
  if (insp.tipo === "danado") {
    hayCorrupto = true;
    crudoDaniado = insp.crudo;
    const claveGuardada = resguardarCopia(insp.crudo);
    if (claveGuardada) claveCopia = claveGuardada;
    else guardadoBloqueado = true;   // sin copia a salvo, no se escribe nada en KEY
    state = estadoVacio();
  } else if (insp.tipo === "ok") {
    state = insp.estado;
  } else {
    // No hay datos (o el almacenamiento no es accesible): migración desde las claves anteriores.
    // Las claves antiguas no se borran, así que no hay riesgo de pérdida.
    state = limpiarEstado({ hechas: leer(KEY_ANTIGUA_HECHAS), datos: leer(KEY_ANTIGUA_DATOS) }) || estadoVacio();
    if (insp.tipo === "vacio") guardar();
  }
  

  function estadoDe(id) {
    if (state.hechas[id]) return "publicada";
    const d = state.datos[id];
    return (d && d.estado) || "idea";
  }

  function pasosDe(id) {
    return (state.datos[id] && state.datos[id].pasos) || [];
  }

  const CAMPOS = ["fav", "estado", "fecha", "libro", "hashtags", "nota", "pasos", "texto", "formato", "sec", "secNombre", "orden", "propia", "borrada"];

  // Contenido de una idea tal como se guarda en la nube (y para comparar cambios).
  function registroDe(id, st) {
    st = st || state;
    const d = st.datos[id] || {};
    const r = { hecha: !!st.hechas[id] };
    CAMPOS.forEach(function (c) { if (d[c] !== undefined) r[c] = d[c]; });
    return r;
  }

  function tieneDatos(id) { return !!state.hechas[id] || !!state.datos[id]; }

  // Todos los ids con los que se puede trabajar: las 90 base y las propias (también las borradas).
  function todosLosIds(st) {
    const ids = baseIds.slice();
    Object.keys(st.datos).forEach(function (id) { if (!baseInfo[id]) ids.push(id); });
    return ids;
  }

  // ---- Secciones nuevas (creadas por la persona) ----
  // No hay una lista aparte: cada idea guarda el nombre de su sección (secNombre) y las secciones
  // nuevas salen de esos nombres. Van después de las 9 base, en orden de creación aproximado.
  function claveId(id) { return CUSTOM_RE.test(id) ? "1" + id : "0" + ("0000" + id).slice(-4); }

  function nombresExtra() {
    const vistos = Object.create(null);
    const nombres = [];
    Object.keys(state.datos).filter(function (id) {
      const d = state.datos[id];
      return d.secNombre && !d.borrada;
    }).sort(function (a, b) {
      const ka = claveId(a), kb = claveId(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    }).forEach(function (id) {
      const n = state.datos[id].secNombre;
      const k = normalizar(n);
      if (vistos[k]) return;
      vistos[k] = true;
      nombres.push(n);
    });
    return nombres;
  }

  function seccionDe(d, b) {
    const porDefecto = b ? b.sec : SECCIONES.length - 1;
    if (d.secNombre) {
      const k = normalizar(d.secNombre);
      const nombres = nombresExtra();
      for (let i = 0; i < nombres.length; i++) {
        if (normalizar(nombres[i]) === k) return SECCIONES.length + i;
      }
      return porDefecto;
    }
    return d.sec !== undefined ? d.sec : porDefecto;
  }

  // Datos actuales de una idea (texto, formato, sección y orden): lo base más lo que hayas cambiado.
  function infoIdea(id) {
    const b = baseInfo[id];
    const d = state.datos[id] || {};
    return {
      id: id,
      propia: !b,
      texto: d.texto || (b ? b.texto : ""),
      formato: d.formato || (b ? b.formato : "Post"),
      sec: seccionDe(d, b),
      orden: d.orden !== undefined ? d.orden : (b ? b.orden : 0)
    };
  }

  function idsActivos() {
    return todosLosIds(state).filter(function (id) { const d = state.datos[id]; return !(d && d.borrada); });
  }

  // Cambia un campo de una idea; esDefecto = true lo elimina (vuelve al valor original).
  function fijarCampo(id, campo, valor, esDefecto) {
    const d = state.datos[id] || {};
    if (esDefecto) { delete d[campo]; } else { d[campo] = valor; }
    if (Object.keys(d).length) { state.datos[id] = d; } else { delete state.datos[id]; }
  }

  // ---- Metadatos de respaldo: { ultimoRespaldo, ultimoCambio } ----
  function leerMeta() {
    const m = leer(KEY_META);
    const r = { ultimoRespaldo: null, ultimoCambio: null };
    if (m && typeof m === "object") {
      if (esFechaISO(m.ultimoRespaldo)) r.ultimoRespaldo = m.ultimoRespaldo;
      if (esFechaISO(m.ultimoCambio)) r.ultimoCambio = m.ultimoCambio;
    }
    return r;
  }
  let meta = leerMeta();
  const hayAlmacenamiento = almacenamientoDisponible();

  // ---- Marcas de modificación (mod) ----
  // maxVisto: la mayor marca conocida (local o recibida de la nube); alimenta el reloj híbrido.
  let maxVisto = 0;
  function verMarca(n) { if (marcaValida(n) && n > maxVisto) maxVisto = n; }

  // Ideas con datos pero sin marca (anteriores a la sincronización o migradas de claves antiguas):
  // en vez de dejarlas en 0 (perderían siempre), reciben la fecha del último cambio local conocido.
  // Si no hay ninguna fecha guardada, reciben 1: siguen perdiendo frente a una copia remota real,
  // pero si no existe copia en la nube se suben igualmente (ver subirFaltantes).
  function prepararMarcas() {
    let base = 0;
    if (meta.ultimoCambio) base = Date.parse(meta.ultimoCambio) || 0;
    if (!base && meta.ultimoRespaldo) base = Date.parse(meta.ultimoRespaldo) || 0;
    if (!base) base = 1;
    let cambio = false;
    todosLosIds(state).forEach(function (id) {
      if (tieneDatos(id) && !marcaValida(state.mod[id])) { state.mod[id] = base; cambio = true; }
    });
    if (state.sets.length && !marcaValida(state.modSets)) { state.modSets = base; cambio = true; }
    Object.keys(state.mod).forEach(function (id) { verMarca(state.mod[id]); });
    verMarca(state.modSets);
    if (cambio) guardar();
  }
  prepararMarcas();

  // ---- Referencias a elementos ----
  const lista = document.getElementById("lista");
  const elMensaje = document.getElementById("mensaje");
  const elRecordatorio = document.getElementById("recordatorio");
  const elSync = document.getElementById("sync-estado");
  const btnSync = document.getElementById("sync-ahora");
  const elContador = document.getElementById("contador");
  const elProgreso = document.getElementById("progreso");
  const elBarra = document.getElementById("barra");
  const btnFiltros = document.getElementById("btn-filtros");
  const elPanelFiltros = document.getElementById("panel-filtros");
  const elFavoritas = document.getElementById("favoritas");
  const elPorEstado = document.getElementById("por-estado");
  const elBuscar = document.getElementById("buscar");
  const elEstado = document.getElementById("f-estado");
  const elFormato = document.getElementById("f-formato");
  const elFecha = document.getElementById("f-fecha");
  const elProd = document.getElementById("f-prod");
  const elSoloFav = document.getElementById("f-fav");
  const elOrden = document.getElementById("f-orden");
  const elResultados = document.getElementById("resultados");
  const elSorpresa = document.getElementById("sorpresa");
  const btnDeshacer = document.getElementById("deshacer");
  const elDialogo = document.getElementById("dialogo");
  const elDialogoTexto = document.getElementById("dialogo-texto");
  const elListaSets = document.getElementById("lista-sets");
  const elSetNombre = document.getElementById("set-nombre");
  const elSetTags = document.getElementById("set-tags");
  const btnSetGuardar = document.getElementById("set-guardar");
  const btnSetCancelar = document.getElementById("set-cancelar");
  const elSetMensaje = document.getElementById("set-mensaje");

  let avisoTimer = null;
  function aviso(txt) {
    elMensaje.textContent = txt;
    clearTimeout(avisoTimer);
    if (txt) avisoTimer = setTimeout(function () { elMensaje.textContent = ""; }, 8000);
  }
  function avisoSet(txt) { elSetMensaje.textContent = txt; }

  // Confirmación propia (un <dialog>): window.confirm no funciona dentro de páginas incrustadas.
  function confirmar(texto) {
    return new Promise(function (resolve) {
      if (!elDialogo || typeof elDialogo.showModal !== "function") {
        resolve(window.confirm(texto));
        return;
      }
      try {
        elDialogoTexto.textContent = texto;
        elDialogo.returnValue = "";
        elDialogo.addEventListener("close", function () { resolve(elDialogo.returnValue === "ok"); }, { once: true });
        elDialogo.showModal();
      } catch (err) {
        resolve(window.confirm(texto));
      }
    });
  }
  document.getElementById("dialogo-si").addEventListener("click", function () { elDialogo.close("ok"); });
  document.getElementById("dialogo-no").addEventListener("click", function () { elDialogo.close("cancel"); });

  // ---- Guardado local y marcas de cambio (para sincronizar) ----
  // Reloj híbrido (estilo Lamport): la marca nueva siempre supera a la mayor marca vista en cualquier
  // dispositivo (maxVisto), aunque el reloj de este dispositivo vaya atrasado. Así una edición hecha
  // después de ver los datos remotos nunca pierde frente a ellos por culpa de un desfase de reloj.
  function siguienteMod(previo) {
    const m = Math.max(Date.now(), (previo || 0) + 1, maxVisto + 1);
    maxVisto = m;
    return m;
  }

  // Guarda el estado y marca que hay cambios desde el último respaldo.
  let persistTimer = null, persistPendiente = false;
  function persistir() {
    persistPendiente = true;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(vaciarPersistencia, 400);
    return true;
  }

  // Escribe en el navegador lo pendiente (se agrupan los cambios de varias teclas).
  function vaciarPersistencia() {
    if (!persistPendiente) return true;
    persistPendiente = false;
    clearTimeout(persistTimer);
    const ok = guardar();
    meta.ultimoCambio = new Date().toISOString();
    escribir(KEY_META, meta);
    if (!ok) aviso("⚠ No se pudo guardar en el navegador. Exporta tu progreso para no perderlo.");
    actualizarRecordatorio();
    return ok;
  }
  window.addEventListener("pagehide", vaciarPersistencia);
  document.addEventListener("visibilitychange", function () { if (document.hidden) vaciarPersistencia(); });

  function persistirIdea(id) {
    state.mod[id] = siguienteMod(state.mod[id]);
    const ok = persistir();
    marcarIdea(id);
    return ok;
  }

  function persistirSets() {
    state.modSets = siguienteMod(state.modSets);
    const ok = persistir();
    marcarSets();
    return ok;
  }

  // Reemplaza todo el estado (reinicio, importación, deshacer) y marca solo lo que cambió.
  function firmaIdea(st, id) { return JSON.stringify(registroDe(id, st)); }

  function aplicarEstadoCompleto(nuevo) {
    const viejo = state;
    const cambiadas = [];
    nuevo.mod = Object.assign({}, viejo.mod);
    nuevo.modSets = viejo.modSets;
    const vistos = Object.create(null);
    todosLosIds(viejo).concat(todosLosIds(nuevo)).forEach(function (id) {
      if (vistos[id]) return;
      vistos[id] = true;
      if (firmaIdea(viejo, id) !== firmaIdea(nuevo, id)) {
        nuevo.mod[id] = siguienteMod(viejo.mod[id]);
        cambiadas.push(id);
      }
    });
    const setsCambian = JSON.stringify(viejo.sets) !== JSON.stringify(nuevo.sets);
    if (setsCambian) nuevo.modSets = siguienteMod(viejo.modSets);
    state = nuevo;
    persistir();
    cambiadas.forEach(marcarIdea);
    if (setsCambian) marcarSets();
  }

  // ---- Texto de cada idea: separa la marca de origen (★ o ◆) y el formato final [Post] ----
  const ORIGENES = { "★": "★ Plantilla clásica", "◆": "◆ Tendencia" };

  function partirTexto(txt) {
    let origen = "";
    const m = txt.match(/^([★◆])\s*/);
    if (m) { origen = m[1]; txt = txt.slice(m[0].length); }
    txt = txt.replace(/\s*\[(?:Post|Carrusel|Reel)\]\s*$/, "");
    return { origen: origen, texto: txt };
  }

  // ---- Construcción de la lista ----
  const refs = {};
  let secRefs = [];

  // Vista alternativa: todas las ideas en una sola lista (por fecha o por prioridad)
  const vistaFecha = el("section");
  vistaFecha.hidden = true;
  const tituloVista = el("h2");
  vistaFecha.appendChild(tituloVista);
  const pVista = el("p");
  const btnReordenar = el("button", { type: "button", text: "Reordenar ahora" });
  pVista.appendChild(btnReordenar);
  pVista.appendChild(document.createTextNode(" El orden se actualiza al cambiar filtros o al pulsar este botón."));
  vistaFecha.appendChild(pVista);
  const ulFecha = el("ul", { "class": "ideas" });
  vistaFecha.appendChild(ulFecha);
  lista.appendChild(vistaFecha);

  function crearSeccion(titulo, secIndex) {
    const section = el("details", { "data-sec": String(secIndex) });
    const sumSec = el("summary");
    const h2 = el("h2", { text: titulo });
    sumSec.appendChild(h2);
    const cnt = el("span", { "class": "cuenta", title: "Ideas hechas en esta sección" });
    sumSec.appendChild(cnt);
    section.appendChild(sumSec);
    const ul = el("ul", { "class": "ideas" });
    section.appendChild(ul);
    return { section: section, ul: ul, contador: cnt, h2: h2, titulo: titulo, clave: "" };
  }

  SECCIONES.forEach(function (sec, secIndex) {
    const s = crearSeccion(tituloSeccion(sec.titulo), secIndex);
    lista.appendChild(s.section);
    secRefs.push(s);
  });

  const seccionesBase = secRefs.slice();
  let extraRefs = [];
  let firmaExtra = null;

  // Crea, renombra o quita las secciones nuevas y las deja SIEMPRE al final de la lista.
  // secRefs queda con las base primero y las nuevas después (el índice coincide con idea.sec).
  function sincronizarSeccionesExtra() {
    const nombres = nombresExtra();
    const previas = Object.create(null);
    extraRefs.forEach(function (s) { previas[s.clave] = s; });
    const nuevas = nombres.map(function (n, k) {
      const clave = normalizar(n);
      let s = previas[clave];
      if (s) { delete previas[clave]; }
      else { s = crearSeccion(n, seccionesBase.length + k); s.clave = clave; }
      s.titulo = n;
      s.h2.textContent = n;
      s.section.setAttribute("data-sec", String(seccionesBase.length + k));
      return s;
    });
    Object.keys(previas).forEach(function (c) { previas[c].section.remove(); });
    let anterior = seccionesBase[seccionesBase.length - 1].section;
    nuevas.forEach(function (s) {
      if (s.section.parentNode !== lista || anterior.nextElementSibling !== s.section) {
        lista.insertBefore(s.section, anterior.nextSibling);
      }
      anterior = s.section;
    });
    extraRefs = nuevas;
    secRefs = seccionesBase.concat(extraRefs);
    const firma = nombres.join("\u0001");
    if (firma !== firmaExtra) {
      firmaExtra = firma;
      // El menú «En esta página» se reconstruye al enterarse
      try { document.dispatchEvent(new CustomEvent("secciones-cambiadas")); } catch (err) { /* sin acción */ }
    }
  }

  // Crea la fila (<li>) de una idea; se coloca en su sitio en reordenar().
  function crearFila(idea) {
    const id = idea.id;
    const li = el("li", { "class": "idea" });

    const cabecera = el("div", { "class": "cabecera" });
    const hecha = el("input", { type: "checkbox", id: "idea-" + id, "data-id": id });
    cabecera.appendChild(hecha);
    const labTexto = el("div", { "class": "texto" });
    const num = el("span", { "class": "num" });
    labTexto.appendChild(num);
    const textoNodo = document.createTextNode("");
    labTexto.appendChild(textoNodo);
    cabecera.appendChild(labTexto);
    const labFav = el("label", { "class": "fav", title: "Favorita" });
    const fav = el("input", { type: "checkbox", "data-fav": id });
    labFav.appendChild(fav);
    labFav.appendChild(el("span", { "class": "solo-lector", text: "Favorita" }));
    cabecera.appendChild(labFav);
    li.appendChild(cabecera);

    const metaFila = el("div", { "class": "meta" });
    li.appendChild(metaFila);

    const campos = el("div", { "class": "campos" });

    const labEstado = el("label", { "class": "campo" });
    labEstado.appendChild(el("span", { text: "Estado" }));
    const estado = el("select", { "data-estado": id });
    ESTADOS.forEach(function (o) { estado.appendChild(el("option", { value: o[0], text: o[1] })); });
    labEstado.appendChild(estado);
    campos.appendChild(labEstado);

    const labFecha = el("label", { "class": "campo" });
    labFecha.appendChild(el("span", { text: "Fecha de publicación" }));
    const fecha = el("input", { type: "date", "data-fecha": id, min: FECHA_MIN, max: FECHA_MAX });
    labFecha.appendChild(fecha);
    campos.appendChild(labFecha);
    li.appendChild(campos);

    // Checklist de producción
    const prod = el("details", { "class": "prod" });
    const sumProd = el("summary");
    sumProd.appendChild(el("span", { text: "Producción" }));
    const prog = el("progress", { "class": "mini", max: String(PASOS.length), value: "0", "aria-hidden": "true" });
    sumProd.appendChild(prog);
    const cuentaPaso = el("span", { "class": "prod-cuenta", text: "0/" + PASOS.length });
    sumProd.appendChild(cuentaPaso);
    prod.appendChild(sumProd);
    const pasosDiv = el("div", { "class": "pasos" });
    const inputsPasos = {};
    PASOS.forEach(function (p) {
      const lab = el("label", { "class": "paso" });
      const cb = el("input", { type: "checkbox", "data-paso": p[0], "data-pid": id });
      inputsPasos[p[0]] = cb;
      lab.appendChild(cb);
      lab.appendChild(el("span", { text: p[1] }));
      pasosDiv.appendChild(lab);
    });
    prod.appendChild(pasosDiv);
    li.appendChild(prod);

    const det = el("details", { "class": "extra" });
    const resumen = el("summary", { text: TITULO_DETALLE });
    det.appendChild(resumen);
    const cuerpo = el("div", { "class": "extra-cuerpo" });

    const labLibro = el("label", { "class": "campo" });
    labLibro.appendChild(el("span", { text: "Libro" }));
    const libro = el("input", { type: "text", "data-libro": id, maxlength: String(MAX_LIBRO), placeholder: "Título y autor del libro" });
    labLibro.appendChild(libro);
    cuerpo.appendChild(labLibro);
    const avisoLibro = el("p", { "class": "aviso-libro" });
    cuerpo.appendChild(avisoLibro);

    const labHash = el("label", { "class": "campo" });
    labHash.appendChild(el("span", { text: "Hashtags" }));
    const hashtags = el("input", { type: "text", "data-hashtags": id, maxlength: String(MAX_HASHTAGS), placeholder: "#booktok #romantasy #bookstagram" });
    labHash.appendChild(hashtags);
    cuerpo.appendChild(labHash);

    const bloqueSets = el("div", { "class": "campo" });
    bloqueSets.hidden = true;
    bloqueSets.appendChild(el("span", { text: "Añadir un conjunto de hashtags" }));
    const chips = el("div", { "class": "chips-sets" });
    bloqueSets.appendChild(chips);
    cuerpo.appendChild(bloqueSets);

    const labNota = el("label", { "class": "campo" });
    labNota.appendChild(el("span", { text: "Notas" }));
    const nota = el("textarea", { "data-nota": id, rows: "3", placeholder: "Escribe aquí tu caption, guion o notas…" });
    labNota.appendChild(nota);
    cuerpo.appendChild(labNota);

    det.appendChild(cuerpo);
    li.appendChild(det);

    // Acciones: copiar, editar y borrar
    const acciones = el("div", { "class": "acciones" });
    acciones.appendChild(el("button", { type: "button", "class": "btn-chico", "data-accion": "copiar", "data-idea": id, text: "Copiar" }));
    acciones.appendChild(el("button", { type: "button", "class": "btn-chico", "data-accion": "editar", "data-idea": id, text: "Editar idea" }));
    acciones.appendChild(el("button", { type: "button", "class": "btn-chico btn-borrar", "data-accion": "borrar", "data-idea": id, text: "Borrar idea" }));
    li.appendChild(acciones);

    // Ordenar a mano (solo se ve en el orden «Mi prioridad»)
    const mover = el("div", { "class": "mover" });
    mover.hidden = true;
    [["inicio", "⤒ Al inicio"], ["arriba", "↑ Subir"], ["abajo", "↓ Bajar"], ["fin", "⤓ Al final"]].forEach(function (m) {
      mover.appendChild(el("button", { type: "button", "class": "btn-chico", "data-mover": m[0], "data-idea": id, text: m[1] }));
    });
    li.appendChild(mover);

    refs[id] = {
      idea: idea, li: li, hecha: hecha, fav: fav, estado: estado, fecha: fecha,
      libro: libro, aviso: avisoLibro, hashtags: hashtags, nota: nota, det: det, resumen: resumen,
      prod: prod, prog: prog, cuentaPaso: cuentaPaso, pasos: inputsPasos, bloqueSets: bloqueSets, chips: chips,
      num: num, textoNodo: textoNodo, meta: metaFila, mover: mover
    };
    return refs[id];
  }

  // Texto, número y etiquetas de una idea (cambian al editarla).
  function pintarIdea(id) {
    const r = refs[id];
    const idea = r.idea;
    const partes = partirTexto(idea.texto);
    r.num.textContent = idea.propia ? "" : id + ".";
    r.num.hidden = idea.propia;
    r.textoNodo.textContent = " " + partes.texto;
    r.hecha.setAttribute("aria-label", "Marcar como publicada: " + partes.texto);
    r.li.setAttribute("data-formato", idea.formato);
    r.meta.textContent = "";
    r.meta.appendChild(el("span", { "class": "chip formato-" + normalizar(idea.formato), text: idea.formato }));
    if (partes.origen) r.meta.appendChild(el("span", { "class": "chip origen", text: ORIGENES[partes.origen] }));
    if (idea.propia) r.meta.appendChild(el("span", { "class": "chip propia", text: "Mía" }));
  }

  // Deja la lista de filas igual que el estado: crea las que faltan, quita las borradas y actualiza textos.
  function sincronizarEstructura() {
    sincronizarSeccionesExtra();
    const activos = idsActivos();
    const set = Object.create(null);
    activos.forEach(function (id) { set[id] = true; });
    Object.keys(refs).forEach(function (id) {
      if (!set[id]) { refs[id].li.remove(); delete refs[id]; }
    });
    const nuevas = [];
    todas = [];
    activos.forEach(function (id) {
      const info = infoIdea(id);
      let r = refs[id];
      if (!r) { r = crearFila(info); nuevas.push(id); } else { r.idea = info; }
      todas.push(r.idea);
    });
    todas.forEach(function (i) { pintarIdea(i.id); });
    nuevas.forEach(function (id) { sincronizarIdea(id, null); });
    renderChipsSets();
    reordenar();
  }

  function nombreCorto(id) {
    if (baseInfo[id]) return id;
    const r = refs[id];
    const t = r ? partirTexto(r.idea.texto).texto : "";
    return "«" + (t.length > 24 ? t.slice(0, 24) + "…" : t) + "»";
  }

  // Color de la cinta lateral y atenuado según el estado de la idea.
  function marcarFila(id) {
    const r = refs[id];
    const est = estadoDe(id);
    r.li.setAttribute("data-est", est);
    r.li.classList.toggle("hecha", est === "publicada");
  }

  function actualizarPasos(id) {
    const r = refs[id];
    const hechos = pasosDe(id);
    PASOS.forEach(function (p) { r.pasos[p[0]].checked = hechos.indexOf(p[0]) !== -1; });
    r.prog.value = hechos.length;
    r.cuentaPaso.textContent = hechos.length + "/" + PASOS.length;
  }

  // ---- Sincronizar controles con el estado ----
  function sincronizarIdea(id, activo) {
    const r = refs[id];
    const d = state.datos[id] || {};
    r.hecha.checked = !!state.hechas[id];
    marcarFila(id);
    if (activo !== r.fav) r.fav.checked = !!d.fav;
    if (activo !== r.estado) r.estado.value = estadoDe(id);
    if (activo !== r.fecha) r.fecha.value = d.fecha || "";
    if (activo !== r.libro) r.libro.value = d.libro || "";
    if (activo !== r.hashtags) r.hashtags.value = d.hashtags || "";
    if (activo !== r.nota) r.nota.value = d.nota || "";
    actualizarPasos(id);
  }

  function sincronizar() {
    const activo = document.activeElement;
    todas.forEach(function (idea) { sincronizarIdea(idea.id, activo); });
  }

  // ---- Contadores ----
  const elTotal = document.getElementById("total");
  const elTotalIdeas = document.getElementById("total-ideas");

  let hPrevio = null;   // para animar la barra solo cuando sube el número de publicadas

  function contar() {
    let h = 0, f = 0, descartadas = 0;
    const porEstado = {};
    const porSec = secRefs.map(function () { return { hechas: 0, total: 0 }; });
    ESTADOS.forEach(function (o) { porEstado[o[0]] = 0; });
    todas.forEach(function (i) {
      const est = estadoDe(i.id);
      if (est === "publicada") h++;
      if (est === "descartada") descartadas++;
      if (state.datos[i.id] && state.datos[i.id].fav) f++;
      porEstado[est]++;
      if (est !== "descartada") {
        porSec[i.sec].total++;
        if (est === "publicada") porSec[i.sec].hechas++;
      }
    });
    const validas = todas.length - descartadas;
    elContador.textContent = h;
    elTotal.textContent = validas;
    elTotalIdeas.textContent = "Total: " + todas.length + " ideas" + (descartadas ? " (" + descartadas + " descartadas)" : "");
    elProgreso.max = Math.max(validas, 1);
    elProgreso.value = h;
    elProgreso.toggleAttribute("data-completo", validas > 0 && h >= validas);
    if (hPrevio !== null && h > hPrevio && movimientoOk()) {
      elProgreso.classList.remove("sube");
      void elProgreso.offsetWidth;
      elProgreso.classList.add("sube");
    }
    hPrevio = h;
    elFavoritas.textContent = f;
    elPorEstado.textContent = "Por estado: " + ESTADOS.map(function (o) {
      return o[1] + " " + porEstado[o[0]];
    }).join(" | ");
    secRefs.forEach(function (s, k) {
      s.contador.textContent = porSec[k].hechas + " / " + porSec[k].total;
    });
  }

  // ---- Aviso de libros repetidos ----
  function actualizarAvisosLibro() {
    const mapa = Object.create(null);
    todas.forEach(function (i) {
      const l = (state.datos[i.id] || {}).libro;
      if (l) {
        const k = normalizar(l);
        if (!mapa[k]) mapa[k] = [];
        mapa[k].push(i.id);
      }
    });
    todas.forEach(function (i) {
      const l = (state.datos[i.id] || {}).libro;
      const otros = l ? mapa[normalizar(l)].filter(function (x) { return x !== i.id; }) : [];
      refs[i.id].aviso.textContent = otros.length
        ? " ⚠ También usado en " + (otros.length > 1 ? "las ideas " : "la idea ") + otros.map(nombreCorto).join(", ")
        : "";
      actualizarResumen(i.id);
    });
  }

  // El resumen del bloque plegable indica si hay contenido o un libro repetido.
  function actualizarResumen(id) {
    const r = refs[id];
    const d = state.datos[id] || {};
    let txt = TITULO_DETALLE;
    if (d.libro || d.hashtags || d.nota) txt += " (con contenido)";
    if (r.aviso.textContent) txt += " ⚠ libro repetido";
    r.resumen.textContent = txt;
  }

  // ---- Recordatorio de respaldo ----
  let ultimoRecordatorio = null;
  function actualizarRecordatorio() {
    let txt = "";
    const tieneAlgo = Object.keys(state.hechas).length > 0 || Object.keys(state.datos).length > 0 || state.sets.length > 0;
    if (!hayAlmacenamiento) {
      txt = "⚠ Tu navegador no permite guardar datos en esta página: lo que marques o escribas se perderá al cerrarla. Usa «Exportar progreso» para conservarlo.";
    } else if (tieneAlgo) {
      const resp = meta.ultimoRespaldo ? Date.parse(meta.ultimoRespaldo) : null;
      const cambio = meta.ultimoCambio ? Date.parse(meta.ultimoCambio) : null;
      const sinRespaldar = resp === null || (cambio !== null && cambio > resp);
      if (resp === null) {
        txt = "⚠ Tu progreso solo vive en este navegador: si cambias de móvil o borras los datos del navegador, se pierde. Descarga un respaldo y guárdalo en tu nube o correo.";
      } else {
        const dias = Math.floor((Date.now() - resp) / 86400000);
        if (sinRespaldar && dias >= DIAS_RESPALDO) {
          txt = "⚠ Respaldo mensual: han pasado " + dias + " días desde tu último respaldo y tienes cambios sin exportar. Si cambias de móvil o borras datos, los perderías.";
        } else {
          txt = "Último respaldo: " + new Date(resp).toLocaleDateString("es") + (sinRespaldar ? " (hay cambios posteriores)." : " (al día).");
        }
      }
    }
      if (hayCorrupto) {
      txt = guardadoBloqueado
        ? "⚠ No se pudieron leer tus datos guardados (estaban dañados) y no hubo espacio para guardar una copia. No se guardará nada nuevo hasta que descargues la copia dañada o liberes espacio."
        : "⚠ No se pudieron leer tus datos guardados (estaban dañados). Guardé una copia aparte para que no se pierda; puedes descargarla y, si quieres, pasármela para recuperarla.";
    }
    if (txt === ultimoRecordatorio) return;
    ultimoRecordatorio = txt;
    elRecordatorio.textContent = txt;
    const alerta = txt.indexOf("⚠") === 0;
    elRecordatorio.classList.toggle("alerta", alerta);
    if (alerta && !hayCorrupto) {
      // Botón directo en el aviso: un toque descarga el respaldo (JSON).
      const bExp = el("button", { type: "button", "class": "primario", text: "Descargar respaldo ahora" });
      bExp.addEventListener("click", function () { document.getElementById("exportar").click(); });
      elRecordatorio.appendChild(bExp);
    }
    if (hayCorrupto) {
      const bCor = el("button", { type: "button", text: "Descargar copia dañada" });
      bCor.addEventListener("click", function () {
        let crudo = crudoDaniado;
        if (!crudo) { try { crudo = localStorage.getItem(claveCopia) || ""; } catch (err) { crudo = ""; } }
        descargar("ideas_post_90_dañado.json", crudo, "application/json");
      });
      elRecordatorio.appendChild(bCor);
    }
  }

  // ---- Deshacer (reinicio o importación) ----
function crearSnapshot(accion) {
  const s = serializar();
  s.accion = accion;
  s.fecha = new Date().toISOString();
  const ok = escribir(KEY_DESHACER, s);
  if (!ok) borrar(KEY_DESHACER);   // no dejar una copia vieja que engañe
  actualizarDeshacer();
  return ok;
}

function prepararDeshacer(accion) {
  if (crearSnapshot(accion)) return Promise.resolve(true);
  return confirmar("No hay espacio en el navegador para guardar una copia, así que no podrás deshacer esta acción. Si quieres conservar tu progreso actual, cancela y expórtalo primero. ¿Continuar de todos modos?");
}

  function leerSnapshot() {
    const s = leer(KEY_DESHACER);
    const est = limpiarEstado(s);
    if (!est) return null;
    return {
      accion: s.accion === "importación" ? "importación" : "reinicio",
      fecha: esFechaISO(s.fecha) ? s.fecha : null,
      estado: est
    };
  }

  function actualizarDeshacer() {
    const snap = leerSnapshot();
    btnDeshacer.hidden = !snap;
    if (snap) {
      btnDeshacer.textContent = "Deshacer " + snap.accion + (snap.fecha ? " (" + new Date(snap.fecha).toLocaleString("es") + ")" : "");
    }
  }

  // ---- Conjuntos de hashtags ----
  let editandoSet = null;

  function indiceSet(nombre) {
    const k = normalizar(nombre);
    for (let i = 0; i < state.sets.length; i++) {
      if (normalizar(state.sets[i].nombre) === k) return i;
    }
    return -1;
  }

  function renderChipsSets() {
    todas.forEach(function (i) {
      const r = refs[i.id];
      r.chips.textContent = "";
      state.sets.forEach(function (s, k) {
        r.chips.appendChild(el("button", {
          type: "button", "class": "chip-set", "data-set": String(k), "data-idea": i.id, title: s.tags, text: s.nombre
        }));
      });
      r.bloqueSets.hidden = state.sets.length === 0;
    });
  }

  function renderSets() {
    elListaSets.textContent = "";
    if (!state.sets.length) {
      elListaSets.appendChild(el("li", { "class": "vacio", text: "Todavía no tienes conjuntos. Crea el primero aquí abajo." }));
    }
    state.sets.forEach(function (s, k) {
      const li = el("li");
      li.appendChild(el("strong", { text: s.nombre }));
      li.appendChild(el("span", { "class": "set-tags", text: s.tags }));
      const b = el("div", { "class": "botones" });
      b.appendChild(el("button", { type: "button", "data-set-editar": String(k), "aria-label": "Editar el conjunto " + s.nombre, text: "Editar" }));
      b.appendChild(el("button", { type: "button", "data-set-borrar": String(k), "aria-label": "Borrar el conjunto " + s.nombre, text: "Borrar" }));
      li.appendChild(b);
      elListaSets.appendChild(li);
    });
    renderChipsSets();
  }

  function cancelarEdicionSet() {
    editandoSet = null;
    elSetNombre.value = "";
    elSetTags.value = "";
    btnSetGuardar.textContent = "Guardar conjunto";
    btnSetCancelar.hidden = true;
  }

  elListaSets.addEventListener("click", function (e) {
    const t = e.target.closest ? e.target.closest("button") : null;
    if (!t) return;
    const ke = t.getAttribute("data-set-editar");
    const kb = t.getAttribute("data-set-borrar");
    if (ke !== null) {
      const s = state.sets[Number(ke)];
      if (!s) return;
      editandoSet = Number(ke);
      elSetNombre.value = s.nombre;
      elSetTags.value = s.tags;
      btnSetGuardar.textContent = "Actualizar conjunto";
      btnSetCancelar.hidden = false;
      avisoSet("");
      elSetNombre.focus();
    } else if (kb !== null) {
      const s2 = state.sets[Number(kb)];
      if (!s2) return;
      const nombre = s2.nombre;
      confirmar("¿Borrar el conjunto «" + nombre + "»? Los hashtags que ya aplicaste a tus ideas no cambian.").then(function (ok) {
        if (!ok) return;
        const k = indiceSet(nombre);
        if (k === -1) return;
        state.sets.splice(k, 1);
        cancelarEdicionSet();
        persistirSets();
        renderSets();
        avisoSet("Conjunto «" + nombre + "» borrado.");
      });
    }
  });

  btnSetGuardar.addEventListener("click", function () {
    const nombre = elSetNombre.value.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE_SET);
    const todosTags = partirTags(elSetTags.value);
    const tags = tagsATexto(todosTags, MAX_HASHTAGS);
    const recortados = todosTags.length - partirTags(tags).length;
    if (!nombre) { avisoSet("Escribe un nombre para el conjunto."); elSetNombre.focus(); return; }
    if (!tags) { avisoSet("Escribe al menos un hashtag."); elSetTags.focus(); return; }
    const existente = indiceSet(nombre);
    const nuevo = { nombre: nombre, tags: tags };
    if (editandoSet !== null && state.sets[editandoSet]) {
      if (existente !== -1 && existente !== editandoSet) { avisoSet("Ya tienes un conjunto con ese nombre."); return; }
      state.sets[editandoSet] = nuevo;
    } else if (existente !== -1) {
      state.sets[existente] = nuevo;
    } else {
      if (state.sets.length >= MAX_SETS) { avisoSet("Puedes guardar hasta " + MAX_SETS + " conjuntos. Borra alguno para crear otro."); return; }
      state.sets.push(nuevo);
    }
    cancelarEdicionSet();
    persistirSets();
    renderSets();
    avisoSet("Conjunto «" + nombre + "» guardado." + (recortados
      ? " Ojo: se omitieron los últimos " + recortados + " hashtags por el límite de " + MAX_HASHTAGS + " caracteres."
      : ""));
  });

  btnSetCancelar.addEventListener("click", function () {
    cancelarEdicionSet();
    avisoSet("");
  });

function aplicarSet(id, k, boton) {
  const s = state.sets[k];
  if (!s) return;
  const actual = (state.datos[id] || {}).hashtags || "";
  const deseados = partirTags(actual + " " + s.tags);
  const nuevo = tagsATexto(deseados, MAX_HASHTAGS);
  const perdidos = deseados.length - partirTags(nuevo).length;
  if (perdidos > 0) {
    const msg = "Límite de " + MAX_HASHTAGS + " caracteres: no se añadieron " + perdidos + " hashtag" + (perdidos === 1 ? "" : "s") + ".";
    anunciar(msg);
    if (boton) parpadeo(boton, "Sin espacio");
  }
  if (nuevo === actual) return;
  refs[id].hashtags.value = nuevo;
  setDato(id, "hashtags", nuevo);
  actualizarResumen(id);
}
  // ---- Filtros y orden ----
  function cmpOrden(a, b) {
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }

  // Coloca las filas: por secciones (orden original), por fecha o por prioridad (lista única).
  function reordenar() {
    const modo = elOrden.value;
    if (modo === "fecha" || modo === "prioridad") {
      const orden = todas.slice().sort(function (a, b) {
        if (modo === "fecha") {
          const fa = (state.datos[a.id] || {}).fecha || "";
          const fb = (state.datos[b.id] || {}).fecha || "";
          if (fa && fb && fa !== fb) return fa < fb ? -1 : 1;
          if (fa && !fb) return -1;
          if (!fa && fb) return 1;
        }
        return cmpOrden(a, b);
      });
      orden.forEach(function (i) { ulFecha.appendChild(refs[i.id].li); });
    } else {
      secRefs.forEach(function (s, k) {
        todas.filter(function (i) { return i.sec === k; }).sort(cmpOrden).forEach(function (i) {
          s.ul.appendChild(refs[i.id].li);
        });
      });
    }
    tituloVista.textContent = modo === "prioridad"
      ? "Mi prioridad: ordena con los botones (arriba = lo más importante)"
      : "Ideas ordenadas por fecha (las que no tienen fecha van al final)";
    pVista.hidden = modo !== "fecha";
    lista.classList.toggle("modo-prioridad", modo === "prioridad");
    todas.forEach(function (i) { refs[i.id].mover.hidden = modo !== "prioridad"; });
  }

  let modoPrevio = "original";
  function aplicarFiltros() {
    if (elOrden.value !== "original" || elOrden.value !== modoPrevio) {
      modoPrevio = elOrden.value;
      reordenar();
    }
    const modoFecha = elOrden.value === "fecha" || elOrden.value === "prioridad";
    const q = normalizar(elBuscar.value);
    const estadoF = elEstado.value;
    const formato = elFormato.value;
    const fechaF = elFecha.value;
    const prodF = elProd.value;
    const soloFav = elSoloFav.checked;
    // Con búsqueda o filtros activos se abren las secciones que tengan resultados.
    const hayFiltro = !!q || estadoF !== "todas" || formato !== "todos" || fechaF !== "todas" || prodF !== "todas" || soloFav;

    let base = new Date();
    base = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const hoy = isoLocal(base);
    const lun = new Date(base);
    lun.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    const dom = new Date(lun);
    dom.setDate(lun.getDate() + 6);
    const lunes = isoLocal(lun), domingo = isoLocal(dom);

    let visibles = 0;
    secRefs.forEach(function (s, k) {
      let vis = 0;
      todas.forEach(function (idea) {
        if (idea.sec !== k) return;
        const id = idea.id;
        const r = refs[id];
        const d = state.datos[id] || {};
        const est = estadoDe(id);
        const f = d.fecha || "";
        const np = pasosDe(id).length;
        let ok = true;
        if (estadoF === "pendientes" && (est === "publicada" || est === "descartada")) ok = false;
        else if (estadoF === "hechas" && est !== "publicada") ok = false;
        else if (INTERMEDIOS.concat("idea").indexOf(estadoF) !== -1 && est !== estadoF) ok = false;
        if (formato !== "todos" && r.idea.formato !== formato) ok = false;
        if (fechaF === "con" && !f) ok = false;
        if (fechaF === "sin" && f) ok = false;
        if (fechaF === "semana" && !(f && f >= lunes && f <= domingo)) ok = false;
        if (fechaF === "vencidas" && !(f && f < hoy && est !== "publicada" && est !== "descartada")) ok = false;
        if (prodF === "sin" && np !== 0) ok = false;
        if (prodF === "curso" && !(np > 0 && np < PASOS.length)) ok = false;
        if (prodF === "completa" && np !== PASOS.length) ok = false;
        if (soloFav && !d.fav) ok = false;
        if (q) {
          const enTexto = normalizar(r.idea.texto).indexOf(q) !== -1;
          const enDetalle = normalizar((d.libro || "") + " " + (d.hashtags || "") + " " + (d.nota || "")).indexOf(q) !== -1;
          if (!enTexto && !enDetalle) ok = false;
          else if (!enTexto && enDetalle) r.det.open = true;
        }
        r.li.hidden = !ok;
        if (ok) vis++;
      });
      if (hayFiltro && vis > 0) s.section.open = true;
      s.section.hidden = modoFecha || vis === 0;
      visibles += vis;
    });
    vistaFecha.hidden = !modoFecha || visibles === 0;
    elResultados.textContent = "Mostrando " + visibles + " de " + todas.length + " ideas.";
    const activos = (estadoF !== "todas" ? 1 : 0) + (formato !== "todos" ? 1 : 0) + (fechaF !== "todas" ? 1 : 0) +
      (prodF !== "todas" ? 1 : 0) + (soloFav ? 1 : 0) + (elOrden.value !== "original" ? 1 : 0);
    btnFiltros.textContent = "Filtros" + (activos ? " (" + activos + ")" : "");
  }

  let buscarTimer = null;
  elBuscar.addEventListener("input", function () {
    clearTimeout(buscarTimer);
    buscarTimer = setTimeout(aplicarFiltros, 200);
  });
  [elEstado, elFormato, elFecha, elProd, elSoloFav, elOrden].forEach(function (c) {
    c.addEventListener("change", aplicarFiltros);
  });
  btnReordenar.addEventListener("click", reordenar);
  function limpiarFiltros() {
    elBuscar.value = "";
    elEstado.value = "todas";
    elFormato.value = "todos";
    elFecha.value = "todas";
    elProd.value = "todas";
    elSoloFav.checked = false;
    elOrden.value = "original";
    aplicarFiltros();
  }
  document.getElementById("limpiar").addEventListener("click", limpiarFiltros);

  document.getElementById("sorpresa-btn").addEventListener("click", function () {
    const candidatas = todas.filter(function (i) {
      return !refs[i.id].li.hidden && estadoDe(i.id) === "idea";
    });
    if (!candidatas.length) {
      elSorpresa.textContent = "No hay ideas en estado «Idea» con los filtros actuales.";
      return;
    }
    const i = candidatas[Math.floor(Math.random() * candidatas.length)];
    elSorpresa.textContent = "Te toca: " + (i.propia ? "" : i.id + ". ") + partirTexto(i.texto).texto + " [" + i.formato + "]";
    let det = refs[i.id].li.closest("details");
    while (det) {
      det.open = true;
      det = det.parentElement ? det.parentElement.closest("details") : null;
    }
    mostrarPanel(false);
    const li = refs[i.id].li;
    if (li.scrollIntoView) li.scrollIntoView({ block: "center" });
    refs[i.id].hecha.focus({ preventScroll: true });
    li.classList.add("destacada");
    setTimeout(function () { li.classList.remove("destacada"); }, 2500);
  });

  // ---- Secciones y detalles plegables ----
  function abrirSecciones(abrir) {
    secRefs.forEach(function (s) { s.section.open = abrir; });
  }
  function abrirDetalles(abrir) {
    todas.forEach(function (i) { refs[i.id].det.open = abrir; refs[i.id].prod.open = abrir; });
  }
  document.getElementById("abrir-secciones").addEventListener("click", function () { abrirSecciones(true); });
  document.getElementById("cerrar-secciones").addEventListener("click", function () { abrirSecciones(false); });
  document.getElementById("abrir-detalles").addEventListener("click", function () { abrirDetalles(true); });
  document.getElementById("cerrar-detalles").addEventListener("click", function () { abrirDetalles(false); });

  // ---- Celebración al publicar (se omite si pides reducir el movimiento) ----
  const sinMovimiento = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function movimientoOk() { return !(sinMovimiento && sinMovimiento.matches); }

  function celebrar(id) {
    const r = refs[id];
    if (!r || !movimientoOk()) return;
    const cab = r.li.querySelector(".cabecera");
    r.li.classList.remove("celebrar");
    void r.li.offsetWidth;   // reinicia la animación si se repite
    r.li.classList.add("celebrar");
    const g = el("span", { "class": "confeti", "aria-hidden": "true" });
    for (let k = 0; k < 8; k++) {
      const p = el("i");
      p.style.setProperty("--a", (k * 45) + "deg");
      p.style.setProperty("--c", k % 2 ? "var(--est-publicada)" : "var(--acento)");
      g.appendChild(p);
    }
    cab.appendChild(g);
    setTimeout(function () { g.remove(); r.li.classList.remove("celebrar"); }, 1000);
  }

  // ---- Cambios en las ideas ----
  function setDatoMem(id, campo, valor) {
    const d = state.datos[id] || {};
    if (valor) { d[campo] = valor; } else { delete d[campo]; }
    if (Object.keys(d).length) { state.datos[id] = d; } else { delete state.datos[id]; }
  }

  function setDato(id, campo, valor) {
    setDatoMem(id, campo, valor);
    persistirIdea(id);
    contar();
  }

  function setEstado(id, nuevo) {
    const antes = estadoDe(id);
    if (nuevo === "publicada") {
      state.hechas[id] = true;
      setDatoMem(id, "estado", "");
    } else {
      delete state.hechas[id];
      setDatoMem(id, "estado", nuevo === "idea" ? "" : nuevo);
    }
    refs[id].hecha.checked = nuevo === "publicada";
    refs[id].estado.value = nuevo;
    marcarFila(id);
    persistirIdea(id);
    contar();
    if (nuevo === "publicada" && antes !== "publicada") celebrar(id);
  }

  function setPaso(id, clave, marcado) {
    const actuales = pasosDe(id).filter(function (k) { return k !== clave; });
    if (marcado) actuales.push(clave);
    const ordenados = CLAVES_PASOS.filter(function (k) { return actuales.indexOf(k) !== -1; });
    setDato(id, "pasos", ordenados.length ? ordenados : "");
    actualizarPasos(id);
  }

  lista.addEventListener("change", function (e) {
    const t = e.target;
    const idHecha = t.getAttribute("data-id");
    const idEstado = t.getAttribute("data-estado");
    const idFav = t.getAttribute("data-fav");
    const idFecha = t.getAttribute("data-fecha");
    const paso = t.getAttribute("data-paso");
    if (idHecha) {
      setEstado(idHecha, t.checked ? "publicada" : "idea");
    } else if (idEstado) {
      setEstado(idEstado, t.value);
    } else if (idFav) {
      setDato(idFav, "fav", t.checked);
    } else if (idFecha) {
      if (t.value && !fechaAceptable(t.value)) {
    t.value = (state.datos[idFecha] || {}).fecha || "";   // se restaura la anterior
    anunciar("Fecha no válida: usa un año entre 2000 y 2100.");
    return;
  }
  setDato(idFecha, "fecha", t.value);
    } else if (paso) {
      setPaso(t.getAttribute("data-pid"), paso, t.checked);
    }
  });

  lista.addEventListener("input", function (e) {
    const t = e.target;
    const idNota = t.getAttribute("data-nota");
    const idLibro = t.getAttribute("data-libro");
    const idHash = t.getAttribute("data-hashtags");
    if (idNota) {
      setDato(idNota, "nota", t.value);
      actualizarResumen(idNota);
    } else if (idLibro) {
      setDato(idLibro, "libro", t.value.trim() ? t.value : "");
      actualizarAvisosLibro();
    } else if (idHash) {
      setDato(idHash, "hashtags", t.value.trim() ? t.value : "");
      actualizarResumen(idHash);
    }
  });

  lista.addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest("button") : null;
    if (!b) return;
    const id = b.getAttribute("data-idea");
    const accion = b.getAttribute("data-accion");
    const mov = b.getAttribute("data-mover");
    if (b.hasAttribute("data-set")) {
      aplicarSet(id, Number(b.getAttribute("data-set")),b);
    } else if (accion && id && refs[id]) {
      if (accion === "copiar") copiarIdea(id, b);
      else if (accion === "editar") abrirFormIdea(id);
      else if (accion === "borrar") borrarIdea(id);
    } else if (mov && id && refs[id]) {
      moverIdea(id, mov);
      b.focus({ preventScroll: true });
      if (refs[id].li.scrollIntoView) refs[id].li.scrollIntoView({ block: "center" });
    }
  });

  // ---- Descargas ----
  let descargasNs = null; // capacidad "downloads" (solo en la versión publicada)

  let descargasPromesa = Promise.resolve();

  function descargar(nombre, contenido, tipo) {
    return descargasPromesa.then(function () { return descargarAhora(nombre, contenido, tipo); });
  }

  function descargarAhora(nombre, contenido, tipo) {
    if (descargasNs) {
      return descargasNs.save({ filename: nombre, data: contenido }).then(function () {
        return true;
      }, function (err) {
        aviso(err && err.code === "declined"
          ? "Descarga cancelada."
          : "No se pudo descargar el archivo" + (err && err.code ? " (" + err.code + ")." : "."));
        return false;
      });
    }
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return Promise.resolve(true);
  }

  function csv(v) {
    v = String(v == null ? "" : v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // evita que una hoja de cálculo lo interprete como fórmula
    return '"' + v.replace(/"/g, '""') + '"';
  }

  function icsTexto(t) {
    return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }

  // Las líneas de un .ics no pueden pasar de 75 bytes: se parten con un espacio al inicio de la continuación.
  function plegar(linea) {
    const enc = new TextEncoder();
    const out = [];
    let actual = "";
    let bytes = 0;
    Array.from(linea).forEach(function (ch) {
      const b = enc.encode(ch).length;
      if (bytes + b > 75) { out.push(actual); actual = " "; bytes = 1; }
      actual += ch;
      bytes += b;
    });
    out.push(actual);
    return out.join("\r\n");
  }

  function textoProduccion(id) {
    const hechos = pasosDe(id);
    if (!hechos.length) return "0/" + PASOS.length;
    return hechos.length + "/" + PASOS.length + " (" + PASOS.filter(function (p) {
      return hechos.indexOf(p[0]) !== -1;
    }).map(function (p) { return p[1]; }).join(", ") + ")";
  }

  // ---- Herramientas de progreso ----
  document.getElementById("exportar").addEventListener("click", function () {
    vaciarPersistencia();
    const ahora = new Date().toISOString();
    const payload = serializar();
    payload.exportado = ahora;
    descargar("ideas_post_90_progreso.json", JSON.stringify(payload, null, 2), "application/json").then(function (ok) {
      if (!ok) return;
      meta.ultimoRespaldo = ahora;
      escribir(KEY_META, meta);
      actualizarRecordatorio();
      aviso("Progreso exportado.");
    });
  });

  document.getElementById("exportar-csv").addEventListener("click", function () {
    const filas = [["id", "sección", "formato", "idea", "estado", "producción", "favorita", "fecha", "libro", "hashtags", "notas", "prioridad"].map(csv).join(",")];
    const puesto = {};
    todas.slice().sort(cmpOrden).forEach(function (i, k) { puesto[i.id] = k + 1; });
    secRefs.forEach(function (sec, k) {
      todas.filter(function (i) { return i.sec === k; }).sort(cmpOrden).forEach(function (i) {
        const d = state.datos[i.id] || {};
        filas.push([
          i.propia ? "propia" : i.id, sec.titulo, i.formato, i.texto, etiquetaEstado(estadoDe(i.id)), textoProduccion(i.id),
          d.fav ? "sí" : "", d.fecha || "", d.libro || "", d.hashtags || "", d.nota || "", puesto[i.id]
        ].map(csv).join(","));
      });
    });
    descargar("ideas_post_90_ideas.csv", "\uFEFF" + filas.join("\r\n") + "\r\n", "text/csv;charset=utf-8").then(function (ok) {
      if (ok) aviso("CSV exportado. Ojo: no sirve como respaldo; para eso usa el JSON.");
    });
  });

  document.getElementById("exportar-ics").addEventListener("click", function () {
    const sello = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ideas_post_90//ES", "CALSCALE:GREGORIAN"];
    let n = 0;
    todas.forEach(function (i) {
      const d = state.datos[i.id] || {};
      if (!d.fecha) return;
      const p = d.fecha.split("-").map(Number);
      const fin = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1)).toISOString().slice(0, 10).replace(/-/g, "");
      const desc = ["Formato: " + i.formato, "Estado: " + etiquetaEstado(estadoDe(i.id)), "Producción: " + textoProduccion(i.id)];
      if (d.libro) desc.push("Libro: " + d.libro);
      if (d.hashtags) desc.push("Hashtags: " + d.hashtags);
      if (d.nota) desc.push("Notas: " + d.nota);
      out.push("BEGIN:VEVENT");
      out.push("UID:idea-" + i.id + "@ideas-post-90");
      out.push("DTSTAMP:" + sello);
      out.push("DTSTART;VALUE=DATE:" + d.fecha.replace(/-/g, ""));
      out.push("DTEND;VALUE=DATE:" + fin);
      out.push("SUMMARY:" + icsTexto("Publicar " + (i.propia ? "" : "#" + i.id + ": ") + partirTexto(i.texto).texto.slice(0, 80)));
      out.push("DESCRIPTION:" + icsTexto(desc.join("\n")));
      out.push("END:VEVENT");
      n++;
    });
    out.push("END:VCALENDAR");
    if (!n) { aviso("No hay ideas con fecha para exportar al calendario."); return; }
    descargar("ideas_post_90_calendario.ics", out.map(plegar).join("\r\n") + "\r\n", "text/calendar;charset=utf-8").then(function (ok) {
      if (ok) aviso("Calendario exportado con " + n + " idea" + (n === 1 ? "" : "s") + ".");
    });
  });

  function refrescarTodo() {
    sincronizarEstructura();
    sincronizar();
    contar();
    actualizarAvisosLibro();
    renderSets();
    aplicarFiltros();
    actualizarRecordatorio();
    actualizarDeshacer();
    renderBorradas();
  }

document.getElementById("reiniciar").addEventListener("click", function () {
  confirmar("¿Desmarcar todas las ideas hechas? Tus favoritas, fechas, libros, notas y conjuntos se mantienen. Podrás deshacerlo después.").then(function (ok) {
    if (!ok) return;
    return prepararDeshacer("reinicio").then(function (seguir) {
      if (!seguir) return;
      const nuevo = limpiarEstado(serializar());
      nuevo.hechas = {};
      aplicarEstadoCompleto(nuevo);
      refrescarTodo();
      aviso("Se desmarcaron todas las ideas hechas." + (btnDeshacer.hidden ? "" : " Puedes usar el botón «Deshacer»."));
    });
  });
});

  btnDeshacer.addEventListener("click", function () {
    const snap = leerSnapshot();
    if (!snap) { actualizarDeshacer(); return; }
    confirmar("Se restaurará tu progreso tal como estaba antes del " + snap.accion + ". Los cambios hechos desde entonces se perderán. ¿Continuar?").then(function (ok) {
      if (!ok) return;
      aplicarEstadoCompleto(snap.estado);
      borrar(KEY_DESHACER);
      refrescarTodo();
      aviso("Se restauró el progreso anterior al " + snap.accion + ".");
    });
  });

  document.getElementById("importar").addEventListener("change", function (ev) {
    const input = ev.target;
    const archivo = input.files && input.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function () {
           let crudo = null, nuevo = null, motivo = "";
      try { crudo = JSON.parse(lector.result); } catch (err) { motivo = "no es un JSON válido"; }
      if (!motivo) {
        if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) motivo = "no tiene el formato de un respaldo";
        else if (crudo.version !== 1) motivo = "no indica una versión de respaldo compatible (falta «version»)";
        else if (!tieneFormatoRespaldo(crudo)) motivo = "no contiene «hechas» ni «datos»";
      }
      let importadas = 0, ignoradas = 0, actuales = 0;
      if (!motivo) {
        nuevo = limpiarEstado(crudo);
        if (!nuevo) motivo = "no tiene el formato de un respaldo";
      }
      if (!motivo) {
        const conDatos = function (st) {
          const u = Object.create(null);
          Object.keys(st.datos).forEach(function (id) { u[id] = true; });
          Object.keys(st.hechas).forEach(function (id) { u[id] = true; });
          return u;
        };
        importadas = Object.keys(conDatos(nuevo)).length;
        actuales = Object.keys(conDatos(state)).length;
        const decl = Object.create(null);
        if (Array.isArray(crudo.hechas)) crudo.hechas.forEach(function (id) { decl[String(id)] = true; });
        if (crudo.datos && typeof crudo.datos === "object" && !Array.isArray(crudo.datos)) {
          Object.keys(crudo.datos).forEach(function (id) { decl[id] = true; });
        }
        ignoradas = Math.max(0, Object.keys(decl).length - importadas);
        if (!importadas && !nuevo.sets.length) motivo = "no contiene ninguna idea ni conjunto reconocible";
      }
      if (motivo) {
        aviso("El archivo " + motivo + ". No se cambió nada.");
        input.value = "";
        return;
      }
      // Un respaldo antiguo no trae conjuntos: se conservan los actuales.
      if (!Array.isArray(crudo.sets)) nuevo.sets = state.sets.slice();
      confirmar("Se importarán " + importadas + " ideas con datos (" + Object.keys(nuevo.hechas).length + " publicadas) y " +
        nuevo.sets.length + " conjuntos de hashtags" +
        (ignoradas ? "; " + ignoradas + " entradas del archivo no se reconocieron y se omitirán" : "") +
        ". Esto reemplazará tu progreso actual (" + actuales + " ideas con datos). Podrás deshacerlo. ¿Continuar?").then(function (ok) {
    input.value = "";
    if (!ok) return;
    return prepararDeshacer("importación").then(function (seguir) {
      if (!seguir) return;
      aplicarEstadoCompleto(nuevo);
      refrescarTodo();
      aviso("Progreso importado." + (btnDeshacer.hidden ? "" : " Puedes usar el botón «Deshacer» si te equivocaste de archivo."));
    });
  });
    };
    lector.onerror = function () {
      aviso("No se pudo leer el archivo.");
      input.value = "";
    };
    lector.readAsText(archivo);
  });

  // ---- Diálogos (con respaldo si el navegador no soporta <dialog>) ----
  function abrirDialogo(dlg) {
    try {
      if (typeof dlg.showModal === "function") { dlg.showModal(); return; }
    } catch (err) { /* se usa el respaldo */ }
    dlg.setAttribute("open", "");
  }

  function cerrarDialogo(dlg) {
    try {
      if (typeof dlg.close === "function") { dlg.close(); return; }
    } catch (err) { /* se usa el respaldo */ }
    dlg.removeAttribute("open");
  }

  // ---- Copiar libro, hashtags y notas ----
  const elCopiado = document.getElementById("copiado");
  const dlgCopiar = document.getElementById("dialogo-copiar");
  const elCopiarTexto = document.getElementById("copiar-texto");

  function anunciar(txt) {
    elCopiado.textContent = "";
    setTimeout(function () { elCopiado.textContent = txt; }, 30);
  }

  function parpadeo(boton, txt) {
    const original = boton.getAttribute("data-texto") || boton.textContent;
    boton.setAttribute("data-texto", original);
    boton.textContent = txt;
    clearTimeout(boton._t);
    boton._t = setTimeout(function () { boton.textContent = original; }, 1800);
  }

  // Texto listo para pegar: notas (el texto del post), el libro y al final los hashtags.
  function textoParaCopiar(id) {
    const d = state.datos[id] || {};
    const partes = [];
    if (d.nota && d.nota.trim()) partes.push(d.nota.trim());
    if (d.libro && d.libro.trim()) partes.push("Libro: " + d.libro.trim());
    if (d.hashtags && d.hashtags.trim()) partes.push(d.hashtags.trim());
    return partes.join("\n\n");
  }

  function copiarAlPortapapeles(texto) {
    return new Promise(function (resolve) {
      function respaldo() {
        try {
          const ta = document.createElement("textarea");
          ta.value = texto;
          ta.setAttribute("readonly", "");
          ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
          document.body.appendChild(ta);
          ta.select();
          ta.setSelectionRange(0, texto.length);
          const ok = !!(document.execCommand && document.execCommand("copy"));
          ta.remove();
          resolve(ok);
        } catch (err) {
          resolve(false);
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () { resolve(true); }, respaldo);
      } else {
        respaldo();
      }
    });
  }

  function copiarIdea(id, boton) {
    const texto = textoParaCopiar(id);
    if (!texto) {
      anunciar("Esta idea no tiene libro, hashtags ni notas para copiar.");
      parpadeo(boton, "Nada que copiar");
      return;
    }
    copiarAlPortapapeles(texto).then(function (ok) {
      if (ok) {
        anunciar("Copiado al portapapeles.");
        parpadeo(boton, "¡Copiado!");
      } else {
        // Último recurso: se muestra el texto para copiarlo a mano.
        elCopiarTexto.value = texto;
        abrirDialogo(dlgCopiar);
        elCopiarTexto.focus();
        elCopiarTexto.select();
      }
    });
  }
  document.getElementById("copiar-cerrar").addEventListener("click", function () { cerrarDialogo(dlgCopiar); });

  // ---- Crear, editar, borrar y restaurar ideas ----
  const dlgIdea = document.getElementById("dialogo-idea");
  const elIdeaTitulo = document.getElementById("dialogo-idea-titulo");
  const elIdeaTexto = document.getElementById("idea-texto");
  const elIdeaFormato = document.getElementById("idea-formato");
  const elIdeaSeccion = document.getElementById("idea-seccion");
  const elIdeaError = document.getElementById("idea-error");
  let ideaEditando = null;

  const elIdeaSeccionNueva = document.getElementById("idea-seccion-nueva");
  const elIdeaSeccionCampo = document.getElementById("idea-seccion-nueva-campo");

  // Opciones de sección: las base, las nuevas que ya existan y al final «Nueva sección…».
  function poblarSecciones(valor) {
    elIdeaSeccion.textContent = "";
    secRefs.forEach(function (s, k) {
      elIdeaSeccion.appendChild(el("option", { value: k < SECCIONES.length ? String(k) : "x:" + s.titulo, text: s.titulo }));
    });
    elIdeaSeccion.appendChild(el("option", { value: "__nueva", text: "＋ Nueva sección…" }));
    elIdeaSeccion.value = valor;
    mostrarCampoNuevaSeccion();
  }

  function valorSeccion(k) {
    return k < SECCIONES.length || !secRefs[k] ? String(k) : "x:" + secRefs[k].titulo;
  }

  function mostrarCampoNuevaSeccion() {
    elIdeaSeccionCampo.hidden = elIdeaSeccion.value !== "__nueva";
  }
  elIdeaSeccion.addEventListener("change", function () {
    mostrarCampoNuevaSeccion();
    if (!elIdeaSeccionCampo.hidden) elIdeaSeccionNueva.focus();
  });

  // A qué sección va la idea: una base ({sec}), una nueva ({nombre}) o un error.
  function destinoSeccion() {
    const v = elIdeaSeccion.value;
    if (v === "__nueva") {
      const nombre = elIdeaSeccionNueva.value.replace(/\s+/g, " ").trim();
      if (!nombre) return { error: "Escribe el nombre de la nueva sección." };
      if (nombre.length > MAX_SECCION) return { error: "El nombre de la sección es demasiado largo (máximo " + MAX_SECCION + " caracteres)." };
      const clave = normalizar(nombre);
      // Si ya existe una sección con ese nombre, se usa esa en vez de duplicarla.
      for (let k = 0; k < secRefs.length; k++) {
        const t = k < SECCIONES.length ? secRefs[k].titulo.replace(/^\d+\.\s*/, "") : secRefs[k].titulo;
        if (normalizar(t) === clave) return k < SECCIONES.length ? { sec: k } : { nombre: secRefs[k].titulo };
      }
      return { nombre: nombre };
    }
    if (v.indexOf("x:") === 0) return { nombre: v.slice(2) };
    const n = Number(v);
    return n >= 0 && n < SECCIONES.length && Math.floor(n) === n ? { sec: n } : { error: "Elige un formato y una sección." };
  }

  function asignarSeccion(id, destino, b) {
    if (destino.nombre) {
      fijarCampo(id, "secNombre", destino.nombre, false);
      fijarCampo(id, "sec", 0, true);
    } else {
      fijarCampo(id, "secNombre", "", true);
      fijarCampo(id, "sec", destino.sec, !!b && destino.sec === b.sec);
    }
  }

  function nuevoId() {
    let id;
    do {
      id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    } while (state.datos[id] || baseInfo[id]);
    return id;
  }

  function abrirFormIdea(id) {
    ideaEditando = id || null;
    elIdeaError.textContent = "";
    elIdeaSeccionNueva.value = "";
    if (id) {
      const info = refs[id].idea;
      elIdeaTitulo.textContent = "Editar idea";
      elIdeaTexto.value = partirTexto(info.texto).texto;
      elIdeaFormato.value = info.formato;
      poblarSecciones(valorSeccion(info.sec));
    } else {
      elIdeaTitulo.textContent = "Nueva idea";
      elIdeaTexto.value = "";
      elIdeaFormato.value = "Post";
      poblarSecciones(String(SECCIONES.length - 1));
    }
    abrirDialogo(dlgIdea);
    elIdeaTexto.focus();
  }

  function destacarIdea(id) {
    const r = refs[id];
    if (!r) return;
    let det = r.li.closest("details");
    while (det) {
      det.open = true;
      det = det.parentElement ? det.parentElement.closest("details") : null;
    }
    if (r.li.scrollIntoView) r.li.scrollIntoView({ block: "center" });
    r.li.classList.add("destacada");
    setTimeout(function () { r.li.classList.remove("destacada"); }, 2500);
  }

  function guardarFormIdea() {
    const limpio = elIdeaTexto.value.replace(/\s+/g, " ").trim();
    const formato = elIdeaFormato.value;
    if (!limpio) { elIdeaError.textContent = "Escribe el texto de la idea."; elIdeaTexto.focus(); return; }
    if (limpio.length > MAX_TEXTO) { elIdeaError.textContent = "El texto es demasiado largo (máximo " + MAX_TEXTO + " caracteres)."; return; }
    const destino = destinoSeccion();
    if (destino.error) { elIdeaError.textContent = destino.error; if (elIdeaSeccion.value === "__nueva") elIdeaSeccionNueva.focus(); return; }
    if (FORMATOS.indexOf(formato) === -1) { elIdeaError.textContent = "Elige un formato y una sección."; return; }

    let id = ideaEditando;
    if (id) {
      const b = baseInfo[id];
      const origen = b ? partirTexto(b.texto).origen : "";
      const texto = (origen ? origen + " " : "") + limpio + " [" + formato + "]";
      if (b) {
        fijarCampo(id, "texto", texto, texto === b.texto);
        fijarCampo(id, "formato", formato, formato === b.formato);
        asignarSeccion(id, destino, b);
      } else {
        fijarCampo(id, "texto", texto, false);
        fijarCampo(id, "formato", formato, false);
        asignarSeccion(id, destino, null);
      }
      persistirIdea(id);
      sincronizarEstructura();
      cerrarDialogo(dlgIdea);
      contar();
      actualizarAvisosLibro();
      aplicarFiltros();
      anunciar("Idea actualizada.");
      destacarIdea(id);
    } else {
      id = nuevoId();
      const maxOrden = todas.reduce(function (m, i) { return Math.max(m, i.orden); }, 0);
      const nuevaIdea = { propia: true, texto: limpio + " [" + formato + "]", formato: formato, orden: maxOrden + 1000 };
      if (destino.nombre) nuevaIdea.secNombre = destino.nombre; else nuevaIdea.sec = destino.sec;
      state.datos[id] = nuevaIdea;
      persistirIdea(id);
      sincronizarEstructura();
      cerrarDialogo(dlgIdea);
      limpiarFiltros();   // por si algún filtro dejaba la idea nueva fuera de la vista
      contar();
      actualizarAvisosLibro();
      anunciar("Idea añadida.");
      destacarIdea(id);
    }
  }
  document.getElementById("idea-guardar").addEventListener("click", guardarFormIdea);
  document.getElementById("idea-cancelar").addEventListener("click", function () { cerrarDialogo(dlgIdea); });
  document.getElementById("nueva-idea").addEventListener("click", function () { abrirFormIdea(null); });

  function resumenIdea(id) {
    const t = partirTexto(infoIdea(id).texto).texto;
    return t.length > 90 ? t.slice(0, 90) + "…" : t;
  }

  function borrarIdea(id) {
    confirmar("¿Borrar la idea «" + resumenIdea(id) + "»? Podrás restaurarla desde «Ideas borradas».").then(function (ok) {
      if (!ok || !refs[id]) return;
      fijarCampo(id, "borrada", true, false);
      persistirIdea(id);
      sincronizarEstructura();
      contar();
      actualizarAvisosLibro();
      aplicarFiltros();
      renderBorradas();
      anunciar("Idea borrada.");
    });
  }

  const elPanelBorradas = document.getElementById("panel-borradas");
  const elResumenBorradas = document.getElementById("resumen-borradas");
  const elListaBorradas = document.getElementById("lista-borradas");

  function renderBorradas() {
    const borradas = todosLosIds(state).filter(function (id) { return state.datos[id] && state.datos[id].borrada; });
    elPanelBorradas.hidden = borradas.length === 0;
    elResumenBorradas.textContent = "Ideas borradas (" + borradas.length + ")";
    elListaBorradas.textContent = "";
    borradas.forEach(function (id) {
      const li = el("li");
      li.appendChild(el("span", { text: (baseInfo[id] ? id + ". " : "") + resumenIdea(id) }));
      const b = el("div", { "class": "botones" });
      b.appendChild(el("button", { type: "button", "data-restaurar": id, "aria-label": "Restaurar la idea " + resumenIdea(id), text: "Restaurar" }));
      li.appendChild(b);
      elListaBorradas.appendChild(li);
    });
  }

  elListaBorradas.addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest("button[data-restaurar]") : null;
    if (!b) return;
    const id = b.getAttribute("data-restaurar");
    if (!state.datos[id] || !state.datos[id].borrada) return;
    fijarCampo(id, "borrada", false, true);
    persistirIdea(id);
    sincronizarEstructura();
    sincronizarIdea(id, null);
    contar();
    actualizarAvisosLibro();
    aplicarFiltros();
    renderBorradas();
    anunciar("Idea restaurada.");
    destacarIdea(id);
  });

  // ---- Ordenar a mano (prioridad) ----
  // Cada idea tiene un número de orden; al moverla se le da uno intermedio entre sus vecinas,
  // así solo cambia (y se sincroniza) la idea movida.
  function renormalizarOrden(orden) {
    orden.forEach(function (i, k) {
      const v = (k + 1) * 1000;
      if (i.orden !== v) {
        fijarCampo(i.id, "orden", v, false);
        persistirIdea(i.id);
        i.orden = v;
      }
    });
  }

  function moverIdea(id, accion) {
    let orden = todas.slice().sort(cmpOrden);
    let hueco = Infinity;
    for (let k = 1; k < orden.length; k++) hueco = Math.min(hueco, orden[k].orden - orden[k - 1].orden);
    if (hueco < 0.001) { renormalizarOrden(orden); orden = todas.slice().sort(cmpOrden); }

    let idx = -1;
    orden.forEach(function (i, n) { if (i.id === id) idx = n; });
    const sinEsta = orden.filter(function (i) { return i.id !== id; });
    const posEn = function (otraId) {
      for (let n = 0; n < sinEsta.length; n++) if (sinEsta[n].id === otraId) return n;
      return -1;
    };
    let nuevo = null;
    if (idx === -1 || !sinEsta.length) return;
    if (accion === "inicio") {
      if (idx === 0) return;
      nuevo = sinEsta[0].orden - 1000;
    } else if (accion === "fin") {
      if (idx === orden.length - 1) return;
      nuevo = sinEsta[sinEsta.length - 1].orden + 1000;
    } else if (accion === "arriba") {
      let p = null;
      for (let a = idx - 1; a >= 0; a--) { if (!refs[orden[a].id].li.hidden) { p = orden[a]; break; } }
      if (!p) return;
      const pi = posEn(p.id);
      nuevo = pi > 0 ? (sinEsta[pi - 1].orden + p.orden) / 2 : p.orden - 1000;
    } else if (accion === "abajo") {
      let s = null;
      for (let z = idx + 1; z < orden.length; z++) { if (!refs[orden[z].id].li.hidden) { s = orden[z]; break; } }
      if (!s) return;
      const si = posEn(s.id);
      nuevo = si < sinEsta.length - 1 ? (s.orden + sinEsta[si + 1].orden) / 2 : s.orden + 1000;
    }
    if (nuevo === null) return;
    fijarCampo(id, "orden", nuevo, false);
    refs[id].idea.orden = nuevo;
    persistirIdea(id);
    reordenar();
  }

  // ---- Sincronización entre pestañas del mismo navegador ----
  window.addEventListener("storage", function (e) {
    if (e.key !== null && e.key !== KEY && e.key !== KEY_META && e.key !== KEY_DESHACER) return;
    // Si hay una edición local en espera, se guarda y no se relee: así no se pierde al pisar el estado.
    if (persistPendiente) { vaciarPersistencia(); return; }
        const insp2 = inspeccionarAlmacen();
    if (insp2.tipo === "ok") { state = insp2.estado; }
    else if (insp2.tipo === "vacio") state = estadoVacio();
    else return;   // dañado o inaccesible: se conserva lo que hay en memoria
    meta = leerMeta();
    prepararMarcas();
    sincronizarEstructura();
    sincronizar();
    contar();
    actualizarAvisosLibro();
    renderSets();
    renderBorradas();
    actualizarRecordatorio();
    actualizarDeshacer();
  });

  // ============================================================
  // Sincronización entre dispositivos (solo en la versión publicada)
  // Cada idea es un documento privado de la persona: data/users/<id>/idea-N,
  // y los conjuntos de hashtags, otro: data/users/<id>/conjuntos.
  // Gana la versión con la marca de tiempo (mod) más reciente.
  // ============================================================
  const sync = {
    col: null, baja: null, modo: "local", contador: 0,
    sucios: {}, sucioSets: 0, enCurso: false, timer: null,
    inicial: false, reintentos: 0, ultima: null, rechazadas: {}
  };

  function textoSync() {
    const h = sync.ultima ? sync.ultima.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : "";
    switch (sync.modo) {
      case "conectando": return "Sincronización: conectando…";
      case "ok": return "Sincronización activa" + (h ? " (última a las " + h + ")." : ".");
      case "guardando": return "Sincronización: guardando cambios…";
      case "error": return "⚠ Sincronización: sin conexión. Tus cambios están guardados aquí y se enviarán al reconectar.";
      case "sin-sesion": return "Sincronización no disponible.";
      case "cuota": return "⚠ Sincronización: el almacenamiento de la página está lleno y no se pueden guardar más datos.";
      case "rechazado": return "⚠ Sincronización: una idea no se pudo guardar en la nube (¿una nota demasiado larga?). Lo demás sigue sincronizándose.";
      case "denegada": return "⚠ Sincronización detenida: esta página perdió el permiso para guardar datos.";
      default: return "Sin sincronización: tus datos se guardan solo en este navegador.";
    }
  }

  // Estado cuando no queda nada por enviar: avisa si alguna idea no se pudo guardar.
  function estadoReposo() {
    estadoSync(Object.keys(sync.rechazadas).length ? "rechazado" : "ok");
  }

  function estadoSync(modo) {
    sync.modo = modo;
    if (modo === "ok") sync.ultima = new Date();
    elSync.textContent = textoSync();
    elSync.classList.toggle("alerta", elSync.textContent.indexOf("⚠") === 0);
    btnSync.hidden = !sync.col;
  }

  function marcarIdea(id) {
    if (!sync.col) return;
    sync.sucios[id] = ++sync.contador;
    programarVaciado(900);
  }

  function marcarSets() {
    if (!sync.col) return;
    sync.sucioSets = ++sync.contador;
    programarVaciado(900);
  }

  function programarVaciado(ms) {
    clearTimeout(sync.timer);
    sync.timer = setTimeout(vaciar, ms);
  }

  function vaciar() {
    if (sync.enCurso || !sync.col) return;
    vaciarSiguiente();
  }

  // Envía los cambios pendientes de uno en uno (un documento a la vez).
  function vaciarSiguiente() {
    const ids = Object.keys(sync.sucios);
    let clave, version, op;
    if (sync.sucioSets) {
      clave = "__sets";
      version = sync.sucioSets;
      op = function () { return sync.col.doc("conjuntos").set({ sets: state.sets, mod: state.modSets }); };
    } else if (ids.length) {
      clave = ids[0];
      version = sync.sucios[clave];
      op = function () {
        const rec = registroDe(clave);
        rec.mod = state.mod[clave] || 0;
        return sync.col.doc("idea-" + clave).set(rec);
      };
    } else {
      sync.enCurso = false;
      if (sync.col && sync.inicial) estadoReposo();
      return;
    }
    sync.enCurso = true;
    estadoSync("guardando");
    let promesa;
    try { promesa = op(); } catch (err) { promesa = Promise.reject(err); }
    promesa.then(function () {
      if (clave === "__sets") { if (sync.sucioSets === version) sync.sucioSets = 0; }
      else if (sync.sucios[clave] === version) { delete sync.sucios[clave]; }
      delete sync.rechazadas[clave];
      sync.reintentos = 0;
      vaciarSiguiente();
    }, function (err) {
      sync.enCurso = false;
      errorSync(err, clave, version);
    });
  }

  function errorSync(err, clave, version) {
    const code = err && err.code;
    if (code === "quota_exceeded") { estadoSync("cuota"); return; }
    if (code === "revoked" || code === "not_granted" || code === "capability_disabled" || code === "capability_removed") {
      cerrarSync();
      estadoSync("denegada");
      return;
    }
    if (code === "invalid_argument" || code === "transform_error") {
      // Ese documento no se puede guardar: se omite para no bloquear el resto.
      if (clave === "__sets") { if (sync.sucioSets === version) sync.sucioSets = 0; }
      else if (sync.sucios[clave] === version) { delete sync.sucios[clave]; }
      sync.rechazadas[clave] = true;
      estadoSync("rechazado");
      programarVaciado(300);
      return;
    }
    sync.reintentos++;
    estadoSync("error");
    programarVaciado(Math.min(60000, 5000 * sync.reintentos));
  }

  function cerrarSync() {
    if (sync.baja) { try { sync.baja(); } catch (err) { /* sin acción */ } }
    sync.baja = null;
    sync.col = null;
    clearTimeout(sync.timer);
  }

  // Aplica lo que llegó de la nube sin volver a enviarlo.
  function firmaEstructura(id) {
    const d = state.datos[id] || {};
    return JSON.stringify([infoIdea(id), !!d.borrada]);
  }

  function aplicarRemoto(id, data, rmod) {
    const hecha = data.hecha === true;
    const limpio = limpiarDato(data, hecha);
    if (!baseInfo[id] && !idPropioValido(id, limpio)) return;
    const antes = firmaEstructura(id);
    if (hecha) { state.hechas[id] = true; } else { delete state.hechas[id]; }
    if (Object.keys(limpio).length) { state.datos[id] = limpio; } else { delete state.datos[id]; }
    state.mod[id] = rmod;
    guardar();
    if (firmaEstructura(id) !== antes) {
      sincronizarEstructura();
      aplicarFiltros();
      renderBorradas();
    }
    if (refs[id]) {
      sincronizarIdea(id, document.activeElement);
      actualizarResumen(id);
    }
    contar();
    actualizarAvisosLibro();
  }

  function aplicarRemotoSets(data, rmod) {
    state.sets = limpiarSets(data.sets);
    state.modSets = rmod;
    guardar();
    cancelarEdicionSet();
    renderSets();
  }

  function conciliarDoc(doc) {
    if (!doc || !doc.exists) return;
    const data = doc.data() || {};
    const rmod = marcaValida(Number(data.mod));
    verMarca(rmod);
    if (doc.id === "conjuntos") {
      if (rmod > state.modSets) aplicarRemotoSets(data, rmod);
      else if (state.modSets > rmod) marcarSets();
      return;
    }
    const m = /^idea-(.+)$/.exec(doc.id);
    if (!m) return;
    const id = m[1];
    if (!baseInfo[id] && !(CUSTOM_RE.test(id) && data.propia === true)) return;
    const lmod = state.mod[id] || 0;
    if (rmod > lmod) aplicarRemoto(id, data, rmod);
    else if (lmod > rmod) marcarIdea(id);
  }

  // Lo que existe solo aquí (y todavía no está en la nube) se sube.
  function subirFaltantes(snap) {
    const presentes = Object.create(null);
    snap.docs.forEach(function (d) { if (d.exists) presentes[d.id] = true; });
    todosLosIds(state).forEach(function (id) {
      if (!presentes["idea-" + id] && tieneDatos(id)) {
        if (!state.mod[id]) state.mod[id] = siguienteMod(0);
        marcarIdea(id);
      }
    });
    if (!presentes["conjuntos"] && state.sets.length) {
      if (!state.modSets) state.modSets = siguienteMod(0);
      marcarSets();
    }
    guardar();
  }

  function alSnapshot(snap) {
    const definitivo = !snap.metadata || !snap.metadata.fromCache;
    snap.docChanges().forEach(function (c) {
      if (c.type !== "removed") conciliarDoc(c.doc);
    });
    if (definitivo && !sync.inicial) {
      sync.inicial = true;
      subirFaltantes(snap);
    }
    if (definitivo && !sync.enCurso && !Object.keys(sync.sucios).length && !sync.sucioSets) estadoReposo();
  }

  function iniciarSync(db, user) {
    if (!db || !user) { estadoSync("local"); return; }
    let pid;
    try { pid = user.id(); } catch (err) { estadoSync("local"); return; }
    Promise.resolve(pid).then(function (uid) {
      if (!uid) { estadoSync("sin-sesion"); return; }
      try {
        sync.col = db.collection("data/users/" + uid);
        estadoSync("conectando");
        sync.baja = sync.col.onSnapshot(alSnapshot, function (err) {
          sync.baja = null;
          if (err && err.code === "revoked") { cerrarSync(); estadoSync("denegada"); }
          else if (err && err.code === "quota_exceeded") { estadoSync("cuota"); }
          else { estadoSync("error"); }
        });
      } catch (err) {
        cerrarSync();
        estadoSync("local");
      }
    }, function () { estadoSync("local"); });
  }

  btnSync.addEventListener("click", function () {
    if (!sync.col) { aviso("La sincronización no está disponible aquí."); return; }
    aviso("Sincronizando…");
    sync.col.get().then(function (snap) {
      snap.docs.forEach(conciliarDoc);
      subirFaltantes(snap);
      vaciar();
      aviso("Sincronizado.");
    }, function () {
      aviso("No se pudo sincronizar ahora. Se reintentará solo.");
    });
  });

  function usarCapacidad(nombre) {
    try {
      if (window.claude && typeof window.claude.use === "function") {
        return Promise.resolve(window.claude.use(nombre)).catch(function () { return null; });
      }
    } catch (err) { /* sin acción */ }
    return Promise.resolve(null);
  }

  function iniciarCapacidades() {
    if (!window.claude || typeof window.claude.use !== "function") { estadoSync("local"); return; }
    estadoSync("conectando");
    descargasPromesa = usarCapacidad("downloads").then(function (ns) {
      descargasNs = ns;
      // En la versión publicada solo se pueden descargar ciertos formatos (no .ics).
      if (ns) document.getElementById("exportar-ics").hidden = true;
    });
    Promise.all([usarCapacidad("db"), usarCapacidad("user")]).then(function (r) { iniciarSync(r[0], r[1]); });
  }

  // ---- Panel de filtros (plegable, dentro de la barra fija) ----
  function mostrarPanel(abrir) {
    elPanelFiltros.hidden = !abrir;
    btnFiltros.setAttribute("aria-expanded", String(abrir));
  }
  btnFiltros.addEventListener("click", function () { mostrarPanel(elPanelFiltros.hidden); });

  // La barra fija mide su altura para que los títulos de sección se peguen justo debajo.
  function medirBarra() {
    document.documentElement.style.setProperty("--alto-barra", elBarra.offsetHeight + "px");
  }
  if (window.ResizeObserver) new ResizeObserver(medirBarra).observe(elBarra);
  window.addEventListener("resize", medirBarra);
  medirBarra();

  // ---- Inicio ----
  refrescarTodo();
  estadoSync("local");
   iniciarCapacidades();

  }   // fin de iniciar()
})();
