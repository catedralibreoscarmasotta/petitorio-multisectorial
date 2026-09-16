# Petitorio — Movimiento Multisectorial

Sitio web para la campaña de recolección de firmas del Movimiento Multisectorial
de profesionales de la salud de Santa Fe. Incluye formulario de adhesión,
contador real de firmas y listado público de adherentes, con base de datos en
Supabase.

## Archivos

- `index.html` — estructura y contenido de la página.
- `styles.css` — estilos (mobile-first, responsive).
- `script.js` — lógica: formulario, validaciones, contador, listado público, modal.
- `config.js` — acá van tus credenciales de Supabase (2 líneas para editar).
- `supabase-schema.sql` — script SQL para crear la tabla y las políticas de seguridad.

## Paso 1 — Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta (o iniciá sesión).
2. Hacé clic en **New project**.
3. Elegí un nombre (por ejemplo `petitorio-multisectorial`), una contraseña
   para la base de datos (guardala) y una región cercana (por ejemplo
   `South America (São Paulo)`).
4. Esperá 1-2 minutos a que el proyecto termine de crearse.

## Paso 2 — Crear la tabla y las políticas de seguridad

1. En el menú lateral izquierdo de tu proyecto, hacé clic en **SQL Editor**.
2. Hacé clic en **New query**.
3. Abrí el archivo `supabase-schema.sql` de esta carpeta, copiá todo su
   contenido y pegalo en el editor.
4. Hacé clic en **Run** (o `Ctrl+Enter`).
5. Deberías ver "Success. No rows returned". Esto creó:
   - la tabla `adhesiones` (con el DNI como campo único, para evitar firmas duplicadas),
   - las políticas de RLS (Row Level Security) que permiten firmar pero **no**
     permiten leer DNI, email ni teléfono desde el navegador,
   - la vista pública `adhesiones_publicas` (solo nombre, profesión y localidad
     de quienes autorizaron mostrar su nombre),
   - la función `contar_adhesiones()` que usa la página para el contador real.

## Paso 3 — Obtener tus credenciales

1. En el menú lateral, andá a **Project Settings** (ícono de engranaje) → **API**.
2. Copiá el valor de **Project URL**.
3. Copiá el valor de **anon public** (dentro de "Project API keys").
   Nunca uses ni publiques la clave `service_role`.

## Paso 4 — Completar `config.js`

Abrí `config.js` y reemplazá los dos valores de ejemplo:

```js
window.SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
window.SUPABASE_ANON_KEY = "TU-ANON-KEY-AQUI";
```

por los valores reales que copiaste en el paso anterior. Estos dos valores son
públicos por diseño (los ve cualquiera que abra la página); lo que protege los
datos sensibles son las políticas de RLS del paso 2, no ocultar estas claves.

## Paso 5 — Probar en tu computadora

No hace falta ningún servidor especial: podés abrir `index.html` directamente
en el navegador para ver el diseño. Para probar el formulario completo
(que sí necesita que el sitio se sirva por http, no por `file://`), lo más
simple es:

- Si tenés Python instalado: abrí una terminal en esta carpeta y corré
  `python3 -m http.server 8000`, después entrá a `http://localhost:8000` en
  el navegador.
- O usá cualquier extensión tipo "Live Server" de tu editor de código.

## Paso 6 — Publicar el sitio (elegí una opción)

### Opción A: Netlify (recomendada, gratis, sin código)

1. Entrá a [netlify.com](https://www.netlify.com) y creá una cuenta.
2. En el panel, buscá la opción de arrastrar y soltar una carpeta
   ("Deploy manually" / "Drag and drop your site folder").
3. Arrastrá esta carpeta completa (con `index.html`, `styles.css`, `script.js`,
   `config.js` ya editado con tus credenciales).
4. En unos segundos vas a tener una URL pública (por ejemplo
   `https://petitorio-multisectorial.netlify.app`). Desde ahí podés configurar
   un dominio propio si lo tenés.

### Opción B: Vercel

1. Entrá a [vercel.com](https://vercel.com) y creá una cuenta.
2. Elegí "Add New… → Project" y subí esta carpeta (o conectala a un repositorio
   de GitHub donde la hayas subido antes).
3. Vercel detecta que es un sitio estático y lo publica automáticamente.

### Opción C: GitHub Pages

1. Subí esta carpeta a un repositorio en GitHub.
2. En el repositorio, andá a **Settings → Pages**.
3. En "Source", elegí la rama principal (`main`) y la carpeta raíz (`/`).
4. Guardá; GitHub te da una URL pública en `https://tu-usuario.github.io/tu-repo/`.

En cualquiera de las tres opciones, cada vez que quieras hacer un cambio en el
sitio, volvés a subir/arrastrar la carpeta actualizada.

## Cómo funciona la seguridad de los datos

- Cualquier visitante puede **insertar** una nueva adhesión (firmar).
- Nadie puede **leer** la tabla completa desde el navegador: no hay política
  de `SELECT` para visitantes sobre la tabla `adhesiones`.
- El listado público solo lee desde la vista `adhesiones_publicas`, que expone
  únicamente nombre, apellido, profesión y localidad, y solo de quienes
  marcaron el checkbox de autorización.
- El contador usa la función `contar_adhesiones()`, que cuenta todas las filas
  (incluidas las que no autorizaron mostrarse públicamente) sin exponer sus
  datos.
- El DNI tiene una restricción `unique` en la base de datos: si alguien intenta
  firmar dos veces con el mismo DNI, Supabase rechaza el segundo intento y la
  página muestra "Ya registramos una adhesión con este DNI." sin mostrar ningún
  dato de la firma anterior.

## Cosas que podés personalizar fácilmente

- **Redes sociales del footer**: agregá los links dentro de
  `<ul class="footer-social" id="footer-social">` en `index.html`.
- **Colores**: están definidos como variables al principio de `styles.css`
  (sección `:root`), en particular `--navy-900`, `--orange` y `--paper`.
- **Texto completo del petitorio**: está en `index.html`, dentro de
  `<div id="petition-full-text">`, con la numeración e incisos (a–g)
  del documento original.
