# 💎 Carresol — Joyería de lujo

Carresol es una tienda web de joyería de lujo con catálogo filtrable, carrito de compras con límite de unidades, favoritos persistentes, formulario de contacto accesible y despliegue en GitHub Pages.

## 🎨 Estética

Diseño minimalista tipo Cartier/Tiffany: fondo blanco puro y blanco roto, acentos dorados (`#b8860b`, `#d4af37`), texto negro, tipografía serif elegante (Playfair Display) y generoso espacio en blanco.

## 🌐 Demo en vivo

`https://jscrash22.github.io/carresol/`

## 🛠️ Tecnologías

- HTML5 semántico
- CSS3 (Grid, Flexbox, variables, mobile-first)
- JavaScript ES6+ con módulos nativos
- Google Fonts (Playfair Display + Poppins)
- localStorage, sessionStorage, IndexedDB, cookies

## 📁 Estructura

```
carresol/
├── .nojekyll
├── index.html
├── README.md
├── assets/css/styles.css
├── data/productos.json
└── js/
    ├── app.js
    ├── repo.js
    ├── view.js
    ├── cart.js
    ├── favoritos.js
    ├── storage.js
    └── validaciones.js
```

## ▶️ Uso local

**Opción 1:** Live Server de VS Code (clic derecho en `index.html` → Open with Live Server).

**Opción 2:**
```bash
python -m http.server 8000
# http://localhost:8000
```

⚠️ **Advertencia:** NO abras `index.html` con doble clic; `fetch` fallará por CORS.

## 🚀 Despliegue en GitHub Pages

```bash
git init
git add .
git commit -m "Carresol - Proyecto 1"
git branch -M main
git remote add origin https://github.com/jscrash22/carresol.git
git push -u origin main
```

Luego: Settings → Pages → Branch `main` / root → Save.

## ♿ Accesibilidad

- Foco visible con outline dorado (`:focus-visible`)
- ARIA: `aria-label`, `aria-live`, `aria-expanded`, `aria-controls`, `aria-invalid`, `aria-describedby`
- Contraste AA (dorado oscuro `#8b6508` sobre blanco)
- Skip link, navegación por teclado y foco atrapado en el panel del carrito

## 💾 Persistencia

| Mecanismo | Uso | Clave/DB |
|---|---|---|
| localStorage | Carrito + Favoritos | `carresol_carrito`, `carresol_favoritos` |
| sessionStorage | Última visita de sesión | `carresol_ultima_visita` |
| IndexedDB | Historial de compras | DB `CarresolDB`, store `historial` |
| cookies | Usuario invitado (30 días) | `carresol_usuario` |

## ✅ Checklist de funcionalidades

- [x] 25 productos (5 por categoría)
- [x] Filtros por categoría
- [x] Carrito con límite de 20 unidades
- [x] Menú hamburguesa accesible
- [x] Favoritos persistentes con contador
- [x] Formulario con validación regex accesible
- [x] 4 mecanismos de persistencia
- [x] Responsive (480/768/1024px)
- [x] `.nojekyll` en la raíz
