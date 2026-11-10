/* theme.js · Tema claro / oscuro y color de sección.

   - Sigue la preferencia del dispositivo (prefers-color-scheme) hasta que la
     persona elige un tema con el botón flotante; la elección se guarda en
     localStorage["tema_preferido"] ("claro" | "oscuro").
   - Coloca el botón y sincroniza el tema entre pestañas.
   - Deduce la sección actual a partir del nombre del archivo y la deja en
     data-seccion para que base.css aplique el color de «tela de encuadernación».
   Se carga en el <head> de todas las páginas, antes del resto. */
(function () {
  "use strict";
  const KEY = "tema_preferido";   // "claro" | "oscuro"; sin valor = sigue al dispositivo
  const root = document.documentElement;
  // Color propio por sección: se deduce del nombre del archivo y lo aplica base.css.
  // Varias páginas comparten color (consistencia usa el de bio).
  const PAGINAS = { resena: "resenia", ideas: "ideas", calendario: "calendario", glosario: "glosario", bio: "bio", consistencia: "bio", bingo: "bingo", sugerencias: "sugerencias", "sobre-mi": "sobre-mi" };
  const archivo = (location.pathname.split("/").pop() || "index").replace(/\.html?$/, "");
  root.setAttribute("data-seccion", PAGINAS[archivo] || "inicio");
  const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  let boton = null, timer = null;

  function guardado() {
    try { const v = localStorage.getItem(KEY); return v === "claro" || v === "oscuro" ? v : null; }
    catch (e) { return null; }
  }
  function guardar(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* sin acción */ } }
  // Tema realmente aplicado: el guardado o, si no hay, el del dispositivo.
  function efectivo() {
    return guardado() || (mq && mq.matches ? "oscuro" : "claro");
  }
  // Pone o quita data-theme en <html>. Sin atributo, manda color-scheme del CSS.
  function aplicar() {
    const g = guardado();
    if (g) root.setAttribute("data-theme", g === "oscuro" ? "dark" : "light");
    else root.removeAttribute("data-theme");
  }
  // Actualiza el icono y el texto accesible del botón.
  function pintarBoton() {
    if (!boton) return;
    const oscuro = efectivo() === "oscuro";
    boton.textContent = oscuro ? "☀️" : "🌙";
    boton.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    boton.title = oscuro ? "Tema claro" : "Tema oscuro";
  }
  // Pequeña transición de color al cambiar de tema (se quita sola a los 600 ms).
  function conTransicion(fn) {
    root.classList.add("tema-anim");
    fn();
    clearTimeout(timer);
    timer = setTimeout(function () { root.classList.remove("tema-anim"); }, 600);
  }

  aplicar();   // antes de pintar, para evitar el parpadeo

  document.addEventListener("DOMContentLoaded", function () {
    boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-tema";
    boton.addEventListener("click", function () {
      const nuevo = efectivo() === "oscuro" ? "claro" : "oscuro";
      conTransicion(function () { guardar(nuevo); aplicar(); });
      pintarBoton();
    });
    document.body.appendChild(boton);
    pintarBoton();
    // Si el menú se desliza, deja visible el enlace de la página actual
    const m = document.querySelector(".menu");
    const act = m && m.querySelector('a[aria-current="page"]');
    if (m && act) {
      m.scrollLeft += act.getBoundingClientRect().left - m.getBoundingClientRect().left - (m.clientWidth - act.offsetWidth) / 2;
    }
  });

  if (mq) {
    const cambio = function () { if (!guardado()) conTransicion(function () { aplicar(); }); pintarBoton(); };
    if (mq.addEventListener) mq.addEventListener("change", cambio);
    else if (mq.addListener) mq.addListener(cambio);
  }
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { aplicar(); pintarBoton(); }
  });
})();
