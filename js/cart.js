// cart.js — lógica del carrito de compras
import { guardarCarrito, cargarCarrito, guardarHistorial } from './storage.js';
import { formatearPrecio } from './repo.js';

const IVA = 0.15;
const MAX_POR_PRODUCTO = 10;

let carrito = [];
let ultimaActualizacion = null;
let usuarioActual = null;

export function inicializarCarrito(usuario = null) {
  usuarioActual = usuario;
  carrito = cargarCarrito(usuario);
  ultimaActualizacion = new Date().toISOString();
}

export function getCarrito() {
  return [...carrito];
}

export function getUltimaActualizacion() {
  return ultimaActualizacion;
}

function tocar() {
  ultimaActualizacion = new Date().toISOString();
  guardarCarrito(carrito, usuarioActual);
}

export function agregarProducto(producto, cantidad = 1) {
  if (!producto || typeof producto.precio !== 'number' || producto.precio <= 0) {
    return { ok: false, mensaje: 'Producto con precio inválido. Operación rechazada.' };
  }
  const existente = carrito.find(i => i.id === producto.id);
  const nuevaCant = (existente ? existente.cantidad : 0) + cantidad;
  if (nuevaCant > MAX_POR_PRODUCTO) {
    return { ok: false, mensaje: `Máximo ${MAX_POR_PRODUCTO} unidades por producto.` };
  }
  if (existente) existente.cantidad += cantidad;
  else carrito.push({ ...producto, cantidad });
  tocar();
  return { ok: true };
}

export function eliminarProducto(id) {
  carrito = carrito.filter(i => i.id !== id);
  tocar();
  return { ok: true };
}

export function cambiarCantidad(id, delta) {
  const item = carrito.find(i => i.id === id);
  if (!item) return { ok: false };
  const nueva = item.cantidad + delta;
  if (nueva <= 0) {
    return eliminarProducto(id);
  }
  if (delta > 0 && nueva > MAX_POR_PRODUCTO) {
    return { ok: false, mensaje: `Máximo ${MAX_POR_PRODUCTO} unidades por producto.` };
  }
  item.cantidad = nueva;
  tocar();
  return { ok: true };
}

export function vaciarCarrito() {
  carrito = [];
  tocar();
  return { ok: true };
}

export function calcularTotales() {
  const subtotal = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const iva = subtotal * IVA;
  const total = subtotal + iva;
  return { subtotal, iva, total, subtotalFmt: formatearPrecio(subtotal), ivaFmt: formatearPrecio(iva), totalFmt: formatearPrecio(total) };
}

export async function registrarCompra() {
  if (carrito.length === 0) return { ok: false, mensaje: 'El carrito está vacío.' };
  const { total } = calcularTotales();
  const entrada = {
    fecha: new Date().toISOString(),
    items: carrito.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
    total: Number(total.toFixed(2))
  };
  const guardado = await guardarHistorial(entrada);
  vaciarCarrito();
  return { ok: true, historial: guardado, total };
}
