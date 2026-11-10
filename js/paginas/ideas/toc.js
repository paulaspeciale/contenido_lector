/* Menú «En esta página» de la página de Ideas.

   Construye la lista de secciones a partir de los <details> que crea main.js,
   la sincroniza cuando aparecen o desaparecen secciones nuevas (evento
   «secciones-cambiadas»), marca el enlace de la sección visible al hacer scroll
   y abre el panel plegable al pulsar un enlace.
   En pantallas anchas el menú está siempre abierto; en móvil es plegable. */
(function () {
  "use strict";
  const toc = document.getElementById("toc");
  const det = document.getElementById("toc-det");
  const sub = document.getElementById("toc-secciones");
  if (!toc || !det || !sub) return;

  let links = [], pares = [];

  // Un enlace por cada sección de ideas (los títulos los crea main.js).
  // Se vuelve a llamar cuando main.js crea o quita una sección nueva.
  function construirSecciones() {
  sub.textContent = "";
  Array.prototype.forEach.call(document.querySelectorAll("#lista > details[data-sec]"), function (d, k) {
    d.id = "seccion-" + (k + 1);
    const h = d.querySelector("summary h2");
    const txt = h ? h.textContent.trim() : "Sección " + (k + 1);
    const m = /^(\d+\.)\s*(.*)$/.exec(txt);
    let num = m ? m[1] : "", t = m ? m[2] : txt;
    if (t === t.toUpperCase()) t = t.charAt(0) + t.slice(1).toLowerCase();
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = "#" + d.id;
    if (num) { const s = document.createElement("span"); s.className = "ni"; s.textContent = num; a.appendChild(s); }
    a.appendChild(document.createTextNode(t));
    li.appendChild(a);
    sub.appendChild(li);
  });

  links = Array.prototype.slice.call(toc.querySelectorAll("a"));
  pares = links.map(function (a) {
    return { a: a, t: document.getElementById(a.getAttribute("href").slice(1)) };
  }).filter(function (p) { return p.t; });
  }
  construirSecciones();
  document.addEventListener("secciones-cambiadas", function () { construirSecciones(); actualizar(); });

  const mq = window.matchMedia ? window.matchMedia("(min-width: 80rem)") : null;
  function ancho() { return !!(mq && mq.matches); }

  // En pantalla ancha el menú está siempre abierto; en móvil es un panel plegable
  const resumen = det.querySelector("summary");
  function ajustar() {
    det.open = ancho();
    resumen.tabIndex = ancho() ? -1 : 0;
  }
  if (mq) { if (mq.addEventListener) mq.addEventListener("change", ajustar); else if (mq.addListener) mq.addListener(ajustar); }
  det.addEventListener("toggle", function () { if (ancho() && !det.open) det.open = true; });
  ajustar();

  function marcar(a) {
    links.forEach(function (l) {
      if (l === a) l.setAttribute("aria-current", "location");
      else l.removeAttribute("aria-current");
    });
    // Si el menú tiene scroll propio, deja visible el enlace activo
    if (ancho() && a && toc.scrollHeight > toc.clientHeight) {
      const r = a.getBoundingClientRect(), tr = toc.getBoundingClientRect();
      if (r.top < tr.top + 8) toc.scrollTop -= tr.top + 8 - r.top;
      else if (r.bottom > tr.bottom - 8) toc.scrollTop += r.bottom - tr.bottom + 8;
    }
  }

  // Marca el enlace de la sección que está más cerca del tercio superior de la
  // pantalla (y el último enlace si se llegó al final de la página).
  function actualizar() {
    // Las secciones ocultas por filtros u orden también desaparecen del menú
    const vis = pares.filter(function (p) {
      const v = !p.t.hidden && p.t.getClientRects().length > 0;
      p.a.parentNode.hidden = !v;
      return v;
    });
    if (!vis.length) return;
    let linea = window.innerHeight * 0.3, actual = vis[0];
    vis.forEach(function (p) { if (p.t.getBoundingClientRect().top <= linea) actual = p; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) actual = vis[vis.length - 1];
    marcar(actual.a);
  }

  let ticking = false;
  function pedir() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; actualizar(); });
  }
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir);
  const lista = document.getElementById("lista");
  if (lista && window.MutationObserver) {
    new MutationObserver(pedir).observe(lista, { subtree: true, attributes: true, attributeFilter: ["hidden", "open"] });
  }

  // Al saltar a una sección o panel plegable, se abre
  toc.addEventListener("click", function (e) {
    const a = e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    const t = document.getElementById(a.getAttribute("href").slice(1));
    if (t && t.tagName === "DETAILS") t.open = true;
  });
  actualizar();
})();
