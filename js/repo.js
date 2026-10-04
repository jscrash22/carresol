// repo.js — acceso a datos y formato de precios

export async function obtenerProductos() {
  try {
    const res = await fetch('data/productos.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    // Regla: rechazar productos con precio inválido
    return data.filter(p => typeof p.precio === 'number' && p.precio > 0);
  } catch (e) {
    console.error('Error obteniendo productos:', e);
    return [];
  }
}

export function formatearPrecio(precio) {
  const n = Number(precio);
  if (!Number.isFinite(n) || n <= 0) return '$0.00';
  return '$' + n.toFixed(2);
}
