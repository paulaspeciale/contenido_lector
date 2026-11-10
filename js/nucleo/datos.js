/* ==========================================================================
   datos.js · Cargador común de datos.

   Se carga ANTES de js/paginas/ideas/main.js, almacen.js y js/paginas/calendario/main.js. Hace fetch
   de datos-ideas.json y datos-bingo.json, los valida y los deja congelados en:
     - window.BT.SECCIONES  (ideas, para Ideas y Calendario)
     - window.BT.BINGO     (retos del Bingo)
   Además expone window.BT.listo, una promesa que SIEMPRE se resuelve con
   { ok, errores }: así cada página decide qué mostrar si algo falló, sin
   quedarse colgada.

   Cada página pide solo lo que usa con el atributo data-usa:
     <script src="js/nucleo/datos.js" data-usa="ideas"></script>
     <script src="js/nucleo/datos.js" data-usa="bingo"></script>
     <script src="js/nucleo/datos.js" data-usa="ideas,bingo"></script>

   Nota: requiere abrir la web desde un servidor (hosting o servidor local),
   no con file://, porque fetch no puede leer archivos locales.
   ========================================================================== */
(function () {
  "use strict";
  window.BT = window.BT || {};

  const FORMATOS = ["Post", "Carrusel", "Reel"];
  const MAX_TEXTO = 400, MAX_TITULO = 120, MAX_ID = 40;

  // Los JSON viven en /datos/, dos niveles por encima de js/nucleo/.
  const actual = document.currentScript;
  const base = actual && actual.src ? new URL("../../datos/", actual.src).href : "datos/";

  function esObjeto(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
  function esTexto(t, max) { return typeof t === "string" && t.trim().length > 0 && t.length <= max; }

  // Congela el objeto y todo lo que contiene: si algún script intenta modificarlo,
  // falla en modo estricto en vez de corromper los datos compartidos.
  function congelar(o) {
    if (o && typeof o === "object" && !Object.isFrozen(o)) {
      Object.freeze(o);
      Object.keys(o).forEach(function (k) { congelar(o[k]); });
    }
    return o;
  }

  // Pide un JSON relativo a la carpeta de este script y lo convierte a objeto.
  function pedir(nombre) {
    return fetch(base + nombre, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(nombre + ": respuesta " + r.status);
      return r.json();
    });
  }

  // Devuelve la lista de secciones validada o lanza un error con el motivo.
  // Se comprueba la forma mínima: versión, títulos, ideas con id/texto/formato
  // y que no haya ids repetidos (el progreso guardado depende de ellos).
  function validarIdeas(d) {
    if (!esObjeto(d) || d.version !== 1 || !Array.isArray(d.secciones) || !d.secciones.length) {
      throw new Error("datos-ideas.json: formato no reconocido");
    }
    const ids = Object.create(null);
    d.secciones.forEach(function (s, i) {
      if (!esObjeto(s) || !esTexto(s.titulo, MAX_TITULO) || !Array.isArray(s.ideas)) {
        throw new Error("datos-ideas.json: sección " + (i + 1) + " no válida");
      }
      s.ideas.forEach(function (idea, j) {
        const donde = "sección " + (i + 1) + ", idea " + (j + 1);
        if (!esObjeto(idea) || !esTexto(idea.id, MAX_ID) || !esTexto(idea.texto, MAX_TEXTO) || FORMATOS.indexOf(idea.formato) === -1) {
          throw new Error("datos-ideas.json: " + donde + " no válida");
        }
        if (ids[idea.id]) throw new Error("datos-ideas.json: id repetido (" + idea.id + ")");
        ids[idea.id] = true;
      });
    });
    return d.secciones;
  }

  // Valida la tarjeta de Bingo: 5×5 con 24 retos y un texto de casilla libre.
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

  // Cada página pide solo lo que usa: <script src="js/nucleo/datos.js" data-usa="ideas,bingo">
  const usa = ((actual && actual.getAttribute("data-usa")) || "ideas").split(",").map(function (s) { return s.trim(); });
  const errores = [];

  // Carga un JSON, lo valida y lo publica en window.BT[destino]. Los errores no
  // rompen la promesa: se acumulan en «errores» para que la página los muestre.
  function cargar(nombre, validar, destino) {
    return pedir(nombre).then(function (d) {
      window.BT[destino] = congelar(validar(d));
    }).catch(function (e) {
      errores.push(e && e.message ? e.message : nombre + ": no se pudo cargar");
    });
  }

  const tareas = [];
  if (usa.indexOf("ideas") !== -1) tareas.push(cargar("datos-ideas.json", validarIdeas, "SECCIONES"));
  if (usa.indexOf("bingo") !== -1) tareas.push(cargar("datos-bingo.json", validarBingo, "BINGO"));

  window.BT.listo = Promise.all(tareas).then(function () {
    window.BT.errorDatos = errores.length ? errores.join(" · ") : "";
    return { ok: errores.length === 0, errores: errores };
  });
})();
