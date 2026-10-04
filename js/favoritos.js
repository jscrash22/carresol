// favoritos.js — gestión de favoritos
import { guardarFavoritos, cargarFavoritos } from './storage.js';

let favoritos = [];

export function inicializarFavoritos() {
  favoritos = cargarFavoritos();
}

export function getFavoritos() {
  return [...favoritos];
}

export function esFavorito(id) {
  return favoritos.some(p => p.id === id);
}

export function toggleFavorito(producto) {
  if (esFavorito(producto.id)) {
    favoritos = favoritos.filter(p => p.id !== producto.id);
  } else {
    favoritos.push(producto);
  }
  guardarFavoritos(favoritos);
  return esFavorito(producto.id);
}

export function limpiarFavoritos() {
  favoritos = [];
  guardarFavoritos(favoritos);
}
