// favoritos.js — gestión de favoritos
import { guardarFavoritos, cargarFavoritos, guardarFavoritosSesion, cargarFavoritosSesion } from './storage.js';

let favoritos = [];
let usuarioActual = null;

export function inicializarFavoritos(usuario = null) {
  usuarioActual = usuario;
  favoritos = usuario ? cargarFavoritos(usuario) : cargarFavoritosSesion();
}

function persistir() {
  if (usuarioActual) guardarFavoritos(favoritos, usuarioActual);
  else guardarFavoritosSesion(favoritos);
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
  persistir();
  return esFavorito(producto.id);
}

export function limpiarFavoritos() {
  favoritos = [];
  persistir();
}
