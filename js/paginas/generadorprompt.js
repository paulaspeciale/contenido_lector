/* Generador de prompt · arma un prompt de calendario de contenido a partir de
   los campos del formulario.

   - Todo ocurre en el navegador: no se envía nada; solo se guardan en local
     los eventos que confirmes al importar el plan.
   - Los campos vacíos se sustituyen por PEND, para que la IA proponga el dato y
     lo marque como supuesto.
   - Copiar usa la Clipboard API y, si no está disponible, deja el texto
     seleccionado para copiarlo a mano. Descargar genera un .txt con Blob.
   - Los ids de CAMPOS deben coincidir con los del HTML.
   - La importación del plan carga aparte js/nucleo/plan.js. Si el navegador
     bloquea los módulos (file://), el prompt sigue funcionando. */
(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };
  const form = $("f");
  const salida = $("salida");
  if (!form || !salida) return;

  const PEND = "[sin dato: propón tú y márcalo como supuesto]";
  const CAMPOS = ["marca", "cara", "tam", "horas", "idioma", "dur", "pps", "inicio", "fechaInicio", "dias", "mezcla", "gen", "tropos", "aut", "evitar", "leidos", "pend", "aband", "datos", "obj", "obj2", "enfoque", "publico", "no", "ref", "tono"];

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
    "- Antes de empezar, si falta algún dato esencial, haz como máximo 3 preguntas; si no, avanza con supuestos marcados.",
    "",
    "# 5. ARCHIVO JSON PARA EL CALENDARIO",
    "",
    "Al final de la respuesta, y solo en la última parte si entregas el plan por bloques, incluye un único bloque JSON válido entre vallas ```json. El bloque debe poder leerse tal cual: sin comentarios, sin explicaciones y sin texto dentro de las llaves.",
    "",
    "```json",
    "{",
    '  "tipo": "plan-calendario",',
    '  "version": 1,',
    '  "inicio": "AAAA-MM-DD",',
    '  "publicaciones": [',
    "    {",
    '      "dia": 1,',
    '      "fecha": "AAAA-MM-DD",',
    '      "titulo": "Título corto de la publicación",',
    '      "formato": "Reel",',
    '      "gancho": "Frase exacta del gancho",',
    '      "cta": "Llamada a la acción",',
    '      "produccion": "Notas de producción"',
    "    }",
    "  ]",
    "}",
    "```",
    "",
    "Reglas del archivo:",
    "- Una entrada por publicación principal del calendario. No incluyas historias diarias, días de descanso ni ideas descartadas.",
    "- `dia` es el número de día del plan: 1 es el primer día y avanza sin saltos hasta el último.",
    "- `fecha` debe ser la fecha real de esa publicación (AAAA-MM-DD) y coincidir con la fecha de inicio más `dia` menos 1.",
    "- `titulo` debe ser corto y concreto (máximo 80 caracteres), sin la fecha ni el número de día.",
    "- `formato` debe ser exactamente `Post`, `Carrusel` o `Reel`.",
    "- `gancho`, `cta` y `produccion` pueden ser breves, pero no los omitas.",
    "- Usa comillas dobles, no dejes comas finales y no metas Markdown dentro de los valores.",
    "- Si el plan no cabe en una respuesta, entrega primero el texto y, en la última parte, el bloque JSON completo con todas las publicaciones."
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
      "- Fecha de inicio (día 1 del plan): " + valor("fechaInicio"),
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
    avisarFechaInicio();
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

  // Avisa al importador (si ya cargó) de que la fecha del formulario cambió
  // de forma programática al cargar el ejemplo o vaciar los campos.
  function avisarFechaInicio() {
    const fecha = $("fechaInicio");
    if (fecha) fecha.dispatchEvent(new Event("input", { bubbles: true }));
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
      fechaInicio: "2026-11-02",
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
    avisarFechaInicio();
    armar();
    msg("Ejemplo cargado. Cámbialo por tus datos.");
  });

  // ---- Añadir al calendario el plan JSON que devuelve la IA ----
  // El archivo o el texto pegado se validan con js/nucleo/plan.js. La revisión
  // muestra qué se añadirá y qué se omite antes de escribir nada.
  function iniciarPlan(mod) {
    const planInicio = $("plan-inicio");
    const planSemanas = $("plan-semanas");
    const planArchivo = $("plan-archivo");
    const planTexto = $("plan-texto");
    const planRevisar = $("plan-revisar");
    const planPreview = $("plan-preview");
    const planMsg = $("plan-msg");
    const planIr = $("plan-ir");
    let planCrudo = null;
    let planRevisado = null;

    function nodo(tag, cls, txt) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (txt !== undefined) n.textContent = txt;
      return n;
    }
    function hoyIso() {
      const d = new Date();
      return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    }
    function fechaCorta(iso) {
      const p = iso.split("-").map(Number);
      return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
    }
    function avisoPlan(texto, esError) {
      planMsg.textContent = texto;
      planMsg.classList.toggle("error", !!esError);
    }
    function semanasValor() {
      const n = Number(planSemanas.value);
      return Number.isInteger(n) ? Math.max(-52, Math.min(52, n)) : 0;
    }

    // La fecha de importación sigue a la fecha exacta del formulario mientras
    // nadie la cambie a mano; si no hay fecha, se usa hoy.
    let planInicioAuto = true;
    function sincronizarInicioPlan() {
      if (!planInicio || !planInicioAuto) return;
      const delFormulario = $("fechaInicio").value;
      planInicio.value = /^\d{4}-\d{2}-\d{2}$/.test(delFormulario) ? delFormulario : hoyIso();
    }
    if (!planInicio.value) sincronizarInicioPlan();
    planInicio.addEventListener("input", function () { planInicioAuto = false; });
    ["input", "change"].forEach(function (evento) {
      $("fechaInicio").addEventListener(evento, function () {
        if (!planInicioAuto) return;
        sincronizarInicioPlan();
        if (planCrudo) pintarRevision();
      });
    });

    planArchivo.addEventListener("change", function () {
      const archivo = planArchivo.files && planArchivo.files[0];
      if (!archivo) return;
      const lector = new FileReader();
      lector.onload = function () {
        planTexto.value = String(lector.result || "");
        planArchivo.value = "";
        planCrudo = null;
        planRevisado = null;
        planPreview.hidden = true;
        planIr.hidden = true;
        avisoPlan("Archivo cargado. Revisa la fecha de inicio y pulsa «Revisar plan».");
        planTexto.focus();
      };
      lector.onerror = function () {
        planArchivo.value = "";
        avisoPlan("No se pudo leer el archivo.", true);
      };
      lector.readAsText(archivo);
    });

    planTexto.addEventListener("input", function () {
      if (!planCrudo) return;
      planCrudo = null;
      planRevisado = null;
      planPreview.hidden = true;
      planIr.hidden = true;
      avisoPlan("El texto cambió. Pulsa «Revisar plan» para comprobar el contenido otra vez.");
    });

    function pintarRevision(enfocar) {
      if (!planCrudo) return;
      if (!planInicio.value) {
        planRevisado = null;
        planPreview.hidden = true;
        avisoPlan("Elige la fecha del primer día del plan.", true);
        return;
      }

      const r = mod.normalizarPlan(planCrudo, { inicio: planInicio.value, semanas: semanasValor() });
      planRevisado = r.plan;
      planPreview.textContent = "";
      planPreview.hidden = false;
      planIr.hidden = true;

      if (!r.plan) {
        avisoPlan("No se puede añadir este plan. Revisa los errores de abajo.", true);
        const lista = nodo("ul", "plan-errores");
        r.errores.forEach(function (e) { lista.appendChild(nodo("li", "", e)); });
        planPreview.appendChild(lista);
        if (enfocar) planPreview.focus({ preventScroll: true });
        return;
      }

      const pubs = r.plan.publicaciones;
      const a = mod.analizarImportacion(r.plan);
      const fechas = pubs.map(function (p) { return p.fecha; }).sort();
      const cab = nodo("p", "plan-resumen");
      cab.appendChild(nodo("strong", "", pubs.length + (pubs.length === 1 ? " publicación" : " publicaciones")));
      cab.appendChild(document.createTextNode(" del " + fechaCorta(fechas[0]) + " al " + fechaCorta(fechas[fechas.length - 1]) + "."));
      planPreview.appendChild(cab);

      const cuenta = nodo("p", "plan-cuenta");
      const partes = [a.anadibles === 1 ? "Se añadirá 1." : "Se añadirán " + a.anadibles + "."];
      if (a.duplicados) partes.push(a.duplicados === 1
        ? "1 ya está en el calendario (misma fecha y título)."
        : a.duplicados + " ya están en el calendario (misma fecha y título).");
      if (a.sinSitio) partes.push(a.sinSitio === 1
        ? "1 no cabe: el máximo es " + a.maximo + " eventos."
        : a.sinSitio + " no caben: el máximo es " + a.maximo + " eventos.");
      cuenta.textContent = partes.join(" ");
      planPreview.appendChild(cuenta);

      if (r.errores.length) {
        planPreview.appendChild(nodo("p", "plan-subtitulo", "Entradas que no se añadirán"));
        const lista = nodo("ul", "plan-errores");
        r.errores.slice(0, 12).forEach(function (e) { lista.appendChild(nodo("li", "", e)); });
        if (r.errores.length > 12) lista.appendChild(nodo("li", "", "Y " + (r.errores.length - 12) + " más."));
        planPreview.appendChild(lista);
      }

      if (r.avisos.length) {
        planPreview.appendChild(nodo("p", "plan-subtitulo", "Avisos"));
        const lista = nodo("ul", "plan-avisos");
        r.avisos.slice(0, 12).forEach(function (e) { lista.appendChild(nodo("li", "", e)); });
        if (r.avisos.length > 12) lista.appendChild(nodo("li", "", "Y " + (r.avisos.length - 12) + " más."));
        planPreview.appendChild(lista);
      }

      planPreview.appendChild(nodo("p", "plan-subtitulo", "Primeras publicaciones"));
      const lista = nodo("ol", "plan-lista");
      pubs.slice(0, 12).forEach(function (p) {
        const li = nodo("li", "");
        li.appendChild(nodo("span", "plan-fecha", fechaCorta(p.fecha)));
        li.appendChild(nodo("span", "plan-titulo", p.titulo));
        if (p.formato) li.appendChild(nodo("span", "chip formato-" + p.formato.toLowerCase(), p.formato));
        if (p.gancho) li.appendChild(nodo("span", "plan-gancho", "Gancho: " + p.gancho));
        lista.appendChild(li);
      });
      if (pubs.length > 12) lista.appendChild(nodo("li", "plan-mas", "Y " + (pubs.length - 12) + " más."));
      planPreview.appendChild(lista);

      const acciones = nodo("div", "plan-acciones");
      const confirmar = nodo("button", "primario", a.anadibles
        ? "Añadir " + a.anadibles + (a.anadibles === 1 ? " publicación" : " publicaciones") + " al calendario"
        : "No hay publicaciones nuevas que añadir");
      confirmar.type = "button";
      confirmar.setAttribute("data-plan-confirmar", "1");
      confirmar.disabled = a.anadibles === 0;
      acciones.appendChild(confirmar);
      const cancelar = nodo("button", "", "Cancelar");
      cancelar.type = "button";
      cancelar.setAttribute("data-plan-cancelar", "1");
      acciones.appendChild(cancelar);
      planPreview.appendChild(acciones);

      if (a.anadibles) {
        if (!r.errores.length) {
          avisoPlan("Plan revisado. Comprueba la lista y confirma para añadirlo al calendario.");
        } else {
          const suma = a.anadibles === 1 ? "se añadirá 1 publicación" : "se añadirán " + a.anadibles + " publicaciones";
          const resto = r.errores.length === 1 ? "1 entrada no se podrá añadir" : r.errores.length + " entradas no se podrán añadir";
          avisoPlan("Plan revisado: " + suma + " y " + resto + ". Revisa la lista antes de confirmar.");
        }
      } else {
        avisoPlan("No se añadirá nada: todas las publicaciones ya están o no caben en el calendario.", true);
      }

      if (enfocar) planPreview.focus({ preventScroll: true });
    }

    function revisarPlan() {
      const texto = planTexto.value.trim();
      if (!texto) {
        planPreview.hidden = true;
        avisoPlan("Pega el JSON o carga un archivo primero.", true);
        planTexto.focus();
        return;
      }
      const objeto = mod.extraerJson(texto);
      if (!objeto) {
        planPreview.hidden = true;
        avisoPlan("No se encontró un objeto JSON en el texto. Pega el bloque completo que devolvió la IA o carga el archivo.", true);
        return;
      }
      // Si nadie tocó la fecha de importación, se respeta la del propio plan.
      if (planInicioAuto && typeof objeto.inicio === "string" && mod.fechaValida(objeto.inicio)) {
        planInicio.value = objeto.inicio;
      }
      planCrudo = objeto;
      pintarRevision(true);
    }

    planRevisar.addEventListener("click", revisarPlan);
    planTexto.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        revisarPlan();
      }
    });
    planInicio.addEventListener("change", function () { if (planCrudo) pintarRevision(); });
    planSemanas.addEventListener("change", function () {
      let n = parseInt(planSemanas.value, 10);
      if (!isFinite(n)) n = 0;
      n = Math.max(-52, Math.min(52, n));
      planSemanas.value = String(n);
      if (planCrudo) pintarRevision();
    });

    planPreview.addEventListener("click", function (e) {
      const b = e.target.closest ? e.target.closest("button") : null;
      if (!b) return;
      if (b.hasAttribute("data-plan-cancelar")) {
        planPreview.hidden = true;
        planCrudo = null;
        planRevisado = null;
        avisoPlan("Importación cancelada. No se cambió nada.");
        planTexto.focus();
        return;
      }
      if (!b.hasAttribute("data-plan-confirmar") || !planRevisado) return;

      const r = mod.importarPlan(planRevisado);
      if (!r.ok) {
        avisoPlan(r.error || "No se pudo importar el plan.", true);
        return;
      }
      let texto = r.anadidos
        ? "Añadidas " + r.anadidos + (r.anadidos === 1 ? " publicación" : " publicaciones") + " al calendario."
        : "No se añadió ninguna publicación.";
      if (r.duplicados) texto += " " + r.duplicados + (r.duplicados === 1 ? " ya estaba" : " ya estaban") + " (misma fecha y título).";
      if (r.sinSitio) texto += " " + r.sinSitio + " no " + (r.sinSitio === 1 ? "cabe" : "caben") + ": el máximo es " + mod.MAX_EVENTOS + " eventos.";
      avisoPlan(texto);
      planPreview.hidden = true;
      planCrudo = null;
      planRevisado = null;
      planIr.hidden = false;
      planIr.focus({ preventScroll: true });
    });
  }

  armar();

  // Carga diferida: el generador de prompt no depende de este módulo.
  import("../nucleo/plan.js").then(function (mod) {
    iniciarPlan(mod);
  }, function () {
    const m = $("plan-msg");
    if (m) m.textContent = "La importación necesita abrirse desde un servidor local o el sitio publicado: el navegador bloquea los módulos con doble clic. El prompt funciona igual.";
  });
})();
