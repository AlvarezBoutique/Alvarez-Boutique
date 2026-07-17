import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/catalog";

export default function Home() {
  // La primera categoría por orden, en vez de un slug fijo: si se renombran o
  // reordenan las categorías, la portada sigue apuntando a una que existe.
  redirect(`/${CATEGORIES[0].slug}`);
}
