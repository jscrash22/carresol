// favoritos.js — gestión de favoritos
import { guardarFavoritos, cargarFavoritos } from './storage.js';

let favoritos = [];
let usuarioActual = null;

export function inicializarFavoritos(usuario = null) {
  usuarioActual = usuario;
  favoritos = cargarFavoritos(usuario);
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
  guardarFavoritos(favoritos, usuarioActual);
  return esFavorito(producto.id);
}

export function limpiarFavoritos() {
  favoritos = [];
  guardarFavoritos(favoritos, usuarioActual);
}
