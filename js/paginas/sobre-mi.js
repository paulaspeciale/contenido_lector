/* Copiar el alias de Mercado Pago con un botón.
   Usa Clipboard API y, si no está disponible o falla, un <textarea> temporal
   con execCommand. El mensaje de resultado se muestra junto al botón. */
(function () {
  "use strict";
  function copiable(idBtn, idTexto, idMsg, queCopia) {
    const btn = document.getElementById(idBtn);
    const msg = document.getElementById(idMsg);
    const texto = document.getElementById(idTexto).textContent;
    function aviso(ok) { msg.textContent = ok ? queCopia + " copiado." : "No se pudo copiar. Selecciónalo y cópialo a mano."; }
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
        aviso(ok);
      } catch (err) { aviso(false); }
    }
    btn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () { aviso(true); }, respaldo);
      } else { respaldo(); }
    });
  }
  copiable("copiar-alias", "alias-mp", "alias-msg", "Alias");
})();
