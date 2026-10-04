// validaciones.js — validaciones con regex

export function validarNombre(v) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,60}$/.test(v);
}

export function validarEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v);
}

export function validarTelefono(v) {
  if (!v.trim()) return true; // opcional
  return /^(\+?\d{1,3}[\s-]?)?\d{7,12}$/.test(v.trim());
}

export function validarMensaje(v) {
  const len = v.trim().length;
  return len >= 10 && len <= 500;
}

// Aplica el resultado al DOM: marca aria-invalid y muestra/oculta el error
export function aplicarResultado(input, spanError, valido, mensaje) {
  if (valido) {
    input.removeAttribute('aria-invalid');
    spanError.textContent = '';
  } else {
    input.setAttribute('aria-invalid', 'true');
    spanError.textContent = mensaje;
  }
  return valido;
}
