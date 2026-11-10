/* ==========================================================================
   main.js · Entrada de la página del Calendario (calendario.html).

   Depende de js/nucleo/datos.js (ideas en window.BT.SECCIONES) y de
   js/nucleo/almacen.js (para escribir fechas en el progreso de Ideas). Todo el
   estado lo lee de:
     - localStorage["ideas_post_90_v1"]  progreso de las ideas (solo lectura,
       salvo la fecha, que se cambia con window.BT.almacen.guardarFecha)
     - localStorage["calendario_config"] meta semanal
     - localStorage["calendario_eventos"] eventos propios (lanzamientos, ARC…)
     - localStorage["calendario_respaldo"] fechas para el aviso de respaldo
   Este script NUNCA escribe las ideas completas: delega en almacen.js para no
   pisar cambios que estén haciendo otras páginas.

   Los módulos vecinos separan lo reutilizable: constantes.js (claves, listas y
   fechas bookish) y util.js (fechas, DOM y ayudantes). Este archivo es la
   entrada: arrancar() monta la rejilla mensual, el detalle del día, la
   meta/racha y los eventos. Los banners «// ---- ... ----» separan cada bloque.
   ========================================================================== */
import {
  KEY, NOTA_SYNC, KEY_CFG, KEY_RESP, META_MAX, FORMATOS, ESTADOS, DOW, MESES,
  NOMBRES_EST, REDES, BOOKISH, KEY_EV, TIPOS_EV, MAX_EV, MAX_TIT_EV
} from "./constantes.js";
import { tiene, pad, isoDe, deIso, fechaValida, el, partir, juevesMarzo } from "./util.js";

(function (listo) {
  if (!listo) {
    const aviso = document.createElement("p");
    aviso.setAttribute("role", "alert");
    aviso.className = "vacio-msg";
    aviso.textContent = "No se pudieron cargar los datos: falta js/nucleo/datos.js (o datos/datos-ideas.json). Conserva la estructura de carpetas y abre la página desde un servidor, no con file://.";
    const m = document.querySelector("main");
    if (m) m.insertBefore(aviso, m.firstChild);
  }
  (listo || Promise.resolve()).then(arrancar, arrancar);
})(window.BT && window.BT.listo);

