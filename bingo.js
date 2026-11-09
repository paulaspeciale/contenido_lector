/* ==========================================================================
   bingo.js · Tarjeta de Bingo lector 2027.

   - Construye la cuadrícula de 5×5 a partir de datos-bingo.json (lo carga
     datos.js en window.BT.BINGO). Si el JSON no carga, usa RESPALDO.
   - El espacio libre va siempre en el centro (índice 12).
   - Guarda en localStorage["bingo_2027_v1"] un array con los índices de las
     casillas marcadas. No guarda las casillas vacías.
   - Calcula líneas completas (filas, columnas y diagonales) y muestra el estado.
   Para cambiar los retos, edita datos-bingo.json (24 retos).
   ========================================================================== */
(function () {
  "use strict";
  const KEY = "bingo_2027_v1";
  const LIBRE = 12;   // índice de la casilla central (0 a 24)
  // Los retos viven en datos-bingo.json (los carga datos.js). Esta lista solo es el respaldo si el JSON no carga.
  const RESPALDO = ["Relectura", "Doble POV", "Autor o autora nueva", "Libro de Pinterest", "Romance deportivo",
    "Portada de mi color favorito", "Lectura compartida", "Libro escrito por un hombre", "Leer un día de lluvia", "Novedad editorial",
    "Leer una novela corta", "Más de 500 páginas", "Comparte inicial con el autor o autora", "Lectura de temporada",
    "Género nuevo", "Título de dos palabras", "Terminar una saga", "Libro de la infancia", "Mi trope favorito",
    "Intercambio de libros", "Libro elegido por una amiga", "Juzgar un libro por su portada", "Terminar un libro en un día", "Libro 5 estrellas de un booktuber"];
  let RETOS = [], TXT_LIBRE = "Espacio libre";
  // Líneas ganadoras: 5 filas, 5 columnas y 2 diagonales (arrays de índices 0..24).
  const LINEAS = [];
  let i, j, f, c;
  for (f = 0; f < 5; f++) { const fila = [], col = []; for (c = 0; c < 5; c++) { fila.push(f * 5 + c); col.push(c * 5 + f); } LINEAS.push(fila, col); }
  LINEAS.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);

  // Prepara los retos (JSON o respaldo) y monta la tarjeta.
  function iniciar() {
    const B = window.BT && window.BT.BINGO;
    const lista = B && B.retos && B.retos.length === 24 ? Array.prototype.slice.call(B.retos) : RESPALDO.slice();
    if (B && B.libre) TXT_LIBRE = B.libre;
    lista.splice(LIBRE, 0, null);
    RETOS = lista;
  const elGrid = document.getElementById("bingo-grid");
  const elEstado = document.getElementById("bingo-estado");
  const elProg = document.getElementById("bingo-prog");
  const elDlg = document.getElementById("dialogo");
  let marcadas = {};
  const botones = [];

  // Lee las casillas marcadas del navegador. Si el dato no es un array válido,
  // se empieza con la tarjeta en blanco.
  function leer() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(a)) a.forEach(function (n) { if (Number.isInteger(n) && n >= 0 && n < 25 && n !== LIBRE) marcadas[n] = true; });
    } catch (e) { /* sin datos o dañados: se empieza en blanco */ }
  }
  // Guarda solo los índices marcados. Devuelve false si el navegador no deja.
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(Object.keys(marcadas).map(Number))); return true; }
    catch (e) { return false; }
  }
  // ¿La casilla cuenta como marcada? El espacio libre siempre cuenta.
  function activa(n) { return n === LIBRE || !!marcadas[n]; }

  // Repinta la tarjeta y el texto de progreso. Una casilla entra en «línea»
  // si pertenece a alguna fila, columna o diagonal completa.
  function pintar() {
    const hechos = Object.keys(marcadas).length, enLinea = {};
    let bingos = 0;
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
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bingo-casilla";
    if (n === LIBRE) {
      b.className += " libre";
      b.textContent = TXT_LIBRE;
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

  // Si el progreso se marca en otra pestaña, se relee y se repinta.
  window.addEventListener("storage", function (e) {
    if (e.key === KEY || e.key === null) { marcadas = {}; leer(); pintar(); }
  });

  leer();
  pintar();
  }

  const listo = window.BT && window.BT.listo;
  if (listo) listo.then(iniciar, iniciar); else iniciar();
})();
