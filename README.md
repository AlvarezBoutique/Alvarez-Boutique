# Alvarez Boutique — Catálogo

Catálogo de boutique (moda + fragancias) con estética "quiet luxury", construido a partir del
proyecto de Stitch **Auralis Pastel Boutique Catalog** y remarcado a Alvarez Boutique.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Supabase · desplegable en Vercel.

Categorías: **Damas · Caballeros · Niños · Bebés · Perfumes** (21 productos de ejemplo).

Todo el sitio está en español: interfaz, copy y nombres de producto.

Dos partes:

| Ruta | Qué es | Quién entra |
| --- | --- | --- |
| `/` → `/damas` … `/perfumes` | Catálogo público | Cualquiera, sin cuenta |
| `/deseos` | Lista de deseos y compartir | Cualquiera, sin cuenta |
| `/admin` | Panel de inventario y cuentas | Dueños, con usuario y contraseña |

**Modelo de cuentas:** todas las cuentas son iguales — no hay administradores ni rangos.
Cada cuenta está asignada a **una** categoría y sólo puede subir y editar los productos de esa
categoría; eso lo impone RLS en la base de datos, no sólo la interfaz. Cualquier cuenta puede
crear otras cuentas. El panel tiene únicamente dos secciones: **Inventario** y **Cuentas**.

---

## 1. Correr en local

```bash
npm install
npm run dev        # http://localhost:3000
```

Funciona **sin configurar Supabase**: si faltan las variables de entorno, la app usa el
catálogo incluido en `lib/seed.json`. Al configurar Supabase, lee de la base de datos.

## 2. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo.
   Crea las tablas `categories` y `products`, activa RLS con lectura pública, e inserta los 21 productos.
   Es idempotente y **no destructivo**: al re-ejecutarlo no duplica datos ni borra los
   productos que hayan subido los dueños (usa `on conflict do nothing`).
3. Ejecuta después [`supabase/auth.sql`](supabase/auth.sql) (mismo SQL Editor). Crea la tabla
   `profiles`, el bucket de fotos y las políticas que atan cada cuenta a su categoría.
4. **Paso obligatorio y fácil de olvidar:** ve a **Authentication → Sign In / Providers → Email**
   y **desactiva "Confirm email"**. Los dueños entran con nombre de usuario, no reciben correos;
   si queda activo, ninguna cuenta podrá iniciar sesión.
5. Copia las credenciales desde **Project Settings → API**.
6. Entra a `/admin` y crea la primera cuenta. A partir de ahí, las demás se crean desde **Cuentas**.

```bash
cp .env.example .env.local   # y rellena los valores
```

## 3. Variables de entorno

| Variable | Dónde se obtiene |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → *anon public* |
| `NEXT_PUBLIC_WHATSAPP_TIENDA` | `50431450429` (es +504 3145-0429 en formato `wa.me`: sin `+`, espacios ni guiones). Opcional: sin él, la lista de deseos sólo ofrece "Copiar link". |

Ambas son públicas por diseño (van al navegador). La protección real es RLS: las políticas
del `schema.sql` sólo permiten `select`. **No** pongas aquí la `service_role` key.

En Vercel: **Project → Settings → Environment Variables**, agrega las dos y marca los tres
entornos (Production, Preview, Development). Luego redespliega.

## 4. Desplegar en Vercel

```bash
git init && git add -A && git commit -m "feat: Auralis boutique catalog"
git remote add origin git@github.com:<usuario>/auralis-boutique.git
git push -u origin main
```

Importa el repo en Vercel. Detecta Next.js automáticamente — no hay que tocar build settings.
Agrega las variables de entorno **antes** del primer deploy.

---

## Estructura

