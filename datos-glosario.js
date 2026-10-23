/* datos-glosario.js
   Glosario bookish inglés → español. Edita SOLO este archivo para agregar o cambiar términos.
   Cada categoría: { id, titulo, intro, items }. Cada término: [inglés, español, explicación, imprescindible?, ejemplo?]
   Orden: las categorías van de las más usadas a las menos, y dentro de cada una los términos también
   (de más a menos habituales). El 4.º valor en 1 marca los imprescindibles.
   Comparte los datos en window.BT.GLOSARIO_CATS y, aplanados, en window.BT.GLOSARIO. */
(function () {
  "use strict";
  window.BT = window.BT || {};
  var C = [
  { id: "siglas", titulo: "Siglas y abreviaturas", intro: "Lo primero que verás en cualquier reseña, caption o comentario.", items: [
    ["TBR", "Libros pendientes de leer", "To Be Read. Tu lista de pendientes.", 1, "Mi TBR del mes: cinco libros y ninguna fuerza de voluntad."],
    ["DNF", "Libro abandonado", "Did Not Finish. Conviene explicar el motivo.", 1, "DNF en la página 120: el ritmo no me funcionó."],
    ["ARC", "Ejemplar anticipado para lectores", "Advance Reader Copy. Si te lo regalaron, indícalo en el caption.", 1],
    ["CW / TW", "Advertencia de contenido", "Content / Trigger Warning. Avisa de temas delicados sin hacer spoilers.", 1],
    ["HEA", "Final feliz duradero", "Happily Ever After.", 1],
    ["HFN", "Final feliz «por ahora»", "Happy For Now. Esperanzador, pero sin compromiso eterno.", 1],
    ["FMC / MMC", "Protagonista femenina / masculino", "Female / Male Main Character.", 1],
    ["POV", "Punto de vista narrativo", "Point of View. «Dual POV» es doble punto de vista.", 1],
    ["MC", "Personaje protagonista", "Main Character. En ciertos subgéneros también significa motorcycle club."],
    ["LI", "Interés romántico", "Love Interest."],
    ["OTP", "Pareja favorita o ideal", "One True Pairing."],
    ["YA / NA", "Juvenil / new adult", "Young Adult (adolescentes) y New Adult (jóvenes adultos, transición a la adultez).", 1],
    ["CR", "Leyendo actualmente", "Currently Reading. A veces significa Contemporary Romance, según el contexto."],
    ["RH", "Harén inverso", "Reverse Harem. Una protagonista con varios intereses románticos."],
    ["Why Choose", "Sin tener que elegir", "Romance en el que la protagonista no elige a una sola pareja."],
    ["PNR · UF · DF · HR", "Romance paranormal · fantasía urbana · fantasía oscura · romance histórico", "Abreviaturas de género, menos universales."],
    ["KU", "Kindle Unlimited", "Suscripción de lectura de Amazon."],
    ["RTC", "Reseña pendiente", "Review to Come."],
    ["TSTL", "Tan tonta/o que no merece vivir", "Too Stupid to Live. Personaje cuyas decisiones absurdas ponen su vida en peligro."],
    ["UST", "Tensión sexual no resuelta", "Unresolved Sexual Tension."],
    ["WIP", "Obra en proceso", "Work in Progress. Libro que alguien aún está escribiendo."],
    ["ACOTAR · TOG · CC", "Una corte de rosas y espinas · Trono de cristal · Ciudad Medialuna", "Sagas de Sarah J. Maas (SJM)."]
  ]},
  { id: "tropes", titulo: "Tropes románticos", intro: "Patrones narrativos reconocibles: en BookTok funcionan como etiquetas de búsqueda.", items: [
    ["Enemies to Lovers", "De enemigos a amantes", "Empiezan enfrentados y terminan enamorándose.", 1],
    ["Friends to Lovers", "De amigos a amantes", "Una amistad se transforma en amor.", 1],
    ["Slow Burn", "Fuego lento", "La relación tarda en desarrollarse y acumula tensión. Describe el vínculo, no la velocidad del libro.", 1],
    ["Fake Dating", "Citas falsas / relación fingida", "Fingen salir juntos y acaban sintiendo de verdad.", 1],
    ["Forced Proximity", "Proximidad forzada", "Las circunstancias los obligan a pasar tiempo juntos.", 1],
    ["One Bed", "Una sola cama", "Deben compartir cama, por accidente o necesidad.", 1],
    ["Grumpy x Sunshine", "Gruñón × persona radiante", "Una persona malhumorada junto a otra alegre y optimista.", 1],
    ["Second Chance Romance", "Segunda oportunidad", "Una pareja que se separó vuelve a encontrarse.", 1],
    ["Mutual Pining", "Anhelo mutuo", "Se desean, pero ninguno lo confiesa.", 1],
    ["Forbidden Love", "Amor prohibido", "Barreras sociales, familiares, laborales o morales."],
    ["Marriage of Convenience", "Matrimonio por conveniencia", "Se casan por motivos prácticos, económicos o políticos."],
    ["Arranged Marriage", "Matrimonio concertado", "Otras personas organizan la unión."],
    ["Love Triangle", "Triángulo amoroso", "Una persona dividida entre dos posibles parejas."],
    ["Rivals to Lovers", "De rivales a amantes", "La competencia evoluciona hacia el romance."],
    ["Strangers to Lovers", "De desconocidos a amantes", ""],
    ["Hate to Love", "Del odio al amor", "Romance que parte del rechazo o la hostilidad."],
    ["Best Friends to Lovers", "De mejores amigos a amantes", ""],
    ["Childhood Friends to Lovers", "De amigos de la infancia a amantes", ""],
    ["Roommates to Lovers", "De compañeros de piso a amantes", ""],
    ["Friends with Benefits (FWB)", "Amigos con derechos", "Intimidad física sin relación formal, al menos al inicio."],
    ["Workplace Romance", "Romance laboral", "Entre personas que trabajan juntas."],
    ["Boss x Employee", "Jefe/a × empleado/a", "Relación con jerarquía laboral."],
    ["Bodyguard Romance", "Romance con guardaespaldas", ""],
    ["Royal Romance", "Romance real", "Los protagonistas pertenecen a la realeza."],
    ["Snowed In · Stranded Together", "Aislados por la nieve · varados juntos", "Quedan atrapados en el mismo lugar."],
    ["Opposites Attract", "Los opuestos se atraen", "Personalidades o estilos de vida contrastantes."],
    ["Secret Relationship", "Relación secreta", ""],
    ["Unrequited Love", "Amor no correspondido", ""],
    ["Hurt/Comfort", "Dolor y consuelo", "Un personaje sufre y el otro lo cuida."],
    ["Age Gap", "Diferencia de edad", "Conviene precisar cuántos años hay de diferencia."],
    ["Bully Romance", "Romance con acoso o intimidación", "Indica la dinámica concreta con un CW."]
  ]},
  { id: "pareja", titulo: "Devoción, protección y dinámica de pareja", intro: "Cómo se quieren, se protegen y se complementan los protagonistas.", items: [
    ["He Falls First", "Él se enamora primero", "Variante: «He falls first and harder» (y con más intensidad).", 1],
    ["Touch Her and Die", "Tócala y muere", "Amenaza protectora hacia quien lastime a la persona amada.", 1],
    ["Who Did This to You?", "«¿Quién te hizo esto?»", "Furia protectora ante una herida de la persona amada.", 1],
    ["Down Bad", "Perdidamente enamorado/a", "Muy enamorado o fascinado por alguien."],
    ["I'd Burn the World for You", "Quemaría el mundo por ti", "Devoción extrema."],
    ["Only Soft for Her", "Solo es tierno con ella", "Distante con todos, afectuoso con su pareja."],
    ["Possessive / Overprotective Love Interest", "Interés romántico posesivo / sobreprotector", "Marca la dinámica en el CW si es intensa."],
    ["Jealous Hero", "Protagonista celoso", ""],
    ["Golden Retriever x Black Cat", "Golden retriever × gato negro", "Alguien cálido y leal junto a alguien reservado y distante."],
    ["Gentle Giant", "Gigante amable", "Imponente por fuera, tierno por dentro."],
    ["Fated Mates", "Parejas predestinadas", "Un vínculo sobrenatural las une."],
    ["Soulmates", "Almas gemelas", ""],
    ["Ride or Die", "Incondicional", "Permanece al lado de la otra persona pase lo que pase."],
    ["Us Against the World", "Nosotros contra el mundo", ""],
    ["Love at First Sight", "Amor a primera vista", ""],
    ["Insta-Love", "Amor instantáneo", "A veces se percibe como poco desarrollado."],
    ["Power Couple", "Pareja poderosa", "Dos personajes fuertes que funcionan como equipo."],
    ["Soft for Her", "Se ablanda con ella", ""]
  ]},
  { id: "generos", titulo: "Géneros y subgéneros", intro: "Qué tipo de libro es. Pueden combinarse: dark romantasy + gothic + slow burn.", items: [
    ["Romantasy", "Fantasía romántica", "Romance y fantasía con el mismo peso narrativo.", 1],
    ["Dark Romance", "Romance oscuro", "Dinámicas intensas, temas tabú o elementos perturbadores.", 1],
    ["Contemporary Romance", "Romance contemporáneo", "Ambientado en la actualidad.", 1],
    ["Dark Academia", "Academia oscura", "Instituciones académicas, secretos y ambientes sombríos.", 1],
    ["Historical Romance", "Romance histórico", ""],
    ["Fantasy Romance", "Romance fantástico", "Fantasía con trama romántica importante."],
    ["Paranormal Romance", "Romance paranormal", "Criaturas o fenómenos sobrenaturales."],
    ["Romantic Comedy (Rom-Com)", "Comedia romántica", ""],
    ["Cozy Fantasy", "Fantasía acogedora", "Comodidad, vida cotidiana y conflictos de menor escala."],
    ["Epic Fantasy", "Fantasía épica", "Mundos extensos y conflictos de gran escala."],
    ["Urban Fantasy", "Fantasía urbana", ""],
    ["Dark Fantasy", "Fantasía oscura", ""],
    ["Gothic Romance", "Romance gótico", "Misterio, atmósferas sombrías y secretos."],
    ["Romantic Suspense", "Romance de suspenso", "Romance junto a un misterio o peligro."],
    ["Psychological Thriller", "Thriller psicológico", ""],
    ["Sports Romance", "Romance deportivo", ""],
    ["Mafia Romance", "Romance de mafia", ""],
    ["Small-Town Romance", "Romance de pueblo pequeño", ""],
    ["Campus Romance", "Romance universitario", ""],
    ["Billionaire Romance", "Romance de multimillonarios", ""],
    ["Sapphic Romance", "Romance sáfico", "Entre mujeres o personas de identidades sáficas."],
    ["M/M · F/F Romance", "Romance entre hombres · entre mujeres", ""],
    ["Queer Romance", "Romance queer", ""],
    ["Erotic Romance", "Romance erótico", "La sexualidad explícita tiene un papel importante."],
    ["Dystopian Romance", "Romance distópico", ""],
    ["Magical Realism", "Realismo mágico", "Lo extraordinario integrado en lo cotidiano."],
    ["Light Academia", "Academia luminosa", "Versión cálida de la estética académica."],
    ["Women's Fiction", "Ficción centrada en experiencias de mujeres", "No necesariamente romántica."]
  ]},
  { id: "personajes", titulo: "Personajes y arquetipos", intro: "Para describir cómo es quien protagoniza (o complica) la historia.", items: [
    ["Morally Grey", "Moralmente ambiguo/a", "Ni héroe ni villano: decisiones éticamente complejas.", 1],
    ["Red Flag · Green Flag", "Señal de alarma · señal positiva", "Conductas problemáticas o saludables en un personaje.", 1],
    ["Cinnamon Roll", "Personaje adorable y bondadoso", ""],
    ["Antihero", "Antihéroe", ""],
    ["Villain / Villainess", "Villano / villana", ""],
    ["Bad Boy", "Chico malo", ""],
    ["Brooding", "Taciturno y atormentado", ""],
    ["Badass Heroine", "Heroína de armas tomar", ""],
    ["Strong Female Lead", "Protagonista femenina fuerte", ""],
    ["Reluctant Hero", "Héroe a su pesar", ""],
    ["Byronic Hero", "Héroe byroniano", "Oscuro, orgulloso, atormentado y complejo."],
    ["Femme Fatale", "Mujer fatal", ""],
    ["Final Girl", "La última superviviente", ""],
    ["Unreliable Narrator", "Narrador/a no fiable", "Su versión puede ser engañosa o incompleta."],
    ["Unlikable Protagonist", "Protagonista difícil de querer", ""],
    ["Emotionally Unavailable", "Emocionalmente inaccesible", ""],
    ["Trust Issues", "Problemas para confiar", ""],
    ["Redemption Arc", "Arco de redención", "Intenta reparar el daño que causó."],
    ["Healing Arc", "Arco de sanación", ""],
    ["Revenge Arc", "Arco de venganza", ""],
    ["Character Arc", "Arco de personaje", "Cómo cambia a lo largo de la historia."]
  ]},
  { id: "trama", titulo: "Trama, ritmo y finales", intro: "El lenguaje de la estructura: giros, ritmo, puntos de vista y cierres.", items: [
    ["Plot Twist", "Giro argumental", "Un hecho cambia cómo se interpreta la trama.", 1],
    ["Cliffhanger", "Final en suspenso", "Termina con algo importante sin resolver.", 1],
    ["Standalone", "Autoconclusivo", "Se entiende como historia completa.", 1],
    ["Series Starter", "Primer libro de una saga", ""],
    ["Open Ending", "Final abierto", ""],
    ["Bittersweet Ending", "Final agridulce", ""],
    ["Rushed Ending", "Final apresurado", ""],
    ["Pacing", "Ritmo narrativo", "Fast-paced (rápido), slow-paced (lento) o well-paced (bien llevado)."],
    ["Page-Turner · Unputdownable", "Libro que engancha · imposible de soltar", ""],
    ["Character-Driven · Plot-Driven", "Centrado en personajes · centrado en la trama", ""],
    ["Dual POV · Multiple POVs", "Doble · múltiples puntos de vista", ""],
    ["Dual Timeline", "Doble línea temporal", ""],
    ["Retelling", "Reinterpretación", "Reimagina un cuento, mito o historia conocida."],
    ["Spin-Off · Sequel · Prequel", "Obra derivada · secuela · precuela", ""],
    ["Companion Novel", "Novela complementaria", "Amplía el universo, a veces desde otra perspectiva."],
    ["Red Herring", "Pista falsa", ""],
    ["Foreshadowing", "Anticipación narrativa", "Indicios que preparan un hecho posterior."],
    ["Whodunit", "¿Quién lo hizo?", "Misterio sobre quién es el culpable."],
    ["Heist", "Atraco planificado", ""],
    ["Betrayal", "Traición", ""],
    ["Secret Identity", "Identidad secreta", ""],
    ["Blackmail", "Chantaje", ""],
    ["Plot Armor", "Protección argumental", "El personaje sobrevive porque la trama lo necesita."],
    ["Plot Hole", "Agujero argumental", ""],
    ["Deus Ex Machina", "Resolución inesperada que salva la trama", ""],
    ["Info-Dumping", "Exceso de información de golpe", ""],
    ["Alternate Universe (AU)", "Universo alternativo", ""]
  ]},
  { id: "fantasia", titulo: "Fantasía, paranormal y romantasy", intro: "Tropos de mundos mágicos, criaturas y política de corte.", items: [
    ["Found Family", "Familia encontrada / elegida", "Un grupo sin lazos de sangre construye una familia emocional.", 1],
    ["Chosen One", "El elegido / la elegida", "Destinado por una profecía a cumplir una misión.", 1],
    ["Worldbuilding", "Construcción de mundo", "Geografía, historia, culturas y reglas del universo.", 1],
    ["Magic System (Hard / Soft)", "Sistema de magia (rígido / flexible)", "Reglas explícitas o magia que conserva el misterio."],
    ["Lore", "Trasfondo y mitología", ""],
    ["Prophecy", "Profecía", ""],
    ["Fae Romance", "Romance feérico", ""],
    ["Dragon Rider · Dragon Shifter", "Jinete de dragón · cambiaformas dragón", ""],
    ["Vampire · Werewolf · Shifter Romance", "Romance de vampiros · hombres lobo · cambiaformas", ""],
    ["Monster Romance", "Romance con monstruos", ""],
    ["Witch Romance", "Romance de brujas", ""],
    ["Secret Heir / Lost Heir", "Heredero/a secreto/a / perdido/a", ""],
    ["Hidden Identity", "Identidad oculta", ""],
    ["Court Politics · Royal Intrigue", "Política y intrigas de corte", ""],
    ["Magic Academy", "Academia de magia", ""],
    ["Deadly Trials", "Pruebas mortales", ""],
    ["Quest", "Búsqueda / misión", ""],
    ["Enemies to Allies", "De enemigos a aliados", "No implica que terminen enamorados."],
    ["Blood Oath", "Juramento de sangre", ""],
    ["Mate Bond · Mate Rejection", "Vínculo de pareja · rechazo del vínculo", "Común en historias de cambiaformas."],
    ["Immortal x Mortal", "Inmortal × mortal", ""],
    ["Omegaverse (A/B/O)", "Omegaverso", "Jerarquías alfa, beta y omega. Suele incluir contenido adulto: avísalo con un CW."]
  ]},
  { id: "spice", titulo: "Spice y nivel de explicitud", intro: "Cuánto contenido sensual hay y cómo se muestra. Indica el nivel sin detallar las escenas.", items: [
    ["Spicy", "Picante", "Contiene escenas sensuales o sexuales. Se marca con 🌶️.", 1],
    ["Spice Level", "Nivel de picante", "Escala del 🌶️ al 🌶️🌶️🌶️🌶️🌶️.", 1],
    ["Closed Door", "Puerta cerrada", "La intimidad ocurre fuera de escena.", 1],
    ["Open Door", "Puerta abierta", "Las escenas íntimas se muestran.", 1],
    ["Fade to Black", "Fundido a negro", "La narración omite los detalles."],
    ["No / Low / Medium / High Spice", "Sin · poco · moderado · muy picante", ""],
    ["Steamy", "Sensual, apasionado", ""],
    ["Sweet Romance · Clean Romance", "Romance tierno · sin contenido explícito", "«Clean» depende de la comunidad o editorial."],
    ["Smut", "Contenido sexual explícito", "Término informal."],
    ["Erotica", "Literatura erótica", ""],
    ["Sexual Tension", "Tensión sexual", ""],
    ["Chemistry", "Química", "Conexión entre personajes."],
    ["Banter", "Diálogo ingenioso y provocador", ""],
    ["Kink · BDSM", "Preferencias no convencionales · BDSM", ""],
    ["Dom / Sub", "Dominante / sumiso/a", "Roles en una dinámica consensuada."],
    ["Dubcon · Noncon · CNC", "Consentimiento dudoso · ausencia de consentimiento · no consentimiento pactado", "Siempre conviene avisar con un CW."],
    ["Praise Kink", "Excitación por elogios", ""],
    ["Aftercare", "Cuidados posteriores", "Atención física y emocional tras una escena íntima."]
  ]},
  { id: "cw", titulo: "Content warnings habituales", intro: "Temas que conviene avisar sin hacer spoilers.", items: [
    ["Graphic Violence", "Violencia gráfica", "", 1],
    ["Sexual Assault · Sexual Violence", "Agresión sexual · violencia sexual", "", 1],
    ["Emotional / Physical / Domestic Abuse", "Abuso emocional / físico / violencia doméstica", "", 1],
    ["Self-Harm · Suicide", "Autolesiones · suicidio", ""],
    ["Eating Disorder", "Trastorno de la conducta alimentaria", ""],
    ["Grief · Death of a Loved One", "Duelo · muerte de un ser querido", ""],
    ["Miscarriage · Pregnancy Loss", "Aborto espontáneo · pérdida del embarazo", ""],
    ["Stalking · Kidnapping · Captivity", "Acoso persistente · secuestro · cautiverio", ""],
    ["Torture", "Tortura", ""],
    ["Drug Use · Addiction", "Consumo de drogas · adicción", ""],
    ["Animal Death", "Muerte de un animal", ""],
    ["Child Abuse", "Maltrato infantil", ""],
    ["Bullying · Racism · Homophobia · Transphobia", "Acoso · racismo · homofobia · transfobia", ""],
    ["On-Page / Off-Page Death", "Muerte en escena / fuera de escena", ""],
    ["Content Note", "Nota de contenido", "Informa de un tema sin afirmar que desencadenará una reacción."]
  ]},
  { id: "reacciones", titulo: "Reacciones, jerga y valoración", intro: "Cómo hablan los lectores en comentarios y cómo valoran un libro. Es jerga informal: no la uses como traducción literal en reseñas formales.", items: [
    ["Book Boyfriend / Girlfriend / Husband", "Novio / novia / marido literario", "Personaje ficticio del que estás enamorada/o.", 1],
    ["This book ruined me", "Este libro me destrozó", "", 1],
    ["I'm unwell", "No estoy bien después de esto", "Hipérbole de internet.", 1],
    ["I'm kicking my feet", "Estoy dando pataditas de emoción", ""],
    ["Rent-free", "Gratis en mi cabeza", "No dejo de pensar en ello."],
    ["The chokehold this book has on me", "Lo atrapada que me tiene este libro", ""],
    ["Feral · Unhinged", "Desatado/a · sin filtros", ""],
    ["He ate / She ate", "Se lució", ""],
    ["He understood the assignment", "Entendió perfectamente lo que tenía que hacer", ""],
    ["I can fix him", "Yo puedo cambiarlo", ""],
    ["Let him cook", "Déjalo hacer lo suyo", ""],
    ["Read it in one sitting", "Lo leí de una sentada", ""],
    ["Book Hangover", "Resaca literaria", "No puedes empezar otro libro tras uno que te marcó."],
    ["Reading Slump", "Bloqueo o bajón lector", ""],
    ["Swoon-Worthy", "Que te hace suspirar", ""],
    ["Angst · Yearning", "Angustia · anhelo intenso", ""],
    ["Tearjerker", "Libro que hace llorar", ""],
    ["Emotional Roller Coaster", "Montaña rusa emocional", ""],
    ["Comfort Read", "Lectura reconfortante", ""],
    ["Must-Read", "Lectura imprescindible", ""],
    ["Hidden Gem", "Joya escondida", ""],
    ["Guilty Pleasure", "Placer culpable", ""],
    ["Criminally Underrated", "Infravalorado de forma imperdonable", ""],
    ["Overhyped · Worth the Hype", "Sobrevalorado · merece el entusiasmo", ""],
    ["A Mixed Bag · Hit or Miss", "Una mezcla de aciertos y desaciertos", ""],
    ["Purple Prose", "Prosa recargada", ""],
    ["Lyrical Prose", "Prosa lírica", ""],
    ["Stilted Dialogue", "Diálogos rígidos", ""],
    ["Rushed Romance", "Romance apresurado", ""],
    ["Believable Romance", "Romance creíble", ""],
    ["Flat Characters", "Personajes planos", ""],
    ["Fresh Take", "Enfoque novedoso", ""],
    ["Cliché · Overused Trope", "Cliché · trope muy usado", ""]
  ]},
  { id: "comunidad", titulo: "Comunidad y hábitos lectores", intro: "El vocabulario de la vida lectora y de crear contenido.", items: [
    ["BookTok · Bookstagram · BookTube", "Comunidad literaria de TikTok · Instagram · YouTube", "", 1],
    ["Book Haul", "Compras de libros", "", 1],
    ["Wrap-Up", "Resumen de lecturas", "Mensual o anual (Year-End Wrap-Up).", 1],
    ["Book Rec", "Recomendación de lectura", ""],
    ["Reading Challenge · Reading Goal", "Reto lector · objetivo de lectura", ""],
    ["Buddy Read · Readalong", "Lectura compartida · lectura colectiva", ""],
    ["Book Club", "Club de lectura", ""],
    ["Mood Reader", "Lector/a que elige según su ánimo", ""],
    ["Bookworm", "Ratón/a de biblioteca", ""],
    ["Book Hoarder", "Acumulador/a de libros", ""],
    ["Book Buying Ban", "Prohibición autoimpuesta de comprar libros", ""],
    ["Shelfie", "Foto de una estantería", ""],
    ["Unpopular Opinion · Hot Take", "Opinión impopular · polémica", ""],
    ["TBR Jar", "Frasco con títulos para elegir al azar", ""],
    ["Bookstagrammer · BookTokker", "Creador/a de Bookstagram · BookTok", ""],
    ["Book Unboxing", "Desempaquetado de libros", ""],
    ["Bookish Merch", "Productos relacionados con libros", ""]
  ]},
  { id: "ediciones", titulo: "Ediciones y publicación", intro: "Formatos, extras físicos y términos editoriales.", items: [
    ["Paperback · Hardcover", "Tapa blanda · tapa dura", "", 1],
    ["Ebook · Audiobook", "Libro electrónico · audiolibro", ""],
    ["Special / Collector's / Limited Edition", "Edición especial / de coleccionista / limitada", ""],
    ["Sprayed Edges", "Cantos pintados", ""],
    ["Dust Jacket", "Sobrecubierta", ""],
    ["Endpapers", "Guardas", ""],
    ["Signed Copy · Bookplate", "Ejemplar firmado · exlibris", ""],
    ["Box Set · Omnibus", "Caja recopilatoria · edición integral", ""],
    ["Novella", "Novela corta", ""],
    ["Debut Novel", "Primera novela publicada", ""],
    ["Indie · Self-Published", "Autor/a independiente · autoeditado", ""],
    ["Backlist", "Catálogo de títulos anteriores", ""],
    ["Preorder · Release Day", "Preventa · día de lanzamiento", ""],
    ["Cover Reveal", "Revelación de portada", ""]
  ]},
  { id: "estetica", titulo: "Estética para Bookstagram", intro: "Para describir fotos, carruseles y composiciones.", items: [
    ["Flat Lay", "Fotografía cenital", "Objetos dispuestos sobre una superficie.", 1],
    ["Cottagecore", "Vida rural idealizada", ""],
    ["Whimsigoth", "Gótico fantasioso, místico y nostálgico", ""],
    ["Moody", "De atmósfera melancólica u oscura", ""],
    ["Cinematic", "Cinematográfico", ""],
    ["Dreamy", "Onírico, de ensueño", ""],
    ["Still Life", "Bodegón", ""],
    ["Color Palette", "Paleta de colores", ""],
    ["Jewel Tones · Earthy Tones", "Tonos joya · tonos tierra", ""],
    ["Moodboard", "Tablero de inspiración", ""],
    ["Cohesive Feed", "Feed visualmente coherente", ""],
    ["Natural Light · Candlelight", "Luz natural · luz de velas", ""],
    ["Props", "Elementos de utilería", ""],
    ["Negative Space", "Espacio negativo", ""]
  ]}
  ];
  var SPLIT = {};
  ["PNR · UF · DF · HR","ACOTAR · TOG · CC","Snowed In · Stranded Together","Page-Turner · Unputdownable","Spin-Off · Sequel · Prequel","Dubcon · Noncon · CNC","Red Flag · Green Flag","Feral · Unhinged","Self-Harm · Suicide","Paperback · Hardcover","Ebook · Audiobook","Box Set · Omnibus","Indie · Self-Published","Preorder · Release Day","Signed Copy · Bookplate","Buddy Read · Readalong","Unpopular Opinion · Hot Take","Bookstagrammer · BookTokker","Reading Challenge · Reading Goal"].forEach(function (k) { SPLIT[k] = 1; });
  function slug(t) {
    return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  var usados = {}, plano = [];
  C.forEach(function (c) {
    var filas = [];
    c.items.forEach(function (r) {
      var a = r[0].split(" · "), b = r[1].split(" · ");
      if (SPLIT[r[0]] && a.length === b.length) a.forEach(function (x, k) { filas.push([x, b[k], r[2], r[3], k ? "" : r[4]]); });
      else filas.push(r);
    });
    c.items = filas.map(function (r) {
      var id = slug(r[0]), n = 2;
      while (usados[id]) { id = slug(r[0]) + "-" + n++; }
      usados[id] = true;
      var t = { id: id, termino: r[0], es: r[1], def: r[2] || "", top: r[3] === 1, ejemplo: r[4] || "", categoria: c.id };
      plano.push(t);
      return t;
    });
  });
  window.BT.GLOSARIO_CATS = C;
  window.BT.GLOSARIO = plano;
  // Bloques que agrupan las categorías (de lo más básico a lo más específico)
  window.BT.GLOSARIO_GRUPOS = [
    { id: "g1", titulo: "Lo básico", intro: "Siglas que verás en todas partes.", cats: ["siglas"] },
    { id: "g2", titulo: "Romance", intro: "Tropes, dinámicas de pareja y nivel de picante.", cats: ["tropes", "pareja", "spice"] },
    { id: "g3", titulo: "Historias", intro: "Géneros, personajes, estructura y mundos de fantasía.", cats: ["generos", "personajes", "trama", "fantasia"] },
    { id: "g4", titulo: "Opinar y reseñar", intro: "Cómo hablar de lo que sentiste y qué avisar a tu audiencia.", cats: ["reacciones", "cw"] },
    { id: "g5", titulo: "Comunidad y estética", intro: "La vida lectora, las ediciones y cómo se ve tu feed.", cats: ["comunidad", "ediciones", "estetica"] }
  ];
  window.BT.GLOSARIO_DESTACADOS = ["tbr","dnf","arc","cw-tw","hea","hfn","pov","enemies-to-lovers","friends-to-lovers","slow-burn","fake-dating","forced-proximity","one-bed","grumpy-x-sunshine","romantasy","dark-romance","morally-grey","found-family","plot-twist","spicy","closed-door","book-boyfriend-girlfriend-husband"];
  window.BT.GLOSARIO_VER_TAMBIEN = {
    "slow-burn": ["mutual-pining","enemies-to-lovers"], "enemies-to-lovers": ["hate-to-love","rivals-to-lovers"],
    "fake-dating": ["forced-proximity","one-bed"], "spicy": ["closed-door","open-door","spice-level"],
    "closed-door": ["open-door","fade-to-black"], "tbr": ["dnf"], "cw-tw": ["content-note"], "hea": ["hfn"],
    "romantasy": ["fantasy-romance","dark-romance"], "dark-romance": ["cw-tw"], "morally-grey": ["antihero","redemption-arc"],
    "found-family": ["enemies-to-allies"], "he-falls-first": ["mutual-pining"], "friends-to-lovers": ["best-friends-to-lovers","slow-burn"]
  };
})();
