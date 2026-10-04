// storage.js — 4 mecanismos de persistencia: localStorage, sessionStorage, IndexedDB y cookies

const LS_CARRITO = 'carresol_carrito';
const LS_FAVORITOS = 'carresol_favoritos';
const SS_VISITA = 'carresol_ultima_visita';

// --- localStorage ---
export function guardarCarrito(carrito) {
  try { localStorage.setItem(LS_CARRITO, JSON.stringify(carrito)); }
  catch (e) { console.error('Error guardando carrito:', e); }
}

export function cargarCarrito() {
  try {
    const raw = localStorage.getItem(LS_CARRITO);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { console.error('Error cargando carrito:', e); return []; }
}

export function guardarFavoritos(favs) {
  try { localStorage.setItem(LS_FAVORITOS, JSON.stringify(favs)); }
  catch (e) { console.error('Error guardando favoritos:', e); }
}

export function cargarFavoritos() {
  try {
    const raw = localStorage.getItem(LS_FAVORITOS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { console.error('Error cargando favoritos:', e); return []; }
}

// --- sessionStorage ---
export function registrarVisita() {
  try { sessionStorage.setItem(SS_VISITA, new Date().toISOString()); }
  catch (e) { console.error('Error en sessionStorage:', e); }
}

export function obtenerVisita() {
  try { return sessionStorage.getItem(SS_VISITA); }
  catch (e) { console.error('Error leyendo sessionStorage:', e); return null; }
}

// --- cookies ---
export function setCookie(nombre, valor, dias) {
  try {
    const expira = new Date(Date.now() + dias * 864e5).toUTCString();
    document.cookie = `${nombre}=${encodeURIComponent(valor)}; expires=${expira}; path=/; SameSite=Lax`;
  } catch (e) { console.error('Error con cookie:', e); }
}

export function getCookie(nombre) {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + nombre + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (e) { console.error('Error leyendo cookie:', e); return null; }
}

// --- IndexedDB ---
export function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('CarresolDB', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('historial')) {
        req.result.createObjectStore('historial', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function guardarHistorial(entrada) {
  try {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('historial', 'readwrite');
      tx.objectStore('historial').add(entrada);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { console.error('Error guardando historial:', e); return false; }
}

export async function obtenerHistorial() {
  try {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('historial', 'readonly');
      const req = tx.objectStore('historial').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error('Error obteniendo historial:', e); return []; }
}
