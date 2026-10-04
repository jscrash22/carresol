// cart.js — lógica del carrito de compras
import { guardarCarrito, cargarCarrito, guardarHistorial } from './storage.js';
import { formatearPrecio } from './repo.js';

const LIMITE_UNIDADES = 20;
const IVA = 0.15;

let carrito = [];
let ultimaActualizacion = null;

export function inicializarCarrito() {
  carrito = cargarCarrito();
  ultimaActualizacion = new Date().toISOString();
}

export function getCarrito() {
  return [...carrito];
}

export function getUltimaActualizacion() {
  return ultimaActualizacion;
}

function totalUnidades() {
  return carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

function tocar() {
  ultimaActualizacion = new Date().toISOString();
  guardarCarrito(carrito);
}

export function agregarProducto(producto, cantidad = 1) {
  if (!producto || typeof producto.precio !== 'number' || producto.precio <= 0) {
    return { ok: false, mensaje: 'Producto con precio inválido. Operación rechazada.' };
  }
  if (totalUnidades() + cantidad > LIMITE_UNIDADES) {
    return { ok: false, mensaje: `Límite de ${LIMITE_UNIDADES} unidades alcanzado. Finaliza tu compra o elimina productos.` };
  }
  const existente = carrito.find(i => i.id === producto.id);
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
  if (delta > 0 && totalUnidades() + delta > LIMITE_UNIDADES) {
    return { ok: false, mensaje: `Límite de ${LIMITE_UNIDADES} unidades alcanzado. Finaliza tu compra o elimina productos.` };
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
