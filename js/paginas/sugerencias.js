/* Sugerencias · validación y envío del formulario a FormSubmit.

   - Con FORM_URL vacía, el formulario se oculta y se muestra un aviso con las
     redes (no se simula ningún envío).
   - Protecciones antispam: campo trampa _honey y rechazo de envíos en menos
     de 3 segundos desde que se abrió la página.
   - Tras enviar, FormSubmit vuelve con ?enviado=1 y se muestra el mensaje de éxito.
   - No se muestra ningún correo en la página. */
(function () {
  "use strict";
  // Dirección del formulario en FormSubmit. NO pongas aquí tu correo: usa la dirección con código
  // aleatorio que te da FormSubmit al activar el formulario (formato https://formsubmit.co/el/CODIGO).
  // Con la dirección vacía el formulario se oculta y se muestra un aviso (no se simula el envío).
  const FORM_URL = "";
  const form = document.getElementById("form-sugerencias");
  const exito = document.getElementById("form-exito");
  const error = document.getElementById("form-error");
  const btn = document.getElementById("btn-enviar");
  const pronto = document.getElementById("form-pronto");
  const siguiente = document.getElementById("form-next");
  const abierto = Date.now();

  if (FORM_URL) { form.setAttribute("action", FORM_URL); }
  else { form.hidden = true; pronto.hidden = false; }

  // Tras enviar, FormSubmit (con su captcha) vuelve aquí con ?enviado=1
  if (/^https?:$/.test(location.protocol)) {
    siguiente.value = location.origin + location.pathname + "?enviado=1";
  } else {
    siguiente.disabled = true;
  }
  if (/[?&]enviado=1(&|$)/.test(location.search)) {
    form.hidden = true;
    pronto.hidden = true;
    exito.hidden = false;
    exito.focus();
  }

  form.addEventListener("submit", function (e) {
    error.textContent = "";
    const trampa = form.elements["_honey"];
    if (trampa && trampa.value) { e.preventDefault(); return; }          // un robot rellenó el campo oculto
    if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
    if (!FORM_URL) { e.preventDefault(); return; }
    if (Date.now() - abierto < 3000) {                                    // envío demasiado rápido
      e.preventDefault();
      error.textContent = "Espera unos segundos antes de enviar.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Enviando…";
  });

  // Si se vuelve atrás desde la página del captcha, el botón no debe quedar bloqueado
  window.addEventListener("pageshow", function () {
    btn.disabled = false;
    btn.textContent = "Enviar";
  });
})();
