/* almacenamiento.js · Acceso a localStorage con try/catch.

   Si el navegador bloquea el almacenamiento (modo privado, permisos), la app
   sigue funcionando en memoria y avisa al usuario desde main.js. */
export function leer(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function escribir(key, valor) {
  try {
    localStorage.setItem(key, JSON.stringify(valor));
    return true;
  } catch (err) {
    console.error("No se pudo guardar en localStorage:", err);
    return false;
  }
}

export function borrar(key) {
  try { localStorage.removeItem(key); } catch (err) { /* sin acción */ }
}

// Prueba rápida: algunos navegadores permiten leer pero no escribir.
export function almacenamientoDisponible() {
  try {
    localStorage.setItem("__prueba", "1");
    localStorage.removeItem("__prueba");
    return true;
  } catch (err) {
    return false;
  }
}
