/**
 * El dashboard de Supabase muestra la URL en varios formatos y es fácil copiar el
 * endpoint REST (…/rest/v1/) en vez de la raíz del proyecto. El cliente de
 * supabase-js ya agrega esa ruta él mismo, así que con la de más pediría
 * /rest/v1/rest/v1/… y todo respondería 404 (PGRST125).
 *
 * Normalizamos en vez de confiar en que la variable de entorno esté perfecta:
 * es un error silencioso, sólo visible en producción y difícil de diagnosticar.
 *
 * Sin "use client": lo importan tanto el cliente del navegador como el del servidor.
 */
export function normalizeSupabaseUrl(raw) {
  if (!raw) return raw;
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "")
    .replace(/\/auth\/v1$/, "");
}
