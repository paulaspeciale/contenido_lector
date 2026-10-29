/* datos.js · Cargador de datos. Se carga ANTES de app.js, almacen.js y del calendario.
   Hace fetch de datos-ideas.json y datos-bingo.json, los valida y rellena
   window.BT.SECCIONES y window.BT.BINGO. Expone window.BT.listo, una promesa que SIEMPRE se
   resuelve con { ok, errores }: así cada página decide qué mostrar si algo falló.
   Los datos quedan congelados (Object.freeze) para que ningún código los altere por accidente.
   Nota: requiere abrir la web desde un servidor (hosting o servidor local), no con file://. */
(function () {
  "use strict";
  window.BT = window.BT || {};

  var FORMATOS = ["Post", "Carrusel", "Reel"];
  var MAX_TEXTO = 400, MAX_TITULO = 120, MAX_ID = 40;

  // Carpeta de este script: los JSON viven junto a él
  var actual = document.currentScript;
  var base = actual && actual.src ? actual.src.replace(/[^\/?#]*(?:[?#].*)?$/, "") : "";

  function esObjeto(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
  function esTexto(t, max) { return typeof t === "string" && t.trim().length > 0 && t.length <= max; }

  function congelar(o) {
    if (o && typeof o === "object" && !Object.isFrozen(o)) {
      Object.freeze(o);
      Object.keys(o).forEach(function (k) { congelar(o[k]); });
    }
    return o;
  }

  function pedir(nombre) {
    return fetch(base + nombre, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(nombre + ": respuesta " + r.status);
      return r.json();
    });
  }

  // Devuelve la lista de secciones validada o lanza un error con el motivo.
  function validarIdeas(d) {
    if (!esObjeto(d) || d.version !== 1 || !Array.isArray(d.secciones) || !d.secciones.length) {
      throw new Error("datos-ideas.json: formato no reconocido");
    }
    var ids = Object.create(null);
    d.secciones.forEach(function (s, i) {
      if (!esObjeto(s) || !esTexto(s.titulo, MAX_TITULO) || !Array.isArray(s.ideas)) {
        throw new Error("datos-ideas.json: sección " + (i + 1) + " no válida");
      }
      s.ideas.forEach(function (idea, j) {
        var donde = "sección " + (i + 1) + ", idea " + (j + 1);
        if (!esObjeto(idea) || !esTexto(idea.id, MAX_ID) || !esTexto(idea.texto, MAX_TEXTO) || FORMATOS.indexOf(idea.formato) === -1) {
          throw new Error("datos-ideas.json: " + donde + " no válida");
        }
        if (ids[idea.id]) throw new Error("datos-ideas.json: id repetido (" + idea.id + ")");
        ids[idea.id] = true;
      });
    });
    return d.secciones;
  }

  function validarBingo(d) {
    if (!esObjeto(d) || d.version !== 1 || !esTexto(d.titulo, MAX_TITULO) || d.tamano !== 5 ||
        !esTexto(d.libre, MAX_TITULO) || !Array.isArray(d.retos) || d.retos.length !== d.tamano * d.tamano - 1) {
      throw new Error("datos-bingo.json: formato no reconocido (se esperan 24 retos)");
    }
    d.retos.forEach(function (r, i) {
      if (!esTexto(r, MAX_TITULO)) throw new Error("datos-bingo.json: reto " + (i + 1) + " no válido");
    });
    return { titulo: d.titulo, tamano: d.tamano, libre: d.libre, retos: d.retos };
  }

  // Cada página pide solo lo que usa: <script src="datos.js" data-usa="ideas,bingo">
  var usa = ((actual && actual.getAttribute("data-usa")) || "ideas").split(",").map(function (s) { return s.trim(); });
  var errores = [];

  function cargar(nombre, validar, destino) {
    return pedir(nombre).then(function (d) {
      window.BT[destino] = congelar(validar(d));
    }).catch(function (e) {
      errores.push(e && e.message ? e.message : nombre + ": no se pudo cargar");
    });
  }

  var tareas = [];
  if (usa.indexOf("ideas") !== -1) tareas.push(cargar("datos-ideas.json", validarIdeas, "SECCIONES"));
  if (usa.indexOf("bingo") !== -1) tareas.push(cargar("datos-bingo.json", validarBingo, "BINGO"));

  window.BT.listo = Promise.all(tareas).then(function () {
    window.BT.errorDatos = errores.length ? errores.join(" · ") : "";
    return { ok: errores.length === 0, errores: errores };
  });
})();
