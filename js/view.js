// view.js — renderizado del DOM
import { formatearPrecio } from './repo.js';
import { esFavorito } from './favoritos.js';

export function renderizarProductos(productos, contenedor, onAgregar, onToggleFav) {
  contenedor.innerHTML = '';
  productos.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <button class="btn-fav ${esFavorito(p.id) ? 'activo' : ''}" aria-label="Marcar ${p.nombre} como favorito">${esFavorito(p.id) ? '♥' : '♡'}</button>
      <img src="${p.imagen}" alt="${p.alt}" loading="lazy" />
      <h3>${p.nombre}</h3>
      <p>${p.descripcion}</p>
      <p class="precio">${formatearPrecio(p.precio)}</p>
      <div class="acciones">
        <button class="btn btn-dorado btn-agregar">Agregar al carrito</button>
      </div>`;
    card.querySelector('img').addEventListener('error', (e) => {
      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400"><rect width="500" height="400" fill="%23d4af37"/><text x="50%" y="50%" fill="white" font-size="24" text-anchor="middle">Carresol</text></svg>';
    });
    card.querySelector('.btn-agregar').addEventListener('click', () => onAgregar(p));
    card.querySelector('.btn-fav').addEventListener('click', () => onToggleFav(p, card));
    contenedor.appendChild(card);
  });
}

export function renderizarCarrito(carrito, contenedor, onQuitar, onCambiarCantidad) {
  contenedor.innerHTML = '';
  carrito.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-carrito';
    div.innerHTML = `
      <img src="${item.imagen}" alt="${item.alt}" />
      <div class="info">
        <strong>${item.nombre}</strong>
        <p>${formatearPrecio(item.precio)} c/u</p>
        <div class="cantidad">
          <button aria-label="Quitar uno" data-delta="-1">−</button>
          <span>${item.cantidad}</span>
          <button aria-label="Agregar uno" data-delta="1">+</button>
        </div>
      </div>
      <button class="btn-quitar" aria-label="Eliminar ${item.nombre}">🗑</button>`;
    div.querySelector('.btn-quitar').addEventListener('click', () => onQuitar(item.id));
    div.querySelectorAll('.cantidad button').forEach(btn => {
      btn.addEventListener('click', () => onCambiarCantidad(item.id, Number(btn.dataset.delta)));
    });
    contenedor.appendChild(div);
  });
}

export function renderizarFavoritos(favoritos, contenedor, vacioEl, onAgregar, onToggleFav, onQuitar) {
  contenedor.innerHTML = '';
  vacioEl.hidden = favoritos.length > 0;
  favoritos.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.imagen}" alt="${p.alt}" loading="lazy" />
      <h3>${p.nombre}</h3>
      <p>${p.descripcion}</p>
      <p class="precio">${formatearPrecio(p.precio)}</p>
      <div class="acciones">
        <button class="btn btn-dorado btn-agregar">Agregar al carrito</button>
        <button class="btn btn-rojo btn-quitar">Quitar</button>
      </div>`;
    card.querySelector('.btn-agregar').addEventListener('click', () => onAgregar(p));
    card.querySelector('.btn-quitar').addEventListener('click', () => onQuitar(p));
    contenedor.appendChild(card);
  });
}

export function actualizarContadorCarrito(n) {
  document.getElementById('cart-count').textContent = n;
  const c2 = document.getElementById('cart-count-2');
  if (c2) c2.textContent = n;
}

export function actualizarContadorFavoritos(n) {
  document.getElementById('fav-count').textContent = n;
}

export function actualizarTotales(totales) {
  document.getElementById('subtotal').textContent = totales.subtotalFmt;
  document.getElementById('iva').textContent = totales.ivaFmt;
  document.getElementById('total').textContent = totales.totalFmt;
}

export function mostrarFechaActualizacion(fechaISO) {
  const el = document.getElementById('fecha-actualizacion');
  el.textContent = fechaISO ? new Date(fechaISO).toLocaleString('es-EC') : '—';
}
