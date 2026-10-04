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
let usuarioActivo = null;

const $ = (sel) => document.querySelector(sel);

function abrirModalLogin() {
  const m = $('#modal-login');
  m.hidden = false;
  m.classList.add('abierto');
  const u = $('#login-usuario');
  if (u) u.focus();
}

function cerrarModalLogin() {
  const m = $('#modal-login');
  m.hidden = true;
  m.classList.remove('abierto');
}

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
  if (!usuarioActivo) {
    abrirModalLogin();
    mostrarAlertaCarrito('Inicia sesión o crea una cuenta para agregar productos.');
    return;
  }
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
  if (!usuarioActivo) {
    abrirModalLogin();
    return;
  }
  const ahora = favs.toggleFavorito(p);
  const btn = card.querySelector('.btn-fav');
  if (btn) {
    btn.textContent = ahora ? '♥' : '♡';
    btn.classList.toggle('activo', ahora);
  }
  refrescarFavoritos();
}

function quitarFav(p) {
  if (!usuarioActivo) { abrirModalLogin(); return; }
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

  // ===== Login simulado con cuentas =====
  const LS_USUARIOS = 'carresol_usuarios';
  const LS_ULTIMO = 'carresol_ultimo_usuario';
  const SS_SESION = 'carresol_sesion';

  const getUsuarios = () => {
    try { return JSON.parse(localStorage.getItem(LS_USUARIOS)) || []; } catch (e) { return []; }
  };

  const activarSesion = (usuario) => {
    try {
      localStorage.setItem(LS_ULTIMO, usuario);
      sessionStorage.setItem(SS_SESION, usuario);
      setCookie('carresol_usuario', 'token-' + Date.now(), 30);
    } catch (e) { console.error(e); }
    $('#saludo').hidden = false;
    $('#saludo').textContent = 'Hola, ' + usuario;
    $('#btn-salir').hidden = false;
    cerrarModalLogin();
    usuarioActivo = usuario;
    cart.inicializarCarrito(usuario);
    favs.inicializarFavoritos(usuario);
    refrescarCarrito();
    refrescarFavoritos();
  };

  try {
    const enSesion = sessionStorage.getItem(SS_SESION);
    if (enSesion && enSesion !== 'activa' && getCookie('carresol_usuario')) {
      usuarioActivo = enSesion;
      cart.inicializarCarrito(enSesion);
      favs.inicializarFavoritos(enSesion);
      $('#saludo').hidden = false;
      $('#saludo').textContent = 'Hola, ' + enSesion;
      $('#btn-salir').hidden = false;
    } else {
      try { sessionStorage.removeItem(SS_SESION); } catch (e) {}
      const ultimo = localStorage.getItem(LS_ULTIMO);
      if (ultimo) $('#login-usuario').value = ultimo;
    }
  } catch (e) { console.error(e); }

  $('#btn-usuario').addEventListener('click', abrirModalLogin);
  $('#btn-cerrar-login').addEventListener('click', cerrarModalLogin);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#modal-login').classList.contains('abierto')) cerrarModalLogin(); });

  $('#tab-login').addEventListener('click', () => {
    $('#tab-login').classList.add('activo'); $('#tab-registro').classList.remove('activo');
    $('#form-login').hidden = false; $('#form-registro').hidden = true;
  });
  $('#tab-registro').addEventListener('click', () => {
    $('#tab-registro').classList.add('activo'); $('#tab-login').classList.remove('activo');
    $('#form-registro').hidden = false; $('#form-login').hidden = true;
  });

  $('#form-registro').addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = $('#reg-usuario').value.trim();
    const password = $('#reg-password').value;
    if (usuario.length < 2) { $('#reg-error').textContent = 'Usuario muy corto.'; return; }
    if (password.length < 4) { $('#reg-error').textContent = 'Contraseña mínimo 4 caracteres.'; return; }
    const usuarios = getUsuarios();
    if (usuarios.some(u => u.usuario === usuario)) { $('#reg-error').textContent = 'Ese usuario ya existe.'; return; }
    usuarios.push({ usuario, password });
    try { localStorage.setItem(LS_USUARIOS, JSON.stringify(usuarios)); } catch (e2) { console.error(e2); }
    $('#reg-error').textContent = '';
    activarSesion(usuario);
  });

  $('#form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = $('#login-usuario').value.trim();
    const password = $('#login-password').value;
    const usuarios = getUsuarios();
    const encontrado = usuarios.find(u => u.usuario === usuario && u.password === password);
    if (encontrado) {
      $('#login-error').textContent = '';
      activarSesion(usuario);
    } else {
      $('#login-error').textContent = 'Usuario o contraseña incorrectos.';
    }
  });

  $('#btn-salir').addEventListener('click', () => {
    try { sessionStorage.removeItem(SS_SESION); } catch (e) {}
    document.cookie = 'carresol_usuario=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    $('#saludo').hidden = true;
    $('#btn-salir').hidden = true;
    usuarioActivo = null;
    cart.inicializarCarrito(null);
    favs.inicializarFavoritos(null);
    refrescarCarrito();
    refrescarFavoritos();
  });

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
