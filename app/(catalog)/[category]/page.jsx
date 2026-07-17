import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryBySlug, getProductsByCategory } from "@/lib/catalog";
import CatalogView from "@/app/components/CatalogView";

// Revalidate the catalog every 5 minutes so Supabase edits show up without a redeploy.
export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }) {
  const category = getCategoryBySlug(params.category);
  if (!category) return {};
  return {
    title: `Alvarez Boutique | ${category.name}`,
    description: `${category.name} — una colección curada de Alvarez Boutique.`,
  };
}

export default async function CategoryPage({ params }) {
  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const products = await getProductsByCategory(category.slug);

  return <CatalogView category={category} products={products} />;
}
