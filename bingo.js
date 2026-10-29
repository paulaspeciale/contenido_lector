/* bingo.js · Tarjeta de Bingo lector 2027.
   Para cambiar los retos, edita SOLO la lista RETOS (25 casillas; la 13.ª, la del centro, es el espacio libre).
   Guarda en localStorage["bingo_2027_v1"] la lista de casillas marcadas. */
(function () {
  "use strict";
  var KEY = "bingo_2027_v1";
  var LIBRE = 12;   // índice de la casilla central (0 a 24)
  var RETOS = [
    "Relectura", "Doble POV", "Autor o autora nueva", "Libro de Pinterest", "Romance deportivo",
    "Portada de mi color favorito", "Lectura compartida", "Libro escrito por un hombre", "Leer un día de lluvia", "Novedad editorial",
    "Leer una novela corta", "Más de 500 páginas", null, "Comparte inicial con el autor o autora", "Lectura de temporada",
    "Género nuevo", "Título de dos palabras", "Terminar una saga", "Libro de la infancia", "Mi trope favorito",
    "Intercambio de libros", "Libro elegido por una amiga", "Juzgar un libro por su portada", "Terminar un libro en un día", "Libro 5 estrellas de un booktuber"
  ];
  var LINEAS = [];
  var i, j, f, c;
  for (f = 0; f < 5; f++) { var fila = [], col = []; for (c = 0; c < 5; c++) { fila.push(f * 5 + c); col.push(c * 5 + f); } LINEAS.push(fila, col); }
  LINEAS.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);

  var elGrid = document.getElementById("bingo-grid");
  var elEstado = document.getElementById("bingo-estado");
  var elProg = document.getElementById("bingo-prog");
  var elDlg = document.getElementById("dialogo");
  var marcadas = {};
  var botones = [];

  function leer() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(a)) a.forEach(function (n) { if (Number.isInteger(n) && n >= 0 && n < 25 && n !== LIBRE) marcadas[n] = true; });
    } catch (e) { /* sin datos o dañados: se empieza en blanco */ }
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(Object.keys(marcadas).map(Number))); return true; }
    catch (e) { return false; }
  }
  function activa(n) { return n === LIBRE || !!marcadas[n]; }

  function pintar() {
    var hechos = Object.keys(marcadas).length, bingos = 0, enLinea = {};
    LINEAS.forEach(function (l) {
      if (l.every(activa)) { bingos++; l.forEach(function (n) { enLinea[n] = true; }); }
    });
    botones.forEach(function (b, n) {
      if (n === LIBRE) { b.classList.toggle("linea", !!enLinea[n]); return; }
      b.setAttribute("aria-pressed", String(!!marcadas[n]));
      b.classList.toggle("linea", !!enLinea[n]);
    });
    elProg.max = 24;
    elProg.value = hechos;
    elEstado.textContent = hechos + " de 24 retos completados. " +
      (bingos ? "🎉 ¡Bingo! Tienes " + bingos + " línea" + (bingos === 1 ? "" : "s") + " completa" + (bingos === 1 ? "" : "s") + "." :
        hechos === 24 ? "" : "Aún no tienes ninguna línea completa.") +
      (hechos === 24 ? " ¡Tarjeta completa!" : "");
    elEstado.classList.toggle("hay-bingo", bingos > 0);
  }

  RETOS.forEach(function (txt, n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "bingo-casilla";
    if (n === LIBRE) {
      b.className += " libre";
      b.textContent = "Espacio libre";
      b.disabled = true;
    } else {
      b.textContent = txt;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (marcadas[n]) delete marcadas[n]; else marcadas[n] = true;
        if (!guardar()) elEstado.textContent = "⚠ No se pudo guardar en el navegador: tu progreso se perderá al cerrar la página.";
        else pintar();
      });
    }
    botones.push(b);
    elGrid.appendChild(b);
  });

  // Reiniciar con confirmación
  document.getElementById("bingo-reiniciar").addEventListener("click", function () {
    if (!Object.keys(marcadas).length) return;
    try { elDlg.showModal(); } catch (e) { if (window.confirm("¿Desmarcar todas las casillas?")) { marcadas = {}; guardar(); pintar(); } }
  });
  document.getElementById("dialogo-no").addEventListener("click", function () { elDlg.close(); });
  document.getElementById("dialogo-si").addEventListener("click", function () {
    elDlg.close();
    marcadas = {};
    guardar();
    pintar();
  });

  window.addEventListener("storage", function (e) {
    if (e.key === KEY || e.key === null) { marcadas = {}; leer(); pintar(); }
  });

  leer();
  pintar();
})();
