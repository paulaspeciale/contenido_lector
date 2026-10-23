(function () {
  "use strict";
  var KEY = "tema_preferido";   // "claro" | "oscuro"; sin valor = sigue al dispositivo
  var root = document.documentElement;
  // Color propio por sección: se deduce del nombre del archivo y lo aplica base.css
  var PAGINAS = { resenia: "resenia", ideas_post_90: "ideas", calendario_ideas_90: "calendario", glosario: "glosario", bingo: "bingo", sugerencias: "sugerencias", sobre_mi: "sobre-mi" };
  var archivo = (location.pathname.split("/").pop() || "index").replace(/\.html?$/, "");
  root.setAttribute("data-seccion", PAGINAS[archivo] || "inicio");
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var boton = null, timer = null;

  function guardado() {
    try { var v = localStorage.getItem(KEY); return v === "claro" || v === "oscuro" ? v : null; }
    catch (e) { return null; }
  }
  function guardar(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* sin acción */ } }
  function efectivo() {
    return guardado() || (mq && mq.matches ? "oscuro" : "claro");
  }
  function aplicar() {
    var g = guardado();
    if (g) root.setAttribute("data-theme", g === "oscuro" ? "dark" : "light");
    else root.removeAttribute("data-theme");
  }
  function pintarBoton() {
    if (!boton) return;
    var oscuro = efectivo() === "oscuro";
    boton.textContent = oscuro ? "☀️" : "🌙";
    boton.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    boton.title = oscuro ? "Tema claro" : "Tema oscuro";
  }
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
      var nuevo = efectivo() === "oscuro" ? "claro" : "oscuro";
      conTransicion(function () { guardar(nuevo); aplicar(); });
      pintarBoton();
    });
    document.body.appendChild(boton);
    pintarBoton();
    // Si el menú se desliza, deja visible el enlace de la página actual
    var m = document.querySelector(".menu");
    var act = m && m.querySelector('a[aria-current="page"]');
    if (m && act) {
      m.scrollLeft += act.getBoundingClientRect().left - m.getBoundingClientRect().left - (m.clientWidth - act.offsetWidth) / 2;
    }
  });

  if (mq) {
    var cambio = function () { if (!guardado()) conTransicion(function () { aplicar(); }); pintarBoton(); };
    if (mq.addEventListener) mq.addEventListener("change", cambio);
    else if (mq.addListener) mq.addListener(cambio);
  }
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { aplicar(); pintarBoton(); }
  });
})();
