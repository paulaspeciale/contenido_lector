/* Generador de prompt · arma un prompt de calendario de contenido a partir de
   los campos del formulario.

   - Todo ocurre en el navegador: no se envía ni se guarda nada.
   - Los campos vacíos se sustituyen por PEND, para que la IA proponga el dato y
     lo marque como supuesto.
   - Copiar usa la Clipboard API y, si no está disponible, deja el texto
     seleccionado para copiarlo a mano. Descargar genera un .txt con Blob.
   - Los ids de CAMPOS deben coincidir con los del HTML. */
(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };
  const form = $("f");
  const salida = $("salida");
  if (!form || !salida) return;

  const PEND = "[sin dato: propón tú y márcalo como supuesto]";
  const CAMPOS = ["marca", "cara", "tam", "horas", "idioma", "dur", "pps", "inicio", "dias", "mezcla", "gen", "tropos", "aut", "evitar", "leidos", "pend", "aband", "datos", "obj", "obj2", "enfoque", "publico", "no", "ref", "tono"];

  // Devuelve el valor del campo o el aviso de dato pendiente.
  function valor(id) {
    const texto = $(id).value.trim();
    return texto || PEND;
  }

  function redes() {
    const marcadas = Array.prototype.slice.call(document.querySelectorAll("input[name=red]:checked")).map(function (casilla) {
      return casilla.value;
    });
    return marcadas.length ? marcadas.join(", ") : PEND;
  }

  // Parte fija del prompt: lo que se le pide a la IA, independientemente de los
  // datos de la persona.
  const FIJO = [
    "# 2. QUÉ DEBES ENTREGAR (en este orden)",
    "",
    "1. Diagnóstico: qué errores comunes evita este plan (formatos saturados, posts sueltos, métricas de vanidad). Si te doy un plan anterior, compáralo en una tabla.",
    "2. Posicionamiento: una frase-promesa y 3 promesas concretas (por ejemplo ahorro, criterio, datos). Cada pieza debe cumplir al menos una.",
    "3. Franquicias: 3 a 5 formatos con nombre propio, estructura fija y frecuencia previsible. Tabla con nombre, qué es, formato y duración, frecuencia y función (conversión, alcance, comunidad, diferenciación). Opcional: una «temporada» o evento recurrente en historias.",
    "4. Reglas de contenido: 5 reglas operativas (ej. toda pieza termina en juicio o elección, un solo veredicto, aviso de spoilers en el primer segundo, no reseñar lo no leído).",
    "5. Identidad visual y de marca, adaptada a si muestro o no la cara: paleta con códigos HEX y uso, tipografías, puesta en escena, gesto o sonido que se repite como firma y nomenclatura de series (ej. «EXPEDIENTE N.º 07 · Título · Año»).",
    "6. Producción: sesiones de grabación y diseño al mes con duración y tareas, clips base reutilizables y reglas de guion (gancho en 2 segundos, una idea por pieza, cierre con veredicto, duración).",
    "7. Calendario completo, semana por semana. Cada semana con título temático y objetivo en una frase. Cada publicación con: día, franquicia y número, título, formato y duración, gancho (frase exacta), guion o estructura de placas, CTA y notas de producción.",
    "8. Historias: rutina diaria, las 2 o 3 con función obligatoria (encuesta, avance, votación) y cómo funciona el evento recurrente.",
    "9. Métricas: qué medir y cuándo (guardados, compartidos, visitas al perfil, seguidores nuevos) y reglas de decisión del tipo «si pasa X, hago Y».",
    "10. Perfil: bio de menos de 150 caracteres con promesa verificable, destacadas, posts fijados y regla de 1 de cada 5 piezas autoexplicativa para gente nueva.",
    "11. Después del plan: cómo planificar la temporada siguiente con los datos de esta.",
    "12. Anexo: tabla de libros con número, título, semana, ángulo de la reseña y pieza de alcance.",
    "",
    "# 3. REGLAS DE CALIDAD",
    "",
    "- Cada pieza debe resolver una decisión del lector (leer, comprar, empezar, seguir, regalar) o dar una razón para volver.",
    "- No inventes datos, cifras ni lecturas mías. Usa solo los que te di; si faltan, deja [DATO A COMPLETAR].",
    "- No hagas reseñas de libros que no leí ni afirmes colaboraciones que no existen.",
    "- Prioriza mis géneros y autores favoritos y respeta la lista de «evitar».",
    "- Reparte la variedad: no más de 2 piezas seguidas del mismo género o saga.",
    "- Los ganchos deben ser afirmaciones incómodas o instrucciones concretas, no preguntas genéricas.",
    "- Todo debe ser realizable con el tiempo semanal indicado.",
    "",
    "# 4. FORMATO DE SALIDA",
    "",
    "- Documento con títulos numerados como arriba y tablas para franquicias, paleta, sesiones y anexo.",
    "- Cada publicación con etiquetas en negrita: Formato, Gancho, Guion, CTA, Producción.",
    "- Si no cabe en una respuesta, entrégalo por partes (secciones 1–6, luego semanas de a cuatro, y cierre) y espera mi «continúa».",
    "- Antes de empezar, si falta algún dato esencial, haz como máximo 3 preguntas; si no, avanza con supuestos marcados."
  ].join("\n");

  function armar() {
    const dur = parseInt($("dur").value, 10);
    const pps = parseInt($("pps").value, 10);
    const semanas = Math.ceil(dur / 7);
    const total = semanas * pps;
    const texto = [
      "Actúa como estratega de contenido para creadores literarios (Bookstagram, BookTok, YouTube) y editor de calendarios editoriales. Quiero un plan de contenido completo, accionable y con criterio, no una lista de ideas sueltas.",
      "",
      "# 1. DATOS DE ENTRADA", "",
      "## Perfil",
      "- Cuenta o marca: " + valor("marca"),
      "- Redes: " + redes(),
      "- ¿Muestro la cara?: " + valor("cara"),
      "- Tamaño actual: " + valor("tam"),
      "- Tiempo disponible por semana: " + valor("horas") + " horas",
      "- Idioma y variante: " + valor("idioma"), "",
      "## Calendario",
      "- Duración: " + dur + " días (" + semanas + " semanas)",
      "- Publicaciones por semana: " + pps + " (total: " + total + " publicaciones principales)",
      "- Inicio: " + valor("inicio"),
      "- Días fijos por tipo de pieza: " + valor("dias"),
      "- Mezcla de formatos: " + valor("mezcla"), "",
      "## Preferencias de lectura",
      "- Géneros: " + valor("gen"),
      "- Tropos o subgéneros favoritos: " + valor("tropos"),
      "- Autores o sagas prioritarios: " + valor("aut"),
      "- Autores o géneros a evitar: " + valor("evitar"),
      "- Libros leídos (pueden tener reseña): " + valor("leidos"),
      "- Libros pendientes (solo lista, guía o primera impresión identificada como tal): " + valor("pend"),
      "- Libros abandonados: " + valor("aband"),
      "- Datos de mi registro lector: " + valor("datos"), "",
      "## Objetivos y enfoque",
      "- Objetivo principal: " + valor("obj"),
      "- Objetivo secundario: " + valor("obj2"),
      "- Enfoque o posicionamiento: " + valor("enfoque"),
      "- Público: " + valor("publico"),
      "- Qué no quiero que parezca mi cuenta: " + valor("no"),
      "- Cuentas de referencia: " + valor("ref"),
      "- Tono: " + valor("tono"), "",
      FIJO
    ].join("\n");

    salida.value = texto;
    $("cuenta").textContent = texto.length.toLocaleString("es") + " caracteres";
  }

  function msg(texto) {
    $("msg").textContent = texto;
  }

  form.addEventListener("input", armar);
  form.addEventListener("change", armar);
  // El formulario no se envía: los datos solo viven en esta página.
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  $("copiar").addEventListener("click", function () {
    const texto = salida.value;

    // Respaldo para navegadores sin Clipboard API: deja el texto seleccionado.
    function seleccionar() {
      salida.focus();
      salida.select();
      salida.setSelectionRange(0, texto.length);
      let copiado = false;
      try { copiado = document.execCommand("copy"); } catch (e) { copiado = false; }
      msg(copiado ? "Prompt copiado." : "No se pudo copiar solo: ya quedó seleccionado. Usa Ctrl+C o el menú del teléfono.");
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () {
        msg("Prompt copiado.");
      }, seleccionar);
    } else {
      seleccionar();
    }
  });

  $("bajar").addEventListener("click", function () {
    try {
      const blob = new Blob([salida.value], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "prompt-calendario.txt";
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 0);
      msg("Descarga iniciada.");
    } catch (e) {
      msg("La descarga no está disponible aquí: usa «Copiar prompt».");
    }
  });

  $("limpiar").addEventListener("click", function () {
    CAMPOS.forEach(function (id) {
      const campo = $(id);
      if (campo.tagName === "SELECT") {
        campo.selectedIndex = campo.id === "dur" ? 2 : (campo.id === "pps" ? 1 : 0);
      } else if (campo.type === "number") {
        campo.value = 5;
      } else {
        campo.value = "";
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll("input[name=red]"), function (casilla) {
      casilla.checked = casilla.value !== "YouTube";
    });
    armar();
    msg("Campos vaciados.");
  });

  // Elige una opción por su texto o por su valor; el resto de campos, directo.
  function poner(id, dato) {
    const campo = $(id);
    if (campo.tagName === "SELECT") {
      for (let k = 0; k < campo.options.length; k++) {
        if (campo.options[k].text === dato || campo.options[k].value === dato) {
          campo.selectedIndex = k;
          return;
        }
      }
    } else {
      campo.value = dato;
    }
  }

  $("ejemplo").addEventListener("click", function () {
    const ejemplo = {
      marca: "El Archivo",
      cara: "no, solo manos y voz",
      tam: "0 seguidores",
      horas: "5",
      idioma: "español rioplatense con voseo",
      dur: "90",
      pps: "5",
      inicio: "Noviembre 2026",
      dias: "lunes expediente (reseña con veredicto), miércoles termómetro o autopsia (ranking o tropo), jueves ficha de personaje, sábado archivo o contra-reseña, domingo comunidad",
      mezcla: "mayoría Reels, carruseles de alcance y tres eventos en historias",
      gen: "romantasy, romance contemporáneo, dark romance, paranormal, cozy",
      tropos: "enemies to lovers, fake dating, slow burn, found family",
      aut: "Sarah J. Maas, Rebecca Yarros, Ali Hazelwood",
      evitar: "ninguno",
      leidos: "Una corte de rosas y espinas, Alas de sangre, La hipótesis del amor, Twisted Love, Alas de hierro, Trono de cristal, Divine Rivals",
      pend: "los que tenga en lista de pendientes",
      aband: "3 libros abandonados",
      datos: "273 libros registrados, 133 leídos, 39 pendientes, 3 abandonados",
      obj: "seguidores",
      obj2: "guardados y compartidos",
      enfoque: "criterio: veredictos, datos propios y un dispositivo visual reconocible",
      publico: "lectoras de romantasy que quieren saber si un libro vale la pena antes de comprarlo",
      no: "una biblioteca que solo muestra lo que tiene",
      ref: "",
      tono: "directo y con criterio"
    };

    Object.keys(ejemplo).forEach(function (id) { poner(id, ejemplo[id]); });
    armar();
    msg("Ejemplo cargado. Cámbialo por tus datos.");
  });

  armar();
})();
