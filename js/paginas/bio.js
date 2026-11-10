/* ==========================================================================
   Bio · lógica de bio.html.

   Tiene tres partes:
     1. Contador de caracteres por red: mide el texto del usuario y lo compara
        con el límite de cada campo (CAMPOS). Los emojis se cuentan aparte
        porque algunas redes los cuentan como 2 o 3 caracteres.
     2. Borradores: guarda lo escrito en localStorage["bio_borradores_v1"] y
        muestra un resumen con el estado de cada campo.
     3. Checklist: pasos marcados en localStorage["bio_checklist_v1"].

   Estados del contador: «ok» (cabe), «dudoso» (cabe o no según cuánto cuente
   cada emoji) y «exceso» (no cabe).
   ========================================================================== */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const KEY_B = "bio_borradores_v1", KEY_C = "bio_checklist_v1";

  // ---------- Almacenamiento (siempre con try/catch) ----------
  function leer(k) { try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === "object" ? v : null; } catch (e) { return null; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // ---------- Medir texto: grafemas, y emojis aparte ----------
  let seg = null;
  try { if (window.Intl && Intl.Segmenter) seg = new Intl.Segmenter(undefined, { granularity: "grapheme" }); } catch (e) { seg = null; }
  let reEmoji = null;
  try { reEmoji = new RegExp("\\p{Extended_Pictographic}", "u"); } catch (e) { reEmoji = null; }

  // Divide el texto en «grafemas» (lo que la persona ve como un carácter),
  // usando Intl.Segmenter si está disponible. Así un emoji compuesto no cuenta
  // como varios caracteres.
  function partes(t) {
    t = String(t).replace(/\r\n?/g, "\n");
    return seg ? Array.from(seg.segment(t), function (s) { return s.segment; }) : Array.from(t);
  }
  // Cuenta grafemas y emojis por separado.
  function medir(texto) {
    let p = partes(texto), emojis = 0;
    if (reEmoji) p.forEach(function (g) { if (reEmoji.test(g)) emojis++; });
    return { base: p.length, emojis: emojis, partes: p };
  }

  // ---------- Campos que se pueden medir ----------
  // Cada campo: { id del HTML, red, nombre visible, limite, emoji, nota, ejemplo, checks? }
  // emoji: [mínimo, máximo] de caracteres que consume cada emoji (null = cuenta como 1).
  // checks: funciones que, si devuelven true, muestran un consejo debajo del contador.
  const CAMPOS = [
    { id: "ig-nombre", red: "Instagram", nombre: "Nombre", limite: 30, emoji: null,
      nota: "Es el campo más buscable. Algunas fuentes indican hasta 64 caracteres: deja lo importante en los primeros 30.",
      ejemplo: "Tu nombre | Romantasy y libros" },
    { id: "ig-bio", red: "Instagram", nombre: "Bio", limite: 150, emoji: null,
      nota: "Cuentan los espacios, los emojis y los saltos de línea. Tres o cuatro líneas, una sola CTA.",
      ejemplo: "📚 Reseñas de romantasy sin spoilers\n🐉 Libros que valen la pena (y los que no)\nNueva reseña cada martes ↓",
      checks: [
        [function (t) { return t.indexOf("#") !== -1; }, "Hay un hashtag: se recomienda evitarlos en la bio."],
        [function (t) { return /link\s+en\s+(la\s+)?bio/i.test(t); }, "«Link en bio» es genérico: mejor una CTA concreta (por ejemplo, «Descarga la plantilla ↓»)."]
      ] },
    { id: "tt-nombre", red: "TikTok", nombre: "Nombre de perfil", limite: 30, emoji: null,
      nota: "Es lo que se busca en TikTok: incluye tu nicho.",
      ejemplo: "Tu nombre | Romantasy" },
    { id: "tt-bio", red: "TikTok", nombre: "Bio", limite: 80, emoji: [2, 3],
      nota: "Los emojis pueden contar 2 o 3 caracteres. Se muestra el cálculo de ambos casos.",
      ejemplo: "Romantasy y reseñas sin spoilers 📚 Herramientas gratis ⬇️",
      checks: [
        [function (t, m) { return m.emojis > 2; }, "Muchos emojis: ocupan espacio. Uno o dos bastan."],
        [function (t) { return t.indexOf("#") !== -1; }, "Hay un hashtag: se recomienda evitarlos en la bio."]
      ] },
    { id: "yt-desc", red: "YouTube", nombre: "Descripción del canal", limite: 1000, emoji: null, visible: 150,
      nota: "Solo se ven unos 150 caracteres antes de «más»: ahí va tu palabra clave y lo que ofreces. Los enlaces van en el campo «Enlaces».",
      ejemplo: "Reseñas de romantasy en español, sin spoilers, y herramientas gratis para lectores creadores de BookTok y Bookstagram.\n\nAquí encontrarás reseñas, wrap-ups, TBR y guiones para tus videos. Nuevo video cada semana.\n\nSuscríbete para no perderte la próxima lectura.",
      checks: [
        [function (t) { return /https?:\/\//i.test(t); }, "Hay una dirección web: los enlaces van en el campo «Enlaces» del canal."]
      ] },
    { id: "yt-nombre", red: "YouTube", nombre: "Nombre del canal", limite: 100, emoji: null,
      nota: "Marca y nicho, coherente con tus otras redes.",
      ejemplo: "Tu canal | Reseñas de romantasy" },
    { id: "x-bio", red: "X", nombre: "Bio", limite: 160, emoji: null,
      nota: "El sitio web va en un campo aparte: no gastes caracteres en el enlace.",
      ejemplo: "Lectora de romantasy. Reseñas sin spoilers, tropes y opiniones impopulares sobre libros." },
    { id: "li-titular", red: "LinkedIn", nombre: "Titular", limite: 220, emoji: null,
      nota: "Formato: Cargo | Especialidad | Resultado o para quién.",
      ejemplo: "Creadora de contenido literario | Reseñas y herramientas para lectores creadores | Bookstagram y BookTok" },
    { id: "fb-intro", red: "Facebook", nombre: "Presentación", limite: 101, emoji: null,
      nota: "Muy corta: qué haces y un beneficio claro.",
      ejemplo: "Reseñas de romantasy sin spoilers y herramientas gratis para lectores creadores." }
  ];
  const porId = {};
  CAMPOS.forEach(function (c) { porId[c.id] = c; });

  // Estado de un texto frente al límite: ok | dudoso | exceso.
  // «dudoso» solo ocurre con emojis cuyo ancho real no se sabe con certeza.
  function evaluar(c, m) {
    const minC = m.base + (c.emoji ? m.emojis * (c.emoji[0] - 1) : 0);
    const maxC = m.base + (c.emoji ? m.emojis * (c.emoji[1] - 1) : 0);
    const estado = maxC <= c.limite ? "ok" : (minC <= c.limite ? "dudoso" : "exceso");
    return { min: minC, max: maxC, estado: estado };
  }

  function textoCuenta(c, m, ev) {
    if (!c.emoji || !m.emojis) return ev.max + " / " + c.limite;
    return ev.min + "–" + ev.max + " / " + c.limite;
  }

  // ---------- Etiquetas de caracteres bajo los ejemplos ----------
  Array.prototype.forEach.call(document.querySelectorAll(".ej-n[data-campo]"), function (n) {
    const c = porId[n.getAttribute("data-campo")];
    const t = n.parentNode.querySelector(".ej-t");
    if (!c || !t) return;
    const m = medir(t.textContent.trim()), ev = evaluar(c, m);
    n.textContent = textoCuenta(c, m, ev) + " caracteres (" + c.red + ": " + c.nombre.toLowerCase() + ")";
  });

  // ---------- Diálogos ----------
  function confirmar(texto) {
    return new Promise(function (resolve) {
      const d = $("dialogo");
      if (!d || typeof d.showModal !== "function") { resolve(window.confirm(texto)); return; }
      try {
        $("dialogo-texto").textContent = texto;
        d.returnValue = "";
        d.addEventListener("close", function () { resolve(d.returnValue === "ok"); }, { once: true });
        d.showModal();
      } catch (e) { resolve(window.confirm(texto)); }
    });
  }
  $("dialogo-si").addEventListener("click", function () { $("dialogo").close("ok"); });
  $("dialogo-no").addEventListener("click", function () { $("dialogo").close("cancel"); });

  function copiar(texto) {
    return new Promise(function (res) {
      function resp() {
        try {
          const ta = document.createElement("textarea");
          ta.value = texto; ta.setAttribute("readonly", "");
          ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
          document.body.appendChild(ta);
          ta.select(); ta.setSelectionRange(0, texto.length);
          const ok = !!(document.execCommand && document.execCommand("copy"));
          ta.remove(); res(ok);
        } catch (e) { res(false); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(function () { res(true); }, resp);
      else resp();
    });
  }
  function anunciar(txt) {
    const c = $("copiado"); c.textContent = "";
    setTimeout(function () { c.textContent = txt; }, 30);
  }
  function parpadeo(boton, txt) {
    const o = boton.getAttribute("data-texto") || boton.textContent;
    boton.setAttribute("data-texto", o);
    boton.textContent = txt;
    clearTimeout(boton._t);
    boton._t = setTimeout(function () { boton.textContent = o; }, 1800);
  }
  function mostrarCopia(texto) {
    $("copiar-texto").value = texto;
    const d = $("dialogo-copiar");
    try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
    $("copiar-texto").select();
  }
  $("copiar-cerrar").addEventListener("click", function () {
    const d = $("dialogo-copiar");
    try { d.close(); } catch (e) { d.removeAttribute("open"); }
  });

  // Botones «Copiar» de los ejemplos
  document.querySelector("main").addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest("button[data-copiar]") : null;
    if (!b) return;
    const li = b.closest(".ej"), t = li && li.querySelector(".ej-t");
    if (!t) return;
    const texto = t.textContent.replace(/^[ \t]+/gm, "").trim();
    copiar(texto).then(function (ok) {
      if (ok) { parpadeo(b, "¡Copiado!"); anunciar("Copiado al portapapeles."); }
      else mostrarCopia(texto);
    });
  });

  // ---------- Contador y borradores ----------
  const selCampo = $("c-campo"), txt = $("c-texto"), prog = $("c-prog"), cuenta = $("c-cuenta");
  const estado = $("c-estado"), avisos = $("c-avisos"), nota = $("c-nota"), msg = $("c-msg");
  const borradores = (leer(KEY_B) || {});
  let actual = CAMPOS[0].id, guardaTimer = null, anuncioTimer = null;

  CAMPOS.forEach(function (c) {
    const o = document.createElement("option");
    o.value = c.id; o.textContent = c.red + " · " + c.nombre + " (" + c.limite + ")";
    selCampo.appendChild(o);
  });

  // Guarda solo borradores de campos conocidos y con texto; los vacíos se borran.
  function guardarBorradores() {
    const limpio = {};
    Object.keys(borradores).forEach(function (k) { if (porId[k] && typeof borradores[k] === "string" && borradores[k]) limpio[k] = borradores[k]; });
    if (!escribir(KEY_B, limpio)) msg.textContent = "No se pudo guardar en el navegador: copia tu texto a un lugar seguro.";
  }

  function pintarResumen() {
    const ul = $("c-resumen");
    ul.textContent = "";
    let hay = false;
    CAMPOS.forEach(function (c) {
      const t = borradores[c.id];
      if (!t) return;
      hay = true;
      const m = medir(t), ev = evaluar(c, m);
      const li = document.createElement("li");
      const s = document.createElement("span"); s.className = "rb-t"; s.textContent = c.red + " · " + c.nombre;
      const n = document.createElement("span"); n.className = "rb-n"; n.setAttribute("data-estado", ev.estado);
      n.textContent = textoCuenta(c, m, ev) + (ev.estado === "ok" ? " ✓" : ev.estado === "dudoso" ? " ?" : " ✗");
      const b = document.createElement("button"); b.type = "button"; b.textContent = "Editar"; b.setAttribute("data-editar", c.id);
      b.setAttribute("aria-label", "Editar el borrador de " + c.red + ", " + c.nombre);
      li.appendChild(s); li.appendChild(n); li.appendChild(b);
      ul.appendChild(li);
    });
    if (!hay) {
      const v = document.createElement("li");
      v.textContent = "Todavía no hay borradores. Escribe arriba y aparecerán aquí.";
      ul.appendChild(v);
    }
  }

  function actualizar() {
    const c = porId[actual], m = medir(txt.value), ev = evaluar(c, m);
    prog.max = c.limite;
    prog.value = Math.min(ev.max, c.limite);
    prog.setAttribute("data-estado", ev.estado);
    cuenta.textContent = textoCuenta(c, m, ev) + " ";
    const peque = document.createElement("small");
    peque.textContent = "caracteres";
    cuenta.appendChild(peque);

    const dif = c.limite - ev.max;
    let mensaje;
    if (!txt.value.trim()) { mensaje = "Escribe tu texto para ver cuánto te queda."; estado.setAttribute("data-estado", ""); }
    else if (ev.estado === "ok") { mensaje = "Cabe: te sobran " + dif + " caracteres."; estado.setAttribute("data-estado", "ok"); }
    else if (ev.estado === "dudoso") { mensaje = "Podría pasarse según cuánto cuente cada emoji. Si no te deja guardar, quita uno."; estado.setAttribute("data-estado", "dudoso"); }
    else { mensaje = "Te pasas por " + (ev.min - c.limite) + " caracteres. Recorta antes de copiar."; estado.setAttribute("data-estado", "exceso"); }
    clearTimeout(anuncioTimer);
    anuncioTimer = setTimeout(function () { estado.textContent = mensaje; }, 500);

    avisos.textContent = "";
    const lista = (c.checks || []).filter(function (k) { return k[0](txt.value, m); });
    lista.forEach(function (k) { const li = document.createElement("li"); li.textContent = k[1]; avisos.appendChild(li); });
    avisos.hidden = !lista.length;

    const vis = $("c-visible-wrap");
    if (c.visible) {
      vis.hidden = false;
      const cortes = m.partes.slice(0, c.visible).join("");
      $("c-visible").textContent = cortes + (m.partes.length > c.visible ? "…" : "");
    } else { vis.hidden = true; }
  }

  function cargarCampo(id) {
    actual = id;
    selCampo.value = id;
    txt.value = borradores[id] || "";
    nota.textContent = porId[id].nota;
    msg.textContent = "";
    estado.textContent = "";
    actualizar();
    estado.textContent = !txt.value.trim() ? "Escribe tu texto para ver cuánto te queda." : estado.textContent;
  }

  selCampo.addEventListener("change", function () {
    clearTimeout(guardaTimer);
    cargarCampo(selCampo.value);
  });

  txt.addEventListener("input", function () {
    if (txt.value) borradores[actual] = txt.value; else delete borradores[actual];
    actualizar();
    clearTimeout(guardaTimer);
    guardaTimer = setTimeout(function () { guardarBorradores(); pintarResumen(); }, 400);
  });
  window.addEventListener("pagehide", function () { clearTimeout(guardaTimer); guardarBorradores(); });

  $("c-ejemplo").addEventListener("click", function () {
    const ej = porId[actual].ejemplo;
    function poner() {
      txt.value = ej;
      borradores[actual] = ej;
      guardarBorradores(); pintarResumen(); actualizar();
      msg.textContent = "Ejemplo cargado. Cámbialo por tus datos.";
      txt.focus();
    }
    if (txt.value.trim() && txt.value !== ej) {
      confirmar("Esto reemplazará el texto que escribiste en este campo. ¿Continuar?").then(function (ok) { if (ok) poner(); });
    } else { poner(); }
  });

  $("c-copiar").addEventListener("click", function () {
    const t = txt.value.trim();
    if (!t) { msg.textContent = "No hay nada que copiar."; return; }
    copiar(t).then(function (ok) {
      if (ok) { msg.textContent = "Texto copiado."; anunciar("Texto copiado."); }
      else mostrarCopia(t);
    });
  });

  $("c-borrar").addEventListener("click", function () {
    if (!txt.value) { msg.textContent = "Este borrador ya está vacío."; return; }
    confirmar("¿Borrar el borrador de este campo? No se puede deshacer.").then(function (ok) {
      if (!ok) return;
      delete borradores[actual];
      txt.value = "";
      guardarBorradores(); pintarResumen(); actualizar();
      msg.textContent = "Borrador borrado.";
    });
  });

  $("c-resumen").addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest("button[data-editar]") : null;
    if (!b) return;
    cargarCampo(b.getAttribute("data-editar"));
    txt.focus();
  });

  cargarCampo(actual);
  pintarResumen();

  // ---------- Checklist ----------
  const marcas = Array.isArray(leer(KEY_C) && leer(KEY_C).marcadas) ? leer(KEY_C).marcadas : [];
  const cajas = Array.prototype.slice.call(document.querySelectorAll("input[data-ck]"));
  const grupos = Array.prototype.slice.call(document.querySelectorAll(".ck-grupo"));

  // Repinta el progreso total y el de cada grupo del checklist.
  function pintarChecklist() {
    const tot = cajas.length, hechas = cajas.filter(function (c) { return c.checked; }).length;
    grupos.forEach(function (g) {
      let cs = g.querySelectorAll("input[data-ck]"), h = 0;
      Array.prototype.forEach.call(cs, function (c) { if (c.checked) h++; });
      g.querySelector(".ck-cuenta").textContent = h + " / " + cs.length;
    });
    const p = $("ck-prog");
    p.max = tot; p.value = hechas;
    if (hechas === tot) p.setAttribute("data-completo", ""); else p.removeAttribute("data-completo");
    $("ck-total").textContent = hechas + " de " + tot + " puntos listos" + (hechas === tot ? ". ¡Perfil completo!" : ".");
  }
  cajas.forEach(function (c) { c.checked = marcas.indexOf(c.getAttribute("data-ck")) !== -1; });
  pintarChecklist();

  function guardarChecklist() {
    const m = cajas.filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-ck"); });
    if (!escribir(KEY_C, { marcadas: m })) $("ck-msg").textContent = "No se pudo guardar en el navegador.";
  }
  document.addEventListener("change", function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute("data-ck")) { pintarChecklist(); guardarChecklist(); }
  });
  $("ck-reiniciar").addEventListener("click", function () {
    if (!cajas.some(function (c) { return c.checked; })) { $("ck-msg").textContent = "No hay nada marcado."; return; }
    confirmar("¿Desmarcar todo el checklist?").then(function (ok) {
      if (!ok) return;
      cajas.forEach(function (c) { c.checked = false; });
      pintarChecklist(); guardarChecklist();
      $("ck-msg").textContent = "Checklist reiniciado.";
    });
  });

  // ---------- Menú «En esta página»: marca la sección visible ----------
  const enlaces = Array.prototype.slice.call(document.querySelectorAll("#toc a"));
  function espiar() {
    let linea = window.innerHeight * 0.3, act = null;
    enlaces.forEach(function (a) {
      const t = document.getElementById(a.getAttribute("href").slice(1));
      if (t && t.getClientRects().length && t.getBoundingClientRect().top <= linea) act = a;
    });
    enlaces.forEach(function (a) { if (a === act) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  }
  window.addEventListener("scroll", espiar, { passive: true });
  espiar();
})();
