import { getSupabase, isSupabaseConfigured } from "./supabase";
import seed from "./seed.json";

/**
 * The catalog reads from Supabase when it is configured, and from the bundled
 * seed file otherwise, so `npm run dev` works before the database exists.
 */

export const CATEGORIES = seed.categories;

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

function fromSeed(slug) {
  return (seed.products[slug] || []).map((p, i) => ({
    id: `${slug}-${i + 1}`,
    ...p,
    currency: "USD",
    in_stock: true,
  }));
}

export async function getProductsByCategory(slug) {
  if (!isSupabaseConfigured) return fromSeed(slug);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, subtitle, description, price, currency, image_url, badge, in_stock, sort, categories!inner(slug)")
    .eq("categories.slug", slug)
    .order("sort", { ascending: true });

  if (error) {
    console.error(`[catalogo] Supabase query failed for "${slug}":`, error.message);
    return fromSeed(slug);
  }
  return data ?? [];
}

/** Todos los productos visibles, de todas las categorías. Son pocas decenas, así que
 *  la lista de deseos los trae de una y filtra en el cliente por los ids guardados. */
export async function getAllProducts() {
  if (!isSupabaseConfigured) {
    return CATEGORIES.flatMap((c) => fromSeed(c.slug).map((p) => ({ ...p, categorySlug: c.slug })));
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, subtitle, description, price, currency, image_url, badge, in_stock, sort, categories!inner(slug, name)")
    .order("sort", { ascending: true });

  if (error) {
    console.error("[catalogo] Supabase query failed for all products:", error.message);
    return CATEGORIES.flatMap((c) => fromSeed(c.slug).map((p) => ({ ...p, categorySlug: c.slug })));
  }
  return (data ?? []).map((p) => ({ ...p, categorySlug: p.categories?.slug }));
}

// Lempiras hondureños. Mismo formato que la ferretería: "L 1,280".
export function formatPrice(price) {
  return "L " + Number(price || 0).toLocaleString("es-HN", { maximumFractionDigits: 0 });
}
