/* bingo-iconos.js · Iconos SVG decorativos para las casillas del bingo.
   Se carga DESPUÉS de bingo.js. No toca la lógica: recorre las casillas y, según su texto,
   les añade un icono (sin icono si ninguna regla encaja). Son solo decoración (aria-hidden).
   Para cambiar o añadir iconos: agrega el dibujo en ICONOS (viewBox 24x24, solo trazos)
   y una regla en REGLAS: [expresión sobre el texto sin tildes y en minúsculas, nombre del icono]. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  var ICONOS = {
    repetir: '<path d="M4 12a8 8 0 0 1 13.5-5.8L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.5 5.8L4 15.5M4 20v-4.5h4.5"/>',
    dual: '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
    pluma: '<path d="M12 3l5 8-5 10-5-10z"/><path d="M12 3v10M9.5 13h5"/>',
    pelota: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8"/>',
    burbujas: '<path d="M3 4h12v9H9.5L6 16.5V13H3z"/><path d="M18 9h3v9h-2v3l-3-3h-6v-2"/>',
    pila: '<rect x="4" y="4" width="16" height="4" rx="1"/><rect x="3" y="10" width="17" height="4" rx="1"/><rect x="5" y="16" width="15" height="4" rx="1"/>',
    lupa: '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/>',
    espadas: '<path d="M5 5l12 12M19 5L7 17M14.5 19.5l3-3M9.5 19.5l-3-3"/>',
    llama: '<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
    libro: '<path d="M12 6c-2-1.5-5-2-9-2v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2z"/><path d="M12 6v14"/>',
    varita: '<path d="M4 20l10-10"/><path d="M17 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
    gema: '<path d="M6 4h12l4 6-10 11L2 10z"/><path d="M2 10h20M9 4l-2 6 5 11 5-11-2-6"/>',
    taza: '<path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3"/>',
    casa: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
    giro: '<path d="M4 18l5-8 4 5 7-10M16 5h4v4"/>',
    saga: '<rect x="4" y="6" width="4" height="14"/><rect x="10" y="4" width="4" height="16"/><rect x="16" y="6" width="4" height="14"/>',
    acantilado: '<path d="M3 9h9v5h4v5h5M18 3v5M16 6l2 2 2-2"/>',
    auriculares: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="4" y="14" width="3" height="6"/><rect x="17" y="14" width="3" height="6"/>',
    globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    claqueta: '<rect x="3" y="9" width="18" height="11"/><path d="M3 9l2-5h14l-2 5M8 4L6 9M13 4l-2 5M18 4l-2 5"/>',
    corazon: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>'
  };

  // Sin icono a propósito: Debut Novel, Book Hangover, Book Club Pick y Hardcover (no todas las casillas lo llevan)
  var REGLAS = [
    [/espacio libre|free space/, "corazon"],
    [/re-?read|relectura/, "repetir"],
    [/dual|doble pov/, "dual"],
    [/new author|autor\w* nuev/, "pluma"],
    [/sports|deportiv/, "pelota"],
    [/buddy|compartida/, "burbujas"],
    [/\b500\b|pages|paginas/, "pila"],
    [/judge|cover|portada/, "lupa"],
    [/enemies|enemigos/, "espadas"],
    [/slow burn|fuego lento/, "llama"],
    [/standalone|autoconclusivo/, "libro"],
    [/romantasy/, "varita"],
    [/hidden gem|joya/, "gema"],
    [/comfort|confort/, "taza"],
    [/found family|familia/, "casa"],
    [/plot twist|giro/, "giro"],
    [/series|saga/, "saga"],
    [/cliffhanger|suspenso/, "acantilado"],
    [/audiobook|audiolibro/, "auriculares"],
    [/translated|traduc/, "globo"],
    [/adapted|screen|pantalla|adaptad/, "claqueta"]
  ];

  function norm(t) {
    return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function nombreDe(texto) {
    var t = norm(texto);
    for (var i = 0; i < REGLAS.length; i++) { if (REGLAS[i][0].test(t)) return REGLAS[i][1]; }
    return null;
  }

  function crear(nombre) {
    var span = document.createElement("span");
    span.className = "bingo-icono";
    span.setAttribute("aria-hidden", "true");
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = ICONOS[nombre];
    span.appendChild(svg);
    return span;
  }

  function decorar(grid) {
    Array.prototype.forEach.call(grid.querySelectorAll(".bingo-casilla"), function (b) {
      if (b.querySelector(".bingo-icono")) return;
      var nombre = nombreDe(b.textContent);
      if (nombre && ICONOS[nombre]) b.insertBefore(crear(nombre), b.firstChild);
    });
  }

  var grid = document.getElementById("bingo-grid");
  if (!grid) return;
  decorar(grid);
  // Si la tarjeta se vuelve a dibujar (p. ej. al cargar los retos desde el JSON), se decora de nuevo
  if (window.MutationObserver) new MutationObserver(function () { decorar(grid); }).observe(grid, { childList: true, subtree: true });
})();