function arrancar() {
  "use strict";

  const base = Object.create(null);
  ((window.BT && window.BT.SECCIONES) || []).forEach(function (s) {
    s.ideas.forEach(function (i) { base[i.id] = { texto: i.texto, formato: i.formato }; });
  });


  // Fechas bookish: lista fija por mes-día. Solo sugerencias; no se guarda nada.
  let verBookish = true;
  // Primer jueves de marzo: Día Mundial del Libro en Reino Unido (fecha móvil)
  function bookishDe(key) {
    if (!verBookish) return null;
    const md = key.slice(5);
    if (BOOKISH[md]) return BOOKISH[md];
    return md === juevesMarzo(Number(key.slice(0, 4))) ? ["Día Mundial del Libro (Reino Unido)", "Tu libro de infancia o un disfraz literario."] : null;
  }

  let hoyIso = isoDe(new Date());
  let vistaA = new Date().getFullYear(), vistaM = new Date().getMonth();
  let sel = hoyIso;
  let fuente = null;   // respaldo cargado solo para ver

  const elGrid = document.getElementById("cal-grid");
  const elTitulo = document.getElementById("mes-titulo");
  const elDetalle = document.getElementById("detalle");
  const elResumen = document.getElementById("resumen-mes");
  const elMsg = document.getElementById("msg");
  const btnVolver = document.getElementById("volver-mios");
  const elMsgFecha = document.getElementById("msg-fecha");
  const elMetaN = document.getElementById("meta-n");
  const elMetaEstado = document.getElementById("meta-estado");
  const elMetaProg = document.getElementById("meta-prog");
  const elMetaLibres = document.getElementById("meta-libres");
  const elMetaMsg = document.getElementById("meta-msg");
  const elRachaEstado = document.getElementById("racha-estado");
  const elRachaMejor = document.getElementById("racha-mejor");
  const elCumplProg = document.getElementById("cumpl-prog");
  const elCumplEstado = document.getElementById("cumpl-estado");
  const elAnuncio = document.getElementById("anuncio");
  let btnDes = document.getElementById("msg-deshacer"), deshacerFn = null;
  const movil = window.matchMedia ? window.matchMedia("(max-width: 40rem)") : null;
  function anunciar(t) { elAnuncio.textContent = ""; setTimeout(function () { elAnuncio.textContent = t; }, 30); }
  function ofrecerDeshacer(fn) { deshacerFn = fn; btnDes.hidden = !fn; }
  btnDes.addEventListener("click", function () { const f = deshacerFn; ofrecerDeshacer(null); if (f) f(); });
  function anunciarDia() {
    const t = elDetalle.querySelector("h3"), n = elDetalle.querySelectorAll(".det-item").length;
    anunciar((t ? t.textContent : "") + ": " + (n ? n + " publicación" + (n === 1 ? "" : "es") : "sin publicaciones") + ".");
  }

  // ---- Meta semanal (calendario_config: { metaSemanal: 0..21 }, 0 = sin meta) ----
  function metaValida(n) { return typeof n === "number" && isFinite(n) && Math.floor(n) === n && n >= 0 && n <= META_MAX; }
  function leerConfig() {
    try {
      const c = JSON.parse(localStorage.getItem(KEY_CFG));
      return { metaSemanal: c && typeof c === "object" && metaValida(c.metaSemanal) ? c.metaSemanal : 0 };
    } catch (e) { return { metaSemanal: 0 }; }
  }
  function guardarConfig(c) {
    try { localStorage.setItem(KEY_CFG, JSON.stringify(c)); marcarResp("cambio"); return true; } catch (e) { return false; }
  }
  let config = leerConfig();

  // Aviso de respaldo: eventos y meta no van en el JSON de Ideas, así que se avisa si hay cambios sin exportar
  function leerResp() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY_RESP));
      return { cambio: o && typeof o.cambio === "number" ? o.cambio : 0, respaldo: o && typeof o.respaldo === "number" ? o.respaldo : 0 };
    } catch (e) { return { cambio: 0, respaldo: 0 }; }
  }
  function marcarResp(campo) {
    const r = leerResp();
    r[campo] = Date.now();
    try { localStorage.setItem(KEY_RESP, JSON.stringify(r)); } catch (e) { /* no es crítico */ }
  }
  function renderAvisoResp() {
    const aviso = document.getElementById("aviso-resp"), txt = document.getElementById("aviso-resp-txt");
    const r = leerResp(), hayAlgo = eventos.length > 0 || config.metaSemanal > 0;
    const pendiente = hayAlgo && (r.respaldo === 0 || r.cambio > r.respaldo);
    aviso.hidden = !pendiente;
    if (pendiente) {
      txt.textContent = r.respaldo === 0
        ? "⚠ Tus eventos y tu meta solo viven en este navegador y nunca los has exportado."
        : "⚠ Cambiaste eventos o meta después de tu último respaldo (" + new Date(r.respaldo).toLocaleDateString("es") + ").";
    }
  }

  // ---- Eventos propios (calendario_eventos: { version: 1, eventos: [{id, fecha, titulo, tipo}] }) ----
  // Valida los eventos guardados o los de un respaldo importado. Descarta los
  // que no tengan id válido («e» + caracteres), título o fecha real.
  function leerEventos(crudo) {
    try {
      const o = crudo || JSON.parse(localStorage.getItem(KEY_EV));
      const arr = o && Array.isArray(o.eventos) ? o.eventos : [];
      const vistos = Object.create(null), out = [];
      arr.forEach(function (e) {
        if (out.length >= MAX_EV || !e || typeof e !== "object") return;
        const id = typeof e.id === "string" ? e.id : "";
        const t = typeof e.titulo === "string" ? e.titulo.replace(/\s+/g, " ").trim().slice(0, MAX_TIT_EV) : "";
        if (!/^e[a-z0-9]{6,24}$/.test(id) || vistos[id] || !t || !fechaValida(e.fecha)) return;
        vistos[id] = true;
        out.push({ id: id, fecha: e.fecha, titulo: t, tipo: tiene(TIPOS_EV, e.tipo) ? e.tipo : "otro" });
      });
      return out;
    } catch (err) { return []; }
  }
  // Guarda los eventos y marca que hay cambios sin respaldar.
  function guardarEventos(arr) {
    try { localStorage.setItem(KEY_EV, JSON.stringify({ version: 1, eventos: arr })); marcarResp("cambio"); return true; }
    catch (err) { return false; }
  }
  let eventos = leerEventos();
  function eventosDe(key) { return eventos.filter(function (e) { return e.fecha === key; }); }

  // Ideas que se pueden programar desde el calendario: estado «Idea», sin fecha y sin borrar
  function candidatas() {
    const o = leerDatos() || {};
    const datos = o.datos && typeof o.datos === "object" && !Array.isArray(o.datos) ? o.datos : {};
    const hechas = Object.create(null);
    (Array.isArray(o.hechas) ? o.hechas : []).forEach(function (id) { hechas[String(id)] = true; });
    const ids = Object.keys(base);
    Object.keys(datos).forEach(function (id) { if (!base[id]) ids.push(id); });
    const out = [];
    ids.forEach(function (id) {
      let d = datos[id], b = base[id];
      d = d && typeof d === "object" ? d : {};
      if (!b && d.propia !== true) return;
      if (d.borrada === true || hechas[id] || fechaValida(d.fecha)) return;
      if (typeof d.estado === "string" && tiene(ESTADOS, d.estado) && d.estado !== "idea") return;
      const texto = typeof d.texto === "string" && d.texto.trim() ? d.texto : (b ? b.texto : "");
      if (!texto) return;
      const formato = FORMATOS.indexOf(d.formato) !== -1 ? d.formato : (b && FORMATOS.indexOf(b.formato) !== -1 ? b.formato : "Post");
      const t = partir(texto);
      out.push({ id: id, etiqueta: (b ? id + ". " : "Mía: ") + (t.length > 70 ? t.slice(0, 70) + "…" : t) + " [" + formato + "]" });
    });
    return out;
  }

  function renderAnadir() {
    elDetalle.appendChild(el("h4", "", "Añadir una idea a este día"));
    const lista = candidatas();
    if (!lista.length) {
      elDetalle.appendChild(el("p", "vacio-msg", "No quedan ideas en estado «Idea» sin fecha."));
      return;
    }
    const f = el("div", "det-anadir");
    const l = el("label", "campo");
    l.appendChild(el("span", "", "Idea sin fecha (" + lista.length + ")"));
    const s = el("select");
    s.id = "anadir-idea";
    const o0 = el("option", "", "Elige una idea…");
    o0.value = "";
    s.appendChild(o0);
    lista.forEach(function (c) {
      const o = el("option", "", c.etiqueta);
      o.value = c.id;
      s.appendChild(o);
    });
    l.appendChild(s);
    f.appendChild(l);
    const b = el("button", "primario", "Añadir al día");
    b.type = "button";
    b.setAttribute("data-anadir", "1");
    f.appendChild(b);
    elDetalle.appendChild(f);
  }

  function renderEventosDia() {
    const lista = eventosDe(sel);
    if (lista.length) {
      elDetalle.appendChild(el("h4", "", "Eventos"));
      lista.forEach(function (ev) {
        const d = el("div", "det-evento");
        d.appendChild(el("p", "", ev.titulo));
        const m = el("div", "meta");
        m.appendChild(el("span", "chip evento-chip", TIPOS_EV[ev.tipo]));
        d.appendChild(m);
        const q = el("button", "btn-quitar", "Borrar evento");
        q.type = "button";
        q.setAttribute("data-borrar-ev", ev.id);
        d.appendChild(q);
        elDetalle.appendChild(d);
      });
    }
    const f = el("form", "det-evento-nuevo");
    const l1 = el("label", "campo");
    l1.appendChild(el("span", "", "Nuevo evento en este día"));
    const inp = el("input");
    inp.type = "text";
    inp.id = "ev-titulo";
    inp.maxLength = MAX_TIT_EV;
    inp.placeholder = "Ej.: Lanzamiento de ACOTAR 5";
    inp.autocomplete = "off";
    l1.appendChild(inp);
    f.appendChild(l1);
    const l2 = el("label", "campo");
    l2.appendChild(el("span", "", "Tipo"));
    const s = el("select");
    s.id = "ev-tipo";
    Object.keys(TIPOS_EV).forEach(function (k) {
      const o = el("option", "", TIPOS_EV[k]);
      o.value = k;
      s.appendChild(o);
    });
    l2.appendChild(s);
    f.appendChild(l2);
    const add = el("button", "primario", "Añadir evento");
    add.type = "submit";
    f.appendChild(add);
    elDetalle.appendChild(f);
  }

  // Los 7 días (lunes a domingo) de la semana que contiene a la fecha iso
  function semanaDe(iso) {
    const d = deIso(iso);
    const lun = d.getDate() - ((d.getDay() + 6) % 7);
    const out = [];
    for (let i = 0; i < 7; i++) out.push(isoDe(new Date(d.getFullYear(), d.getMonth(), lun + i)));
    return out;
  }
  // Publicaciones de un día sin contar las descartadas
  function activas(mapa, key) {
    return (mapa[key] || []).filter(function (it) { return it.est !== "descartada"; });
  }

  // Meta semanal: cuántas se publicaron y cuántas quedan planificadas esta
  // semana, más los días libres que quedan de hoy al domingo.
  function renderMeta(mapa, semana) {
    let meta = config.metaSemanal, plan = 0, pub = 0, libres = [];
    semana.forEach(function (k, i) {
      const a = activas(mapa, k);
      plan += a.length;
      a.forEach(function (it) { if (it.est === "publicada") pub++; });
      if (k >= hoyIso && !a.length) libres.push(DOW[i] + " " + deIso(k).getDate());
    });
    if (document.activeElement !== elMetaN) elMetaN.value = String(meta);
    const cumplida = meta > 0 && pub >= meta;
    if (meta > 0) {
      elMetaEstado.textContent = pub + " de " + meta + " publicadas esta semana (" + plan + " planificadas). " +
        (cumplida ? "✓ ¡Meta cumplida!" : plan >= meta ? "Ya planificaste suficientes: falta publicarlas." :
          "Te " + (meta - plan === 1 ? "falta 1 por planificar." : "faltan " + (meta - plan) + " por planificar."));
    } else {
      elMetaEstado.textContent = "Sin meta definida. Esta semana: " + plan + " planificada" + (plan === 1 ? "" : "s") + ", " + pub + " publicada" + (pub === 1 ? "" : "s") + ".";
    }
    elMetaEstado.classList.toggle("cumplida", cumplida);
    elMetaProg.hidden = meta === 0;
    elMetaProg.max = Math.max(meta, 1);
    elMetaProg.value = Math.min(pub, Math.max(meta, 1));
    elMetaLibres.textContent = libres.length
      ? "Días libres que quedan esta semana: " + libres.join(", ") + "."
      : "No quedan días libres esta semana.";
  }

  // Suma (o resta) días a una fecha ISO sin usar zonas horarias.
  function sumarDias(iso, n) { const d = deIso(iso); d.setDate(d.getDate() + n); return isoDe(d); }

  // Racha y cumplimiento. Solo lee:
  //   - racha: semanas seguidas con al menos la meta (o 1) publicada;
  //   - mejor racha histórica;
  //   - % de ideas con fecha hasta hoy que ya están publicadas.
  function renderRacha(mapa) {
    const objetivo = config.metaSemanal > 0 ? config.metaSemanal : 1;
    let pubSem = Object.create(null), primera = null, pasadas = 0, hechas = 0;
    Object.keys(mapa).forEach(function (k) {
      if (k.indexOf("__") === 0) return;
      const lun = semanaDe(k)[0];
      mapa[k].forEach(function (it) {
        if (it.est === "descartada") return;
        if (it.est === "publicada") {
          pubSem[lun] = (pubSem[lun] || 0) + 1;
          if (primera === null || lun < primera) primera = lun;
        }
        if (k <= hoyIso) { pasadas++; if (it.est === "publicada") hechas++; }
      });
    });
    function ok(lun) { return (pubSem[lun] || 0) >= objetivo; }
    let actual = semanaDe(hoyIso)[0], racha = 0, mejor = 0, corrida = 0;
    const enCurso = ok(actual);
    let cursor = enCurso ? actual : sumarDias(actual, -7);
    while (primera !== null && cursor >= primera && ok(cursor)) { racha++; cursor = sumarDias(cursor, -7); }
    if (primera !== null) {
      for (let c = primera; c <= actual; c = sumarDias(c, 7)) {
        if (ok(c)) { corrida++; if (corrida > mejor) mejor = corrida; } else { corrida = 0; }
      }
    }
    const req = objetivo === 1 ? "al menos 1 publicada" : objetivo + " publicadas";
    if (racha > 0) {
      elRachaEstado.textContent = "Racha: " + racha + " semana" + (racha === 1 ? "" : "s") + " seguida" + (racha === 1 ? "" : "s") +
        (enCurso ? " (con esta semana)." : ". Esta semana aún no llegas a " + req + ": publica para mantenerla.");
    } else {
      elRachaEstado.textContent = "Sin racha por ahora. Una semana cuenta con " + req + ".";
    }
    elRachaEstado.classList.toggle("cumplida", racha > 0 && enCurso);
    elRachaMejor.textContent = mejor > 0 ? "Mejor racha: " + mejor + " semana" + (mejor === 1 ? "" : "s") + "." : "";
    if (!pasadas) {
      elCumplProg.hidden = true;
      elCumplEstado.textContent = "Cumplimiento: aún no hay ideas con fecha hasta hoy para medirlo.";
    } else {
      const pct = Math.round(hechas * 100 / pasadas);
      elCumplProg.hidden = false;
      elCumplProg.value = pct;
      elCumplEstado.textContent = "Cumplimiento: " + pct + " % (" + hechas + " de " + pasadas + " ideas con fecha hasta hoy están publicadas).";
    }
  }

  // Lee el progreso de Ideas una sola vez por render (cacheDatos). Si se está
  // viendo un respaldo cargado, se usa ese en lugar del localStorage.
  let cacheDatos;   // undefined = sin leer en este render
  function leerDatos() {
    if (fuente) return fuente;
    if (cacheDatos !== undefined) return cacheDatos;
    try {
      const o = JSON.parse(localStorage.getItem(KEY));
      cacheDatos = o && typeof o === "object" ? o : null;
    } catch (e) { cacheDatos = null; }
    return cacheDatos;
  }

  // Devuelve { "AAAA-MM-DD": [ {num, texto, formato, est, fav, propia} ] }.
  // Es la lectura central del calendario: junta ideas base + propias, aplica el
  // estado y calcula cuáles están vencidas. Los totales van en __total/__venc.
  function recopilar() {
    const o = leerDatos() || {};
    const datos = o.datos && typeof o.datos === "object" && !Array.isArray(o.datos) ? o.datos : {};
    const hechas = Object.create(null);
    (Array.isArray(o.hechas) ? o.hechas : []).forEach(function (id) { hechas[String(id)] = true; });
    const ids = Object.keys(base);
    Object.keys(datos).forEach(function (id) { if (!base[id]) ids.push(id); });
    let mapa = {}, total = 0, vencidas = 0;
    ids.forEach(function (id) {
      const d = datos[id];
      if (!d || typeof d !== "object") return;
      if (d.borrada === true || !fechaValida(d.fecha)) return;
      const b = base[id];
      if (!b && d.propia !== true) return;
      const texto = typeof d.texto === "string" && d.texto.trim() ? d.texto : (b ? b.texto : "");
      if (!texto) return;
      const formato = FORMATOS.indexOf(d.formato) !== -1 ? d.formato : (b && FORMATOS.indexOf(b.formato) !== -1 ? b.formato : "Post");
      const est = hechas[id] ? "publicada" : (typeof d.estado === "string" && tiene(ESTADOS, d.estado) && d.estado !== "publicada" ? d.estado : "idea");
      // Vencida: fecha pasada y sin publicar ni descartar
      const venc = d.fecha < hoyIso && est !== "publicada" && est !== "descartada";
      if (venc) vencidas++;
      (mapa[d.fecha] = mapa[d.fecha] || []).push({
        id: id, num: b ? id : "", texto: partir(texto), formato: formato, est: est, venc: venc, fav: d.fav === true, propia: !b,
        redes: Object.keys(REDES).filter(function (k) { return Array.isArray(d.redes) && d.redes.indexOf(k) !== -1; })
      });
      total++;
    });
    mapa.__total = total;
    mapa.__venc = vencidas;
    return mapa;
  }

  function etiquetaDia(f, n) {
    return f.getDate() + " de " + MESES[f.getMonth()] + ": " + (n ? n + " publicación" + (n === 1 ? "" : "es") : "sin publicaciones");
  }

  // Redibuja todo el calendario: rejilla del mes, resumen, meta, racha, aviso y detalle.
  function render() {
    cacheDatos = undefined;   // una lectura nueva por render
    const mapa = recopilar();
    const semana = semanaDe(hoyIso);
    elTitulo.textContent = MESES[vistaM] + " " + vistaA;
    elGrid.textContent = "";
    DOW.forEach(function (h) { elGrid.appendChild(el("div", "cal-dow", h)); });

    const off = (new Date(vistaA, vistaM, 1).getDay() + 6) % 7;
    const dias = new Date(vistaA, vistaM + 1, 0).getDate();
    const celdas = Math.ceil((off + dias) / 7) * 7;
    const ym = vistaA + "-" + pad(vistaM + 1), tabKey = sel && sel.slice(0, 7) === ym ? sel : ym + "-01";
    for (let i = 0; i < celdas; i++) {
      const f = new Date(vistaA, vistaM, 1 - off + i);
      const key = isoDe(f);
      const lista = mapa[key] || [];
      const evs = eventosDe(key);
      const bk = bookishDe(key);
      const nv = lista.filter(function (it) { return it.venc; }).length;
      // Día libre: de hoy al domingo de esta semana, sin publicaciones (las descartadas no cuentan)
      const libre = semana.indexOf(key) !== -1 && key >= hoyIso && !activas(mapa, key).length;
      const b = el("button", "dia" + (libre ? " libre" : "") + (f.getMonth() !== vistaM ? " fuera" : "") + (key === hoyIso ? " hoy" : "") + (key === sel ? " sel" : "") + (nv ? " tiene-venc" : ""));
      b.type = "button";
      b.setAttribute("data-fecha", key);
      b.tabIndex = key === tabKey ? 0 : -1;
      b.setAttribute("aria-pressed", String(key === sel));
      b.setAttribute("aria-label", etiquetaDia(f, lista.length) + (evs.length ? ", " + evs.length + " evento" + (evs.length === 1 ? "" : "s") : "") + (nv ? " (" + nv + " vencida" + (nv === 1 ? "" : "s") + ")" : "") + (libre ? ", día libre" : "") + (bk ? ", " + bk[0] : ""));
      b.appendChild(el("span", "n", String(f.getDate())));
      if (libre) { const lt = el("span", "libre-tag", "libre"); lt.setAttribute("aria-hidden", "true"); b.appendChild(lt); }
      if (bk) { const st = el("span", "sug-tag", "✦ " + bk[0]); st.setAttribute("aria-hidden", "true"); b.appendChild(st); }
      const cupo = Math.max(0, 2 - Math.min(lista.length, 2));
      lista.slice(0, 2).forEach(function (it) {
        const e = el("span", "ev f-" + it.formato + (it.est === "publicada" ? " hecha" : "") + (it.venc ? " vencida" : ""), it.texto);
        e.setAttribute("data-est", it.est);
        e.setAttribute("aria-hidden", "true");
        b.appendChild(e);
      });
      evs.slice(0, cupo).forEach(function (ev) {
        const e2 = el("span", "ev evento", ev.titulo);
        e2.setAttribute("aria-hidden", "true");
        b.appendChild(e2);
      });
      const resto = lista.length + evs.length - Math.min(lista.length, 2) - Math.min(evs.length, cupo);
      if (resto > 0) b.appendChild(el("span", "mas", "+" + resto + " más"));
      if (lista.length || evs.length) {
        const pt = el("span", "puntos");
        pt.setAttribute("aria-hidden", "true");
        const pts = lista.slice(0, 6);
        pts.forEach(function (it) { pt.appendChild(el("span", "punto f-" + it.formato + (it.venc ? " vencida" : ""))); });
        evs.slice(0, 6 - pts.length).forEach(function () { pt.appendChild(el("span", "punto evento")); });
        b.appendChild(pt);
      }
      elGrid.appendChild(b);
    }

    // Resumen del mes
    let pref = vistaA + "-" + pad(vistaM + 1) + "-", n = 0, pub = 0;
    const porF = { Post: 0, Carrusel: 0, Reel: 0 };
    Object.keys(mapa).forEach(function (k) {
      if (k.indexOf(pref) !== 0) return;
      mapa[k].forEach(function (it) {
        n++;
        if (it.est === "publicada") pub++;
        if (it.est !== "descartada") porF[it.formato]++;   // el balance no cuenta las descartadas
      });
    });
    elResumen.textContent = mapa.__total
      ? "Este mes: " + n + " publicación" + (n === 1 ? "" : "es") + ", " + pub + " publicada" + (pub === 1 ? "" : "s") + "." + (fuente ? " (Mostrando un respaldo, solo lectura.)" : "")
      : "Todavía no hay ideas con fecha. Asigna una desde Ideas y aparecerá aquí.";

    if (mapa.__venc) elResumen.textContent += " Vencidas sin publicar: " + mapa.__venc + ".";

    if (n) {
      const pl = function (c, uno, varios) { return c + " " + (c === 1 ? uno : varios); };
      elResumen.textContent += " Balance: " + pl(porF.Carrusel, "carrusel", "carruseles") + ", " +
        pl(porF.Reel, "reel", "reels") + ", " + pl(porF.Post, "post", "posts") + ".";
    }

    renderMeta(mapa, semana);
    renderRacha(mapa);
    renderAvisoResp();
    renderDetalle(mapa);
  }

  // Lo que la persona está escribiendo en el detalle (título de evento, tipo, idea elegida) sobrevive a los render()
  let detalleSel = null;
  function tomarBorrador() {
    const t = elDetalle.querySelector("#ev-titulo"), tp = elDetalle.querySelector("#ev-tipo"), a = elDetalle.querySelector("#anadir-idea");
    if (!t && !a) return null;
    const ae = document.activeElement;
    return {
      dia: detalleSel,
      titulo: t ? t.value : "", tipo: tp ? tp.value : "", idea: a ? a.value : "",
      foco: ae && elDetalle.contains(ae) ? ae.id : ""
    };
  }
  function devolverBorrador(b) {
    if (!b || b.dia !== sel) return;   // si cambió el día, el borrador ya no corresponde
    const t = elDetalle.querySelector("#ev-titulo"), tp = elDetalle.querySelector("#ev-tipo"), a = elDetalle.querySelector("#anadir-idea");
    if (t && b.titulo) t.value = b.titulo;
    if (tp && b.tipo) tp.value = b.tipo;
    if (a && b.idea) a.value = b.idea;   // si la idea ya no está en la lista, queda en «Elige una idea…»
    const f = b.foco ? elDetalle.querySelector("#" + b.foco) : null;
    if (f) {
      f.focus({ preventScroll: true });
      if (f === t) { try { f.setSelectionRange(f.value.length, f.value.length); } catch (e) { /* sin acción */ } }
    }
  }

  function renderDetalle(mapa) {
    const borrador = tomarBorrador();
    elDetalle.textContent = "";
    if (!sel) {
      detalleSel = null;
      elDetalle.appendChild(el("p", "vacio-msg", "Toca un día para ver sus publicaciones."));
      return;
    }
    const f = deIso(sel);
    const titulo = f.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
elDetalle.appendChild(el("h3", "", titulo.charAt(0).toUpperCase() + titulo.slice(1)));
    const bkd = bookishDe(sel);
    if (bkd) {
      const pb = el("p", "det-bookish");
      pb.appendChild(el("strong", "", "✦ " + bkd[0] + ". "));
      pb.appendChild(document.createTextNode("Idea: " + bkd[1]));
      elDetalle.appendChild(pb);
    }
    const lista = mapa[sel] || [];
    if (!lista.length) {
      elDetalle.appendChild(el("p", "vacio-msg", "No hay publicaciones este día."));
    }
    lista.forEach(function (it) {
      const d = el("div", "det-item");
      d.setAttribute("data-est", it.est);
      if (it.venc) d.className += " vencida";
      d.appendChild(el("p", "", (it.num ? it.num + ". " : "") + it.texto));
      const m = el("div", "meta");
      m.appendChild(el("span", "chip formato-" + it.formato.toLowerCase(), it.formato));
      it.redes.forEach(function (k) { m.appendChild(el("span", "chip origen", REDES[k])); });
      m.appendChild(el("span", "chip origen", NOMBRES_EST[it.est]));
      if (it.venc) m.appendChild(el("span", "chip venc", "Vencida"));
      if (it.fav) m.appendChild(el("span", "chip origen", "♥ Favorita"));
      if (it.propia) m.appendChild(el("span", "chip propia", "Mía"));
      d.appendChild(m);
      // Controles de fecha: solo con tus datos (no al ver un respaldo)
      if (!fuente && window.BT && window.BT.almacen) {
        const fila = el("div", "det-fecha");
        const lab = el("label", "campo");
        lab.appendChild(el("span", "", "Fecha de publicación"));
        const inp = el("input");
        inp.type = "date";
        inp.value = sel;
        inp.min = "2000-01-01";
        inp.max = "2100-12-31";
        inp.setAttribute("data-cambiar", it.id);
        lab.appendChild(inp);
        fila.appendChild(lab);
        if (it.venc) {
          const bh = el("button", "btn-venc", "Mover a hoy");
          bh.type = "button";
          bh.setAttribute("data-mover", "hoy");
          bh.setAttribute("data-idea", it.id);
          fila.appendChild(bh);
          const b7 = el("button", "btn-venc", "+7 días");
          b7.type = "button";
          b7.title = "Una semana a partir de hoy";
          b7.setAttribute("data-mover", "7");
          b7.setAttribute("data-idea", it.id);
          fila.appendChild(b7);
        }
        const q = el("button", "btn-quitar", "Quitar fecha");
        q.type = "button";
        q.setAttribute("data-quitar", it.id);
        fila.appendChild(q);
        d.appendChild(fila);
      }
      elDetalle.appendChild(d);
    });
    if (!fuente && window.BT && window.BT.almacen) renderAnadir();
    renderEventosDia();
    detalleSel = sel;
    devolverBorrador(borrador);
  }

  // Fija el mes visible a partir de una fecha.
  function irA(f) { vistaA = f.getFullYear(); vistaM = f.getMonth(); }

  // Cambia de mes (+1 / -1) y descarta el día seleccionado si cae fuera.
  function mover(delta) {
    const f = new Date(vistaA, vistaM + delta, 1);
    irA(f);
    if (sel && (deIso(sel).getMonth() !== vistaM || deIso(sel).getFullYear() !== vistaA)) sel = null;
    render();
  }
  document.getElementById("mes-ant").addEventListener("click", function () { mover(-1); });
  document.getElementById("mes-sig").addEventListener("click", function () { mover(1); });
  document.getElementById("mes-hoy").addEventListener("click", function () {
    hoyIso = isoDe(new Date());
    sel = hoyIso;
    irA(new Date());
    render();
  });

  // Clic en un día: se selecciona, se abre su detalle y (en móvil) se baja hasta él.
  elGrid.addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest(".dia") : null;
    if (!b) return;
    sel = b.getAttribute("data-fecha");
    irA(deIso(sel));
    render();
    const nuevo = elGrid.querySelector('[data-fecha="' + sel + '"]');
    if (nuevo) nuevo.focus({ preventScroll: true });
    anunciarDia();
    if (movil && movil.matches) elDetalle.scrollIntoView({ block: "start" });
  });

  // Cambiar o quitar la fecha de una idea desde el detalle del día
  function aplicarFecha(id, fecha) {
    const previa = sel;
    ofrecerDeshacer(null);
    const r = window.BT.almacen.guardarFecha(id, fecha);
    if (!r.ok) {
      elMsgFecha.textContent = r.mensaje;
      render();
      return;
    }
    if (!r.cambio) { elMsgFecha.textContent = "No hubo cambios."; return; }
    if (fecha) {
      sel = fecha;                 // sigue a la publicación hasta su nuevo día
      irA(deIso(fecha));
      ofrecerDeshacer(function () { aplicarFecha(id, previa); });
      elMsgFecha.textContent = "Fecha cambiada al " + deIso(fecha).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) + "." + NOTA_SYNC;
    } else {
      elMsgFecha.textContent = "Fecha quitada: la idea ya no aparece en el calendario." + NOTA_SYNC;
      ofrecerDeshacer(function () { aplicarFecha(id, previa); });
    }
    render();
    const nuevo = elDetalle.querySelector('[data-cambiar="' + id + '"]');
    if (nuevo) nuevo.focus({ preventScroll: true });
  }

  // Añadir al día seleccionado una idea que todavía no tiene fecha
  function anadirIdea(id) {
    const dia = sel;
    ofrecerDeshacer(null);
    const r = window.BT.almacen.guardarFecha(id, dia);
    if (!r.ok) { elMsgFecha.textContent = r.mensaje; render(); return; }
    elMsgFecha.textContent = "Idea añadida al " + deIso(dia).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) + "." + NOTA_SYNC;
    ofrecerDeshacer(function () {
      const q = window.BT.almacen.guardarFecha(id, "");
      elMsgFecha.textContent = q.ok ? "Fecha quitada: la idea vuelve a estar sin fecha." : q.mensaje;
      render();
    });
    render();
    const nuevo = elDetalle.querySelector('[data-cambiar="' + id + '"]');
    if (nuevo) nuevo.focus({ preventScroll: true });
  }
  elDetalle.addEventListener("change", function (e) {
    const t = e.target;
    const id = t.getAttribute && t.getAttribute("data-cambiar");
    if (!id) return;
    if (!t.value) { render(); return; }   // campo vaciado a mano: para quitar la fecha está el botón
    aplicarFecha(id, t.value);
  });

  // Eventos propios: añadir (también con Enter) y borrar (con deshacer)
  elDetalle.addEventListener("submit", function (e) {
    e.preventDefault();
    const inp = e.target.querySelector("#ev-titulo"), tipo = e.target.querySelector("#ev-tipo");
    ofrecerDeshacer(null);
    const t = inp.value.replace(/\s+/g, " ").trim().slice(0, MAX_TIT_EV);
    if (!t) { elMsgFecha.textContent = "Escribe el título del evento."; inp.focus(); return; }
    if (eventos.length >= MAX_EV) { elMsgFecha.textContent = "Llegaste al límite de " + MAX_EV + " eventos. Borra alguno para añadir otro."; return; }
    eventos.push({ id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), fecha: sel, titulo: t, tipo: tiene(TIPOS_EV, tipo.value) ? tipo.value : "otro" });
    if (!guardarEventos(eventos)) { eventos.pop(); elMsgFecha.textContent = "No se pudo guardar el evento en el navegador."; return; }
    elMsgFecha.textContent = "Evento añadido.";
    inp.value = "";
    render();
    const nuevo = elDetalle.querySelector("#ev-titulo");
    if (nuevo) nuevo.focus({ preventScroll: true });
  });
  function borrarEvento(id) {
    const antes = eventos.slice();
    const quitado = eventos.filter(function (x) { return x.id === id; })[0];
    eventos = eventos.filter(function (x) { return x.id !== id; });
    if (!guardarEventos(eventos)) { eventos = antes; elMsgFecha.textContent = "No se pudo borrar el evento."; return; }
    elMsgFecha.textContent = "Evento borrado.";
    ofrecerDeshacer(function () {
      if (quitado && !eventos.some(function (x) { return x.id === id; })) { eventos.push(quitado); guardarEventos(eventos); }
      elMsgFecha.textContent = "Evento restaurado.";
      render();
    });
    render();
  }

  // Un solo manejador de clics para todos los botones del detalle del día
  elDetalle.addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest("button") : null;
    if (!b || !elDetalle.contains(b)) return;
    if (b.hasAttribute("data-anadir")) {
      const s = elDetalle.querySelector("#anadir-idea");
      if (!s || !s.value) { elMsgFecha.textContent = "Elige primero una idea de la lista."; if (s) s.focus(); return; }
      anadirIdea(s.value);
    } else if (b.hasAttribute("data-mover")) {
      const h = new Date();   // fecha de hoy al momento del toque
      if (b.getAttribute("data-mover") === "7") h.setDate(h.getDate() + 7);
      aplicarFecha(b.getAttribute("data-idea"), isoDe(h));
    } else if (b.hasAttribute("data-quitar")) {
      aplicarFecha(b.getAttribute("data-quitar"), "");
    } else if (b.hasAttribute("data-borrar-ev")) {
      borrarEvento(b.getAttribute("data-borrar-ev"));
    }
  });

  // Meta semanal: se guarda al cambiar el número
  elMetaN.addEventListener("change", function () {
    const v = elMetaN.value.trim();
    const n = v === "" ? 0 : Number(v);
    if (!metaValida(n)) {
      elMetaMsg.textContent = "Escribe un número entero entre 0 y " + META_MAX + ".";
      elMetaN.value = String(config.metaSemanal);
      return;
    }
    config.metaSemanal = n;
    elMetaMsg.textContent = guardarConfig(config)
      ? (n ? "Meta guardada: " + n + " por semana." : "Meta quitada.")
      : "No se pudo guardar la meta en el navegador.";
    render();
  });

  // Respaldo solo para ver
  document.getElementById("importar").addEventListener("change", function (ev) {
    const input = ev.target, archivo = input.files && input.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function () {
      let o = null;
      try { o = JSON.parse(lector.result); } catch (err) { o = null; }
      const ok = o && typeof o === "object" && !Array.isArray(o) && o.version === 1 && (Array.isArray(o.hechas) || (o.datos && typeof o.datos === "object"));
      input.value = "";
      if (!ok) { elMsg.textContent = "El archivo no parece un respaldo de Ideas. No se cambió nada."; return; }
      fuente = o;
      btnVolver.hidden = false;
      elMsg.textContent = "Mostrando el respaldo. Tu progreso no se modificó.";
      render();
    };
    lector.onerror = function () { elMsg.textContent = "No se pudo leer el archivo."; input.value = ""; };
    lector.readAsText(archivo);
  });
  btnVolver.addEventListener("click", function () {
    fuente = null;
    btnVolver.hidden = true;
    elMsg.textContent = "Mostrando tus datos.";
    render();
  });

  // Se actualiza si cambian los datos en otra pestaña o al volver a esta
  window.addEventListener("storage", function (e) { if (e.key === null || e.key === KEY || e.key === KEY_CFG || e.key === KEY_EV || e.key === KEY_RESP) { config = leerConfig(); eventos = leerEventos(); render(); } });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { hoyIso = isoDe(new Date()); render(); }
  });
  // Los enlaces de «En esta página» abren el panel plegable al que saltan
  const tocNav = document.getElementById("toc");
  if (tocNav) {
    tocNav.addEventListener("click", function (e) {
      const a = e.target.closest ? e.target.closest("a") : null;
      const t = a ? document.getElementById(a.getAttribute("href").slice(1)) : null;
      if (t && t.tagName === "DETAILS") t.open = true;
    });
  }
  document.getElementById("ver-bookish").addEventListener("change", function (e) {
    verBookish = e.target.checked;
    render();
  });
  elGrid.addEventListener("keydown", function (e) {
    // Flechas: mueven el día seleccionado (una sola casilla en el orden de tabulación).
    const b = e.target.closest ? e.target.closest(".dia") : null;
    const paso = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!b || !paso) return;
    e.preventDefault();
    sel = sumarDias(b.getAttribute("data-fecha"), paso);
    irA(deIso(sel));
    render();
    const n = elGrid.querySelector('[data-fecha="' + sel + '"]');
    if (n) n.focus();
    anunciarDia();
  });
  ["mes-ant", "mes-sig", "mes-hoy"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function () { anunciar(elTitulo.textContent); });
  });
  // «Hoy» se refresca solo al pasar la medianoche
  function programarMedianoche() {
    const n = new Date();
    setTimeout(function () {
      const h = isoDe(new Date());
      if (h !== hoyIso) { if (sel === hoyIso) sel = h; hoyIso = h; render(); }
      programarMedianoche();
    }, new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5) - n);
  }
  programarMedianoche();
  // Respaldo aparte de eventos y meta
  const elMsgCal = document.getElementById("msg-cal");
  document.getElementById("aviso-resp-btn").addEventListener("click", function () { document.getElementById("exp-cal").click(); });
  document.getElementById("exp-cal").addEventListener("click", function () {
    const blob = new Blob([JSON.stringify({ tipo: "calendario", version: 1, metaSemanal: config.metaSemanal, eventos: eventos }, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.download = "calendario_eventos_y_meta.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
    marcarResp("respaldo");
    renderAvisoResp();
    elMsgCal.textContent = "Descargado: " + eventos.length + " evento" + (eventos.length === 1 ? "" : "s") + " y meta de " + config.metaSemanal + ".";
  });
  document.getElementById("imp-cal").addEventListener("change", function (ev) {
    const input = ev.target, f = input.files && input.files[0];
    if (!f) return;
    const lector = new FileReader();
    lector.onload = function () {
      let o = null;
      try { o = JSON.parse(lector.result); } catch (err) { o = null; }
      input.value = "";
      if (!o || o.tipo !== "calendario" || o.version !== 1) { elMsgCal.textContent = "El archivo no es un respaldo de eventos y meta. No se cambió nada."; return; }
      let nuevos = leerEventos({ eventos: o.eventos }).filter(function (x) { return !eventos.some(function (y) { return y.id === x.id; }); });
      nuevos = nuevos.slice(0, Math.max(0, MAX_EV - eventos.length));
      const antes = eventos.slice();
      eventos = eventos.concat(nuevos);
      if (!guardarEventos(eventos)) { eventos = antes; elMsgCal.textContent = "No se pudo guardar en el navegador."; return; }
      if (metaValida(o.metaSemanal)) { config.metaSemanal = o.metaSemanal; guardarConfig(config); }
      elMsgCal.textContent = "Importados " + nuevos.length + " evento" + (nuevos.length === 1 ? "" : "s") + " nuevos" + (metaValida(o.metaSemanal) ? " y la meta semanal." : ".");
      render();
    };
    lector.readAsText(f);
  });
  // Menú «En esta página»: marca la sección visible
  const enlacesToc = [].slice.call(document.querySelectorAll("#toc a"));
  function espiarToc() {
    let linea = window.innerHeight * 0.3, act = null;
    enlacesToc.forEach(function (a) {
      const t = document.getElementById(a.getAttribute("href").slice(1));
      if (t && t.getClientRects().length && t.getBoundingClientRect().top <= linea) act = a;
    });
    enlacesToc.forEach(function (a) { if (a === act) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  }
  window.addEventListener("scroll", espiarToc, { passive: true });
  render();
  espiarToc();
}
