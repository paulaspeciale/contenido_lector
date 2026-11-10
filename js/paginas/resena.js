/* ==========================================================================
   Reseñas · lógica de resena.html.

   Cambia entre las cuatro vistas (completa, corta, guiones y prompts),
   reconstruye el texto plano de la vista visible para el botón «Copiar» y
   copia los prompts de IA. No guarda nada en localStorage.
   ========================================================================== */
(function () {
  "use strict";
  const completa = document.getElementById("vista-completa");
  const corta = document.getElementById("vista-corta");
  const guiones = document.getElementById("vista-guiones");
  const prompts = document.getElementById("vista-prompts");
  const msg = document.getElementById("plantilla-msg");
  const VISTAS = { completa: completa, corta: corta, guiones: guiones, prompts: prompts };
  const BOTONES = {
    completa: document.getElementById("ver-completa"),
    corta: document.getElementById("ver-corta"),
    guiones: document.getElementById("ver-guiones"),
    prompts: document.getElementById("ver-prompts")
  };
  const TITULOS = { completa: "", corta: " (versión corta)", guiones: " (guiones Reel / TikTok)", prompts: " (prompts para IA)" };
  const ETIQUETAS = { completa: "completa", corta: "corta", guiones: "de guiones", prompts: "de prompts" };
  let actual = "completa";

  // Muestra una vista y marca su botón; oculta el resto.
  function mostrar(cual) {
    if (!VISTAS[cual]) return;
    actual = cual;
    Object.keys(VISTAS).forEach(function (k) {
      VISTAS[k].hidden = k !== cual;
      BOTONES[k].setAttribute("aria-pressed", String(k === cual));
    });
    msg.textContent = "";
  }
  Object.keys(BOTONES).forEach(function (k) {
    BOTONES[k].addEventListener("click", function () { mostrar(k); });
  });
  function desdeHash() {
    const h = location.hash.slice(1);
    if (Object.prototype.hasOwnProperty.call(VISTAS, h)) mostrar(h);
  }
  desdeHash();
  window.addEventListener("hashchange", desdeHash);
  // «Volver al índice» reabre el índice si se había cerrado
  document.addEventListener("click", function (e) {
    const a = e.target.closest ? e.target.closest(".subir a") : null;
    const ind = document.getElementById("indice");
    if (a && ind) ind.open = true;
  });

  function limpio(t) { return t.replace(/\s+/g, " ").trim(); }

  // Texto de un <li> sin los botones «Copiar»
  function textoLi(li) {
    const c = li.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll("button"), function (b) { b.remove(); });
    return limpio(c.textContent);
  }

  // Texto plano de la versión visible (sin el índice ni los enlaces de volver)
  function textoVista() {
    const cont = VISTAS[actual];
    const out = [document.querySelector("h1").textContent.trim() + TITULOS[actual], ""];
    cont.querySelectorAll(".bloque").forEach(function (sec) {
      Array.prototype.forEach.call(sec.children, function (n) {
        if (n.classList.contains("subir")) return;
        const tag = n.tagName;
        if (tag === "H2") { out.push(limpio(n.textContent).toUpperCase()); }
        else if (tag === "H3") { out.push(limpio(n.textContent)); }
        else if (tag === "P") { out.push(limpio(n.textContent) + (n.classList.contains("rotulo") ? ":" : "")); }
        else if (tag === "UL") { n.querySelectorAll("li").forEach(function (li) { out.push("- " + textoLi(li)); }); }
        else if (n.classList.contains("tabla-wrap")) {
          const cap = n.querySelector("caption");
          if (cap) out.push(limpio(cap.textContent));
          n.querySelectorAll("tbody tr").forEach(function (tr) {
            const c = tr.children;
            out.push("- " + limpio(c[0].textContent) + ": " + limpio(c[1].querySelector("[aria-label]") ? c[1].querySelector("[aria-label]").getAttribute("aria-label") : c[1].textContent));
          });
        }
      });
      out.push("");
    });
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  // Copia al portapapeles con respaldo para navegadores sin Clipboard API.
  function copiar(texto) {
    return new Promise(function (resolve) {
      function respaldo() {
        try {
          const ta = document.createElement("textarea");
          ta.value = texto;
          ta.setAttribute("readonly", "");
          ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
          document.body.appendChild(ta);
          ta.select();
          ta.setSelectionRange(0, texto.length);
          const ok = !!(document.execCommand && document.execCommand("copy"));
          ta.remove();
          resolve(ok);
        } catch (err) { resolve(false); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () { resolve(true); }, respaldo);
      } else { respaldo(); }
    });
  }

  // Todos los prompts juntos, cada uno con su título, para pegarlos en un documento
  function textoPrompts() {
    const out = [];
    Array.prototype.forEach.call(prompts.querySelectorAll("details.prompt"), function (d) {
      const pre = d.querySelector(".prompt-texto");
      if (!pre) return;
      out.push("=== " + (d.getAttribute("data-titulo") || "Prompt") + " ===\n\n" + pre.textContent.trim());
    });
    return out.join("\n\n\n") + "\n";
  }

  function copiarTodosPrompts(boton) {
    copiar(textoPrompts()).then(function (ok) {
      msg.textContent = ok
        ? "Los prompts se copiaron juntos, cada uno con su título. Pégalos en un documento y usa el que necesites."
        : "No se pudo copiar automáticamente. Abre cada prompt y selecciona el texto a mano.";
      if (boton) parpadeo(boton, ok ? "¡Copiados!" : "No se pudo");
    });
  }

  document.getElementById("copiar-plantilla").addEventListener("click", function () {
    if (actual === "prompts") { copiarTodosPrompts(null); return; }
    const etiqueta = ETIQUETAS[actual];
    copiar(textoVista()).then(function (ok) {
      msg.textContent = ok
        ? "Plantilla " + etiqueta + " copiada. Pégala en tus notas y rellénala."
        : "No se pudo copiar automáticamente. Usa «Imprimir / guardar PDF» o selecciona el texto a mano.";
    });
  });

  // Botón «Copiar» de cada gancho, cierre o idea de POV
  function parpadeo(boton, txt) {
    const original = boton.getAttribute("data-texto") || boton.textContent;
    boton.setAttribute("data-texto", original);
    boton.textContent = txt;
    clearTimeout(boton._t);
    boton._t = setTimeout(function () { boton.textContent = original; }, 1800);
  }
  guiones.addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest(".btn-gancho") : null;
    if (!b) return;
    const li = b.closest("li");
    const s = li && li.querySelector(".gancho-texto");
    if (!s) return;
    const texto = limpio(s.textContent).replace(/^«/, "").replace(/»$/, "");
    copiar(texto).then(function (ok) {
      parpadeo(b, ok ? "¡Copiado!" : "No se pudo");
      msg.textContent = ok ? "Copiado: " + texto : "No se pudo copiar automáticamente. Selecciona el texto a mano.";
    });
  });

  // Botones de la vista de prompts: copiar uno (aunque esté plegado) o todos
  prompts.addEventListener("click", function (e) {
    const b = e.target.closest ? e.target.closest("button") : null;
    if (!b) return;
    if (b.id === "copiar-todos-prompts") { copiarTodosPrompts(b); return; }
    if (!b.classList.contains("btn-prompt")) return;
    const bloque = b.closest(".bloque");
    const pre = bloque && bloque.querySelector(".prompt-texto");
    if (!pre) return;
    const texto = pre.textContent.trim();
    copiar(texto).then(function (ok) {
      parpadeo(b, ok ? "¡Copiado!" : "No se pudo");
      msg.textContent = ok
        ? "Prompt copiado. Rellena los corchetes [ ] y pégalo en tu IA."
        : "No se pudo copiar automáticamente. Abre el prompt y selecciona el texto a mano.";
    });
  });

  document.getElementById("imprimir-plantilla").addEventListener("click", function () {
    window.print();
  });
})();
