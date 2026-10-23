/* almacen.js · Escritura segura de datos de Ideas desde otras páginas (por ahora, el Calendario).
   Se carga DESPUÉS de datos-ideas.js. Expone window.BT.almacen.guardarFecha(id, fecha).

   Sigue las mismas reglas que app.js para no romper nada:
   - Solo cambia datos[id].fecha; el resto del respaldo se conserva tal cual.
   - Sube la marca mod[id] con el reloj híbrido, para que la sincronización con la nube respete el cambio.
   - Actualiza ultimoCambio en ideas_post_90_meta (aviso de respaldo).
   - No escribe si no hay datos o están dañados, ni si la idea no existe o está borrada. */
(function () {
  "use strict";
  window.BT = window.BT || {};

  var KEY = "ideas_post_90_v1";
  var KEY_META = "ideas_post_90_meta";
  var CUSTOM_RE = /^c[a-z0-9]{6,24}$/;   // ids de las ideas propias (igual que en app.js)
  var FECHA_MIN = "2000-01-01", FECHA_MAX = "2100-12-31";

  function falla(motivo, mensaje) { return { ok: false, motivo: motivo, mensaje: mensaje }; }
  function esObjeto(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
  function marcaValida(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : 0; }

  function fechaAceptable(v) {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    var p = v.split("-").map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    var real = d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
    return real && v >= FECHA_MIN && v <= FECHA_MAX;
  }

  function hayDatosBase() {
    var secs = (window.BT && window.BT.SECCIONES) || [];
    return secs.length > 0;
  }

  function esBase(id) {
    var secs = (window.BT && window.BT.SECCIONES) || [];
    for (var i = 0; i < secs.length; i++) {
      var ideas = secs[i].ideas || [];
      for (var j = 0; j < ideas.length; j++) {
        if (String(ideas[j].id) === id) return true;
      }
    }
    return false;
  }

  function leerMeta() {
    try {
      var m = JSON.parse(localStorage.getItem(KEY_META));
      return esObjeto(m) ? m : {};
    } catch (e) { return {}; }
  }

  // Misma regla que prepararMarcas() de app.js: las ideas sin marca reciben la fecha del último
  // cambio anterior (o del último respaldo; o 1). Se hace ANTES de actualizar ultimoCambio, para que
  // las ideas antiguas no pasen a tener una marca "de hoy" y le ganen a la copia de la nube.
  function marcaBase(meta) {
    var b = 0;
    if (typeof meta.ultimoCambio === "string") b = Date.parse(meta.ultimoCambio) || 0;
    if (!b && typeof meta.ultimoRespaldo === "string") b = Date.parse(meta.ultimoRespaldo) || 0;
    return b || 1;
  }

  // Cambia (o quita, con "" / null) la fecha de publicación de una idea.
  // Devuelve { ok: true, cambio, fecha, mod } o { ok: false, motivo, mensaje }.
  function guardarFecha(id, fecha) {
    id = String(id);
    if (fecha === null || fecha === undefined) fecha = "";
    if (fecha !== "" && !fechaAceptable(fecha)) {
      return falla("fecha-invalida", "Fecha no válida: usa AAAA-MM-DD con un año entre 2000 y 2100.");
    }
    if (!hayDatosBase()) return falla("sin-datos-base", "Falta cargar datos-ideas.js antes de almacen.js.");

    var crudo;
    try { crudo = localStorage.getItem(KEY); } catch (e) { return falla("sin-almacen", "El navegador no permite acceder al almacenamiento."); }
    if (crudo === null) return falla("vacio", "Todavía no hay progreso guardado. Abre Ideas una vez primero.");

    var o;
    try { o = JSON.parse(crudo); } catch (e) { return falla("danado", "Los datos guardados están dañados; no se escribió nada."); }
    var formatoOk = esObjeto(o) && (Array.isArray(o.hechas) || esObjeto(o.datos));
    if (!formatoOk || (o.datos !== undefined && !esObjeto(o.datos))) {
      return falla("danado", "Los datos guardados están dañados; no se escribió nada.");
    }

    var base = esBase(id);
    if (!base && !CUSTOM_RE.test(id)) return falla("id-invalido", "Esa idea no existe.");
    if (!esObjeto(o.datos)) o.datos = {};
    var d = o.datos[id];
    if (!base && !(esObjeto(d) && d.propia === true)) return falla("idea-no-existe", "No se encontró esa idea propia.");
    if (esObjeto(d) && d.borrada === true) return falla("borrada", "Esa idea está borrada. Restáurala desde Ideas.");

    var actual = esObjeto(d) && typeof d.fecha === "string" ? d.fecha : "";
    if (actual === fecha) return { ok: true, cambio: false, fecha: fecha };

    // 1) Cambiar solo la fecha
    var nuevo = esObjeto(d) ? d : {};
    if (fecha) { nuevo.fecha = fecha; } else { delete nuevo.fecha; }
    if (Object.keys(nuevo).length) { o.datos[id] = nuevo; } else { delete o.datos[id]; }

    // 2) Marcas de modificación
    if (!esObjeto(o.mod)) o.mod = {};
    var meta = leerMeta();
    var baseMarca = marcaBase(meta);
    var conDatos = Object.keys(o.datos);
    if (Array.isArray(o.hechas)) {
      o.hechas.forEach(function (h) { h = String(h); if (esBase(h) && conDatos.indexOf(h) === -1) conDatos.push(h); });
    }
    conDatos.forEach(function (k) { if (!marcaValida(o.mod[k])) o.mod[k] = baseMarca; });
    if (Array.isArray(o.sets) && o.sets.length && !marcaValida(o.modSets)) o.modSets = baseMarca;

    var maxVisto = marcaValida(o.modSets);
    Object.keys(o.mod).forEach(function (k) { if (marcaValida(o.mod[k]) > maxVisto) maxVisto = o.mod[k]; });
    var marca = Math.max(Date.now(), marcaValida(o.mod[id]) + 1, maxVisto + 1);   // reloj híbrido, igual que app.js
    o.mod[id] = marca;

    // 3) Guardar (si falla, no se toca nada más)
    try { localStorage.setItem(KEY, JSON.stringify(o)); }
    catch (e) { return falla("no-se-pudo-guardar", "No se pudo guardar en el navegador (¿sin espacio?)."); }

    // 4) Meta: ultimoCambio (el respaldo anterior se conserva)
    meta.ultimoCambio = new Date().toISOString();
    try { localStorage.setItem(KEY_META, JSON.stringify(meta)); } catch (e) { /* no es crítico */ }

    return { ok: true, cambio: true, fecha: fecha, mod: marca };
  }

  window.BT.almacen = { guardarFecha: guardarFecha, fechaAceptable: fechaAceptable };
})();
