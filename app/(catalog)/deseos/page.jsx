import { Suspense } from "react";
import { getAllProducts } from "@/lib/catalog";
import WishlistView from "@/app/components/WishlistView";

export const revalidate = 300;

export const metadata = {
  title: "Alvarez Boutique | Lista de deseos",
  description: "Las piezas que guardaste en Alvarez Boutique.",
};

export default async function DeseosPage() {
  // La selección vive en el cliente (localStorage o ?items=), pero los datos de los
  // productos vienen del servidor: así el link funciona aunque quien lo abra nunca
  // haya visitado el catálogo.
  const allProducts = await getAllProducts();

  return (
    <Suspense>
      <WishlistView allProducts={allProducts} />
    </Suspense>
  );
}