```
app/
  layout.jsx                 Sólo <html>/<body> y fuentes
  (catalog)/                 — Catálogo público —
    layout.jsx               Sidebar + nav móvil
    page.jsx                 Redirige a la primera categoría (/damas)
    [category]/page.jsx      Página de catálogo (server component, ISR 5 min)
  components/
    Sidebar.jsx              Nav glassmorphic fija (desktop)
    MobileNav.jsx            Chips de categoría (móvil)
    CatalogView.jsx          Búsqueda + wishlist + grid
    ProductCard.jsx          Tarjeta de producto
  admin/                     — Panel de dueños —
    layout.jsx               AuthProvider + gate de sesión
    inventario/page.jsx      Productos de TU categoría (alta/edición/borrado)
    cuentas/page.jsx         Lista y creación de cuentas
    components/
      AdminShell.jsx         Nav del panel (Inventario · Cuentas)
      Login.jsx              Login y asistente de primera cuenta
      ProductModal.jsx       Formulario + subida de foto a Storage
      Modal.jsx, Field.jsx   Primitivas compartidas
lib/
  catalog.js                 Consultas del catálogo con fallback al seed
  supabase.js                Cliente de lectura (servidor, sin sesión)
  browserClient.js           Cliente del panel (navegador, con sesión)
  auth.jsx                   AuthProvider: login, sesión, alta de cuentas
  seed.json                  Catálogo de respaldo
supabase/
  schema.sql                 Tablas del catálogo + RLS de lectura + seed
  auth.sql                   Cuentas, permisos por categoría y bucket de fotos
```

## Notas de implementación

- **Design system:** los tokens de Stitch (colores "Dusk Pastel", Playfair Display + DM Sans,
  escala de espaciado) están en `tailwind.config.js`. El glassmorphism se aplica al sidebar y
  la barra superior (`.glass-panel`, Level 2), **no** a las tarjetas (`.glass-card`, Level 1),
  siguiendo la especificación del design system.
- **Imágenes:** son las generadas por Stitch, servidas desde `lh3.googleusercontent.com` con el
  sufijo `=w1200` (sin él, Google devuelve una versión de 512×279). Algunas traen una barra de
  UI falsa incrustada por el generador; reemplázalas por fotos reales editando `image_url` en
  la tabla `products`. Los dominios permitidos están en `next.config.mjs`.
- **Carga de imágenes:** las primeras 3 tarjetas usan `priority` (eager). No lo cambies a lazy:
  en navegación cliente del App Router las imágenes montan ya dentro del viewport y el
  IntersectionObserver de `next/image` puede dejarlas sin pintar.
- **Wishlist:** vive en `localStorage` del visitante. La autenticación del panel es para los
  dueños, no para los compradores; persistirla por comprador pediría su propia tabla.
- **Cuentas:** los dueños entran con nombre de usuario, no con correo. Por dentro se traduce a
  `usuario@auralis.local` para que Supabase Auth maneje el hash de la contraseña y la sesión
  (ver `lib/browserClient.js`). La sesión se cierra sola a las 5 horas.
- **Permisos:** el formulario nunca elige la categoría — la fija la cuenta que guarda. Aunque
  alguien manipulara la petición, las políticas de `auth.sql` rechazan escribir fuera de su
  categoría.
- **Lista de deseos (`/deseos`):** el visitante guarda piezas con el corazón (se quedan en
  `localStorage`) y genera un link para mandárselo a la tienda. El link **lleva la selección
  dentro** (`/deseos?items=id1,id2`), no se guarda nada en la base: así no hay escritura
  pública que alguien pueda abusar, y no queda basura que limpiar. La contra es que el link
  crece con la cantidad de piezas. Si una pieza ya no está en el catálogo, el link sigue
  funcionando y avisa cuántas faltan.
- **Logo:** `public/logo.jpg` es dorado sobre fondo negro cuadrado; `app/components/Logo.jsx`
  lo recorta a círculo para que lea como insignia sobre el fondo pastel. `app/icon.png` es el
  favicon (Next lo toma solo por convención).
- **Revalidación:** `revalidate = 300` en `[category]/page.jsx` — los cambios en Supabase
  aparecen a los 5 minutos sin redesplegar.
