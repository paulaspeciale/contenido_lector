/* ==========================================================================
   bingo-exportar.js · Descarga la tarjeta como imagen PNG y comparte el progreso.

   - Lee la tarjeta del DOM: bingo.js ya construyó las casillas y bingo-iconos.js
     ya puso los iconos. Este archivo no lee ni modifica el progreso guardado.
   - Genera un PNG de 1080 px de ancho con la paleta clara (papel crema) aunque
     el sitio esté en tema oscuro: la imagen se comparte y se imprime.
   - «Compartir» usa Web Share API con archivo. Si el navegador no puede, se
     oculta el botón y solo queda la descarga.
   Se carga DESPUÉS de bingo.js y bingo-iconos.js.
   ========================================================================== */
(function () {
  "use strict";

  const NOMBRE = "bingo-lector-2027.png";
  const ANCHO = 1080;
  const MARGEN = 56;
  const HUECO = 6;          // separación entre casillas (el fondo hace de línea)
  const LADO = ANCHO - MARGEN * 2;
  const CELDA = (LADO - HUECO * 4) / 5;

  // Espejo del tema claro de base.css: la imagen siempre sale en papel crema.
  // «acento» es el cobre de la sección Bingo (--c-bingo), el mismo de las
  // casillas marcadas en pantalla.
  const PALETA = {
    fondo: "#efe6d6",
    superficie: "#f8f1e4",
    texto: "#2e2226",
    suave: "#66565b",
    acento: "#8a4a22",
    sobreAcento: "#f8f1e4",
    oro: "#b8923e",
    libre: "#e6d6b6"        // color-mix(in srgb, oro 28%, superficie)
  };

  const SERIF = '"Iowan Old Style", "Baskerville", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
  const MONO = '"Courier Prime", "American Typewriter", "Courier New", Courier, monospace';

  const elDescargar = document.getElementById("bingo-descargar");
  const elCompartir = document.getElementById("bingo-compartir");
  const elAviso = document.getElementById("bingo-aviso");
  let generando = false;

  // ---------- Utilidades de dibujo ----------

  // Ajusta el tamaño de la fuente para que el texto quepa en la casilla.
  function ajustarTexto(ctx, texto, anchoMax, altoMax, peso) {
    for (let tam = 21; tam >= 11; tam--) {
      const fuente = peso + " " + tam + "px " + SERIF;
      ctx.font = fuente;
      const lineas = envolver(ctx, texto, anchoMax);
      const interlinea = tam * 1.25;
      if (lineas.length * interlinea <= altoMax && lineas.every(function (l) { return ctx.measureText(l).width <= anchoMax; })) {
        return { lineas: lineas, tam: tam, interlinea: interlinea };
      }
    }
    ctx.font = "400 11px " + SERIF;
    return { lineas: envolver(ctx, texto, anchoMax), tam: 11, interlinea: 13.75 };
  }

  function envolver(ctx, texto, anchoMax) {
    const palabras = String(texto).split(/\s+/);
    const lineas = [];
    let actual = "";
    palabras.forEach(function (p) {
      const prueba = actual ? actual + " " + p : p;
      if (!actual || ctx.measureText(prueba).width <= anchoMax) actual = prueba;
      else { lineas.push(actual); actual = p; }
    });
    if (actual) lineas.push(actual);
    return lineas;
  }

  // Convierte el <svg> de una casilla en un Path2D (solo trazos).
  function aPath2D(svg) {
    const p = new Path2D();
    const nodos = svg.querySelectorAll("path, circle, rect, line, polyline, ellipse");
    Array.prototype.forEach.call(nodos, function (n) {
      const t = n.tagName.toLowerCase();
      const v = function (a, d) { const x = parseFloat(n.getAttribute(a)); return isFinite(x) ? x : d; };
      if (t === "path") {
        const d = n.getAttribute("d");
        if (d) p.addPath(new Path2D(d));
      } else if (t === "circle") {
        p.moveTo(v("cx", 0) + v("r", 0), v("cy", 0));
        p.arc(v("cx", 0), v("cy", 0), v("r", 0), 0, Math.PI * 2);
      } else if (t === "ellipse") {
        p.moveTo(v("cx", 0) + v("rx", 0), v("cy", 0));
        p.ellipse(v("cx", 0), v("cy", 0), v("rx", 0), v("ry", 0), 0, 0, Math.PI * 2);
      } else if (t === "rect") {
        if (n.getAttribute("rx") && p.roundRect) p.roundRect(v("x", 0), v("y", 0), v("width", 0), v("height", 0), v("rx", 0));
        else p.rect(v("x", 0), v("y", 0), v("width", 0), v("height", 0));
      } else if (t === "line") {
        p.moveTo(v("x1", 0), v("y1", 0));
        p.lineTo(v("x2", 0), v("y2", 0));
      } else if (t === "polyline") {
        const puntos = (n.getAttribute("points") || "").trim().split(/[\s,]+/).map(parseFloat);
        for (let i = 0; i < puntos.length; i += 2) {
          if (i === 0) p.moveTo(puntos[0], puntos[1]);
          else p.lineTo(puntos[i], puntos[i + 1]);
        }
      }
    });
    return p;
  }

  function dibujarIcono(ctx, path, x, y, tam, color) {
    if (!path) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(tam / 24, tam / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(path);
    ctx.restore();
  }

  // ---------- Construcción de la imagen ----------

  function leerCasillas() {
    const nodos = document.querySelectorAll("#bingo-grid .bingo-casilla");
    if (nodos.length !== 25) return null;
    return Array.prototype.map.call(nodos, function (b) {
      const libre = b.classList.contains("libre");
      return {
        texto: (b.textContent || "").trim(),
        marcada: libre || b.getAttribute("aria-pressed") === "true",
        libre: libre,
        linea: b.classList.contains("linea"),
        icono: b.querySelector(".bingo-icono svg")
      };
    });
  }

  function construir() {
    const casillas = leerCasillas();
    if (!casillas) return null;

    const topCuadricula = 200;
    const finCuadricula = topCuadricula + LADO;
    const pieY = finCuadricula + 62;
    const alto = pieY + 48;

    const canvas = document.createElement("canvas");
    const escala = window.devicePixelRatio > 1.5 ? 2 : 1;
    canvas.width = ANCHO * escala;
    canvas.height = alto * escala;
    const ctx = canvas.getContext("2d");
    ctx.scale(escala, escala);

    // Fondo papel
    ctx.fillStyle = PALETA.fondo;
    ctx.fillRect(0, 0, ANCHO, alto);

    // Cabecera
    const hechos = Number(document.getElementById("bingo-prog").value) || 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = PALETA.texto;
    ctx.font = "700 62px " + SERIF;
    ctx.fillText("Bingo lector 2027", ANCHO / 2, MARGEN + 54);

    ctx.fillStyle = PALETA.suave;
    ctx.font = "400 26px " + MONO;
    ctx.fillText(hechos === 24 ? "¡Tarjeta completa!" : hechos + " de 24 retos completados", ANCHO / 2, MARGEN + 54 + 44);

    // Marco de la cuadrícula: el fondo hace de línea entre casillas.
    // El rectángulo se expande para que el borde exterior también sea tinta.
    ctx.fillStyle = PALETA.texto;
    ctx.fillRect(MARGEN - 4, topCuadricula - 4, LADO + 8, LADO + 8);

    // Un solo tamaño de letra para todas las casillas: la tarjeta se lee como
    // una retícula, no como veinticuatro tamaños distintos.
    let tamComun = 21;
    casillas.forEach(function (c) {
      if (c.libre) return;
      const m = ajustarTexto(ctx, c.texto, CELDA - 28, CELDA - (c.icono ? 46 : 20), "400");
      if (m.tam < tamComun) tamComun = m.tam;
    });
    if (tamComun < 13) tamComun = 13;

    for (let i = 0; i < 25; i++) {
      const c = casillas[i];
      const col = i % 5;
      const fila = Math.floor(i / 5);
      const x = MARGEN + col * (CELDA + HUECO);
      const y = topCuadricula + fila * (CELDA + HUECO);

      // Fondo de la casilla
      ctx.fillStyle = c.libre ? PALETA.libre : c.marcada ? PALETA.acento : PALETA.superficie;
      ctx.fillRect(x, y, CELDA, CELDA);

      const colorTexto = c.marcada && !c.libre ? PALETA.sobreAcento : PALETA.texto;
      const colorIcono = c.libre ? PALETA.oro : c.marcada ? PALETA.sobreAcento : PALETA.acento;

      // Icono (el mismo que se ve en pantalla)
      const tieneIcono = !!c.icono;
      const tamIcono = 32;
      const anchoTexto = CELDA - 28;

      let bloque;
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      if (c.libre) {
        ctx.font = "700 19px " + MONO;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "1.2px";
        bloque = { lineas: envolver(ctx, c.texto.toUpperCase(), anchoTexto), tam: 19, interlinea: 23.75, familia: MONO };
      } else {
        ctx.font = "400 " + tamComun + "px " + SERIF;
        bloque = { lineas: envolver(ctx, c.texto, anchoTexto), tam: tamComun, interlinea: tamComun * 1.25, familia: SERIF };
      }

      const altoTexto = bloque.lineas.length * bloque.interlinea;
      const altoBloque = (tieneIcono ? tamIcono + 8 : 0) + altoTexto;
      let cursor = y + (CELDA - altoBloque) / 2;

      if (tieneIcono) {
        dibujarIcono(ctx, aPath2D(c.icono), x + (CELDA - tamIcono) / 2, cursor, tamIcono, colorIcono);
        cursor += tamIcono + 8;
      }

      ctx.textAlign = "center";
      ctx.fillStyle = colorTexto;
      ctx.font = (c.libre ? "700 " : "400 ") + bloque.tam + "px " + bloque.familia;
      if ("letterSpacing" in ctx) ctx.letterSpacing = c.libre ? "1.2px" : "0px";
      bloque.lineas.forEach(function (linea, n) {
        ctx.fillText(linea, x + CELDA / 2, cursor + bloque.interlinea * n + bloque.tam);
      });

      // Sello de casilla marcada
      if (c.marcada && !c.libre) {
        ctx.textAlign = "right";
        ctx.fillStyle = PALETA.sobreAcento;
        ctx.font = "700 20px " + MONO;
        ctx.fillText("\u2713", x + CELDA - 10, y + 24);
      }

      // Línea completa: marco dorado por dentro
      if (c.linea) {
        ctx.strokeStyle = PALETA.oro;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, CELDA - 3, CELDA - 3);
      }
    }

    // Pie
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.textAlign = "center";
    ctx.fillStyle = PALETA.suave;
    ctx.font = "400 24px " + MONO;
    ctx.fillText("Contenido BookTok · sin registro", ANCHO / 2, pieY);

    return canvas;
  }

  // ---------- Descarga y compartir ----------

  function descargar(canvas) {
    return new Promise(function (resolver) {
      try {
        canvas.toBlob(function (blob) {
          if (!blob) { resolver(null); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = NOMBRE;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
          resolver(blob);
        }, "image/png");
      } catch (e) { resolver(null); }
    });
  }

  function prepararFuentes() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load("400 26px " + MONO),
      document.fonts.load("700 26px " + MONO),
      document.fonts.load("700 62px " + SERIF)
    ]).catch(function () { /* si falla, se dibuja con la fuente del sistema */ });
  }

  function avisar(texto) { elAviso.textContent = texto || ""; }

  function ocupado(si) {
    generando = si;
    elDescargar.disabled = si;
    if (!elCompartir.hidden) elCompartir.disabled = si;
  }

  function generar() {
    ocupado(true);
    avisar("Preparando la imagen…");
    return prepararFuentes().then(function () {
      const canvas = construir();
      ocupado(false);
      if (!canvas) { avisar("⚠ No se pudo preparar la imagen. Recarga la página e inténtalo de nuevo."); return null; }
      return canvas;
    });
  }

  if (!elDescargar) return;

  elDescargar.addEventListener("click", function () {
    if (generando) return;
    generar().then(function (canvas) {
      if (!canvas) return;
      return descargar(canvas).then(function (blob) {
        avisar(blob ? "Tarjeta descargada como " + NOMBRE + "." : "⚠ No se pudo descargar la imagen.");
      });
    });
  });

  // Al desmarcar la tarjeta, el aviso de descarga anterior deja de tener sentido.
  const elReiniciar = document.getElementById("bingo-reiniciar");
  if (elReiniciar) elReiniciar.addEventListener("click", function () { avisar(""); });

  // El botón de compartir solo aparece si el navegador puede compartir archivos.
  if (elCompartir && navigator.canShare) {
    try {
      const prueba = new File([new Blob([""], { type: "image/png" })], "prueba.png", { type: "image/png" });
      elCompartir.hidden = !navigator.canShare({ files: [prueba] });
    } catch (e) { elCompartir.hidden = true; }
  }

  if (elCompartir) {
    elCompartir.addEventListener("click", function () {
      if (generando) return;
      generar().then(function (canvas) {
        if (!canvas) return;
        canvas.toBlob(function (blob) {
          if (!blob) { avisar("⚠ No se pudo preparar la imagen para compartir."); return; }
          const archivo = new File([blob], NOMBRE, { type: "image/png" });
          navigator.share({
            files: [archivo],
            title: "Bingo lector 2027",
            text: "Mi progreso en el Bingo lector 2027"
          }).then(function () {
            avisar("Compartido.");
          }).catch(function (err) {
            if (err && err.name === "AbortError") { avisar(""); return; }
            avisar("No se pudo abrir el menú de compartir. Descarga la tarjeta y compártela desde tu galería.");
          });
        }, "image/png");
      });
    });
  }
})();
