// app.js — orquestador principal
import { obtenerProductos } from './repo.js';
import {
  renderizarProductos, renderizarCarrito, renderizarFavoritos,
  actualizarContadorCarrito, actualizarContadorFavoritos, actualizarTotales, mostrarFechaActualizacion
} from './view.js';
import * as cart from './cart.js';
import * as favs from './favoritos.js';
import { registrarVisita, setCookie, getCookie } from './storage.js';
import { validarNombre, validarEmail, validarTelefono, validarMensaje, aplicarResultado } from './validaciones.js';

let productos = [];
let filtroActual = 'todos';

const $ = (sel) => document.querySelector(sel);

// ===== Carrito panel =====
function refrescarCarrito() {
  const items = cart.getCarrito();
  actualizarContadorCarrito(items.reduce((a, i) => a + i.cantidad, 0));
  renderizarCarrito(items, $('#carrito-items'), quitarDelCarrito, cambiarCantidad);
  $('#carrito-vacio').style.display = items.length ? 'none' : 'block';
  actualizarTotales(cart.calcularTotales());
  mostrarFechaActualizacion(cart.getUltimaActualizacion());
}

function quitarDelCarrito(id) {
  cart.eliminarProducto(id);
  refrescarCarrito();
}

function cambiarCantidad(id, delta) {
  const res = cart.cambiarCantidad(id, delta);
  if (!res.ok && res.mensaje) mostrarAlertaCarrito(res.mensaje);
  else mostrarAlertaCarrito('');
  refrescarCarrito();
}

function agregarAlCarrito(p) {
  const res = cart.agregarProducto(p);
  if (!res.ok) mostrarAlertaCarrito(res.mensaje);
  else mostrarAlertaCarrito('');
  refrescarCarrito();
}

function mostrarAlertaCarrito(msg) {
  $('#carrito-alerta').textContent = msg;
}

// ===== Favoritos =====
function refrescarFavoritos() {
  const lista = favs.getFavoritos();
  actualizarContadorFavoritos(lista.length);
  renderizarFavoritos(lista, $('#lista-favoritos'), $('#favoritos-vacio'), agregarAlCarrito, toggleFav, quitarFav);
}

function toggleFav(p, card) {
  const ahora = favs.toggleFavorito(p);
  const btn = card.querySelector('.btn-fav');
  if (btn) {
    btn.textContent = ahora ? '♥' : '♡';
    btn.classList.toggle('activo', ahora);
  }
  refrescarFavoritos();
}

function quitarFav(p) {
  favs.toggleFavorito(p);
  refrescarFavoritos();
  // refrescar corazón en catálogo
  const idx = productos.findIndex(x => x.id === p.id);
  if (idx >= 0) filtrarYRenderizar();
}

// ===== Catálogo =====
function filtrarYRenderizar() {
  const lista = filtroActual === 'todos' ? productos : productos.filter(p => p.categoria === filtroActual);
  renderizarProductos(lista, $('#grid-productos'), agregarAlCarrito, toggleFav);
}

// ===== Menú hamburguesa =====
function inicializarMenu() {
  const btn = $('#btn-menu');
  const nav = $('#menu-principal');
  btn.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto');
    btn.setAttribute('aria-expanded', String(abierto));
    btn.setAttribute('aria-label', abierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('abierto');
    btn.setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('abierto')) {
      nav.classList.remove('abierto');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('abierto') && !nav.contains(e.target) && e.target !== btn) {
      nav.classList.remove('abierto');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===== Panel carrito abrir/cerrar =====
async function inicializarPanelCarrito() {
  const panel = $('#panel-carrito');
  const btnCerrar = $('#btn-cerrar-carrito');
  let ultimoFoco = null;

  const abrir = (e) => {
    if (e) e.preventDefault();
    ultimoFoco = document.activeElement;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('abierto'));
    btnCerrar.focus();
    refrescarCarrito();
  };
  const cerrar = () => {
    panel.classList.remove('abierto');
    setTimeout(() => { panel.hidden = true; }, 250);
    if (ultimoFoco) ultimoFoco.focus();
  };

  $('#btn-abrir-carrito').addEventListener('click', abrir);
  $('#link-carrito').addEventListener('click', abrir);
  $('#btn-cont-carrito').addEventListener('click', abrir);
  $('#btn-cont-fav').addEventListener('click', () => $('#favoritos').scrollIntoView({ behavior: 'smooth' }));
  btnCerrar.addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('abierto')) cerrar(); });

  // Foco atrapado
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const enfocables = panel.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])');
    if (!enfocables.length) return;
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) { ultimo.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { primero.focus(); e.preventDefault(); }
  });
}

// ===== Formulario =====
function inicializarFormulario() {
  const form = $('#form-contacto');
  const campos = {
    nombre: { input: $('#nombre'), error: $('#error-nombre'), validar: validarNombre, msg: 'Nombre inválido (3-60 letras).' },
    email: { input: $('#email'), error: $('#error-email'), validar: validarEmail, msg: 'Correo inválido.' },
    telefono: { input: $('#telefono'), error: $('#error-telefono'), validar: validarTelefono, msg: 'Teléfono inválido.' },
    mensaje: { input: $('#mensaje'), error: $('#error-mensaje'), validar: validarMensaje, msg: 'Mensaje debe tener entre 10 y 500 caracteres.' }
  };

  Object.values(campos).forEach(c => {
    c.input.addEventListener('input', () => aplicarResultado(c.input, c.error, c.validar(c.input.value), c.msg));
    c.input.addEventListener('blur', () => aplicarResultado(c.input, c.error, c.validar(c.input.value), c.msg));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valido = true;
    Object.values(campos).forEach(c => {
      if (!aplicarResultado(c.input, c.error, c.validar(c.input.value), c.msg)) valido = false;
    });
    if (valido) {
      $('#form-exito').textContent = '¡Gracias! Tu mensaje fue enviado correctamente.';
      form.reset();
    } else {
      $('#form-exito').textContent = '';
    }
  });
}

// ===== Inicio =====
document.addEventListener('DOMContentLoaded', async () => {
  cart.inicializarCarrito();
  favs.inicializarFavoritos();
  registrarVisita();

  // Cookie de usuario invitado (30 días)
  if (!getCookie('carresol_usuario')) {
    setCookie('carresol_usuario', 'invitado-' + Date.now(), 30);
  }

  productos = await obtenerProductos();

  document.querySelectorAll('.filtro').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      filtroActual = btn.dataset.categoria;
      filtrarYRenderizar();
    });
  });

  filtrarYRenderizar();
  refrescarFavoritos();
  refrescarCarrito();
  inicializarMenu();
  inicializarPanelCarrito();
  inicializarFormulario();

  $('#btn-vaciar').addEventListener('click', () => { cart.vaciarCarrito(); refrescarCarrito(); });
  $('#btn-finalizar').addEventListener('click', async () => {
    const res = await cart.registrarCompra();
    if (res.ok) {
      $('#compra-confirmacion').textContent = `¡Compra registrada! Total: $${res.total.toFixed(2)}. Gracias por tu compra en Carresol.`;
      refrescarCarrito();
    } else {
      $('#compra-confirmacion').textContent = res.mensaje || 'No se pudo registrar la compra.';
    }
  });
});
