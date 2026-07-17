"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

const WISHLIST_KEY = "alvarez:wishlist";

export default function CatalogView({ category, products }) {
  const [query, setQuery] = useState("");
  const [wishlist, setWishlist] = useState([]);

  // Wishlist lives in localStorage — no auth in this catalog yet.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISHLIST_KEY);
      if (raw) setWishlist(JSON.parse(raw));
    } catch {
      // ignore unreadable storage
    }
  }, []);

  function toggleWish(id) {
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      } catch {
        // ignore unwritable storage
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.subtitle, p.description].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed right-0 top-0 z-40 hidden h-16 w-[calc(100%-280px)] items-center justify-between px-margin-x glass-panel lg:flex">
        <div className="flex w-72 items-center rounded-full border border-transparent bg-surface-container-low px-4 py-1.5 transition-all focus-within:w-80 focus-within:border-primary/20">
          <span className="material-symbols-outlined mr-2 text-[20px] text-outline">search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar en el catálogo"
            className="w-full border-none bg-transparent font-body text-body-md placeholder:text-outline-variant focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex items-center space-x-6">
          <Link
            href="/deseos"
            className="relative transition-transform hover:scale-105"
            aria-label={
              wishlist.length ? `Lista de deseos, ${wishlist.length} guardadas` : "Lista de deseos"
            }
          >
            <span className={`material-symbols-outlined text-primary ${wishlist.length ? "filled" : ""}`}>
              favorite
            </span>
            {wishlist.length > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tertiary px-1 font-label text-[10px] font-bold text-on-tertiary">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button type="button" className="transition-transform hover:scale-105" aria-label="Notificaciones">
            <span className="material-symbols-outlined text-primary">notifications</span>
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-container-max px-5 pb-margin-y pt-32 lg:px-margin-x lg:pt-24">
        {/* Hero / title */}
        <div className="mb-10">
          <p className="mb-2 font-label text-label-sm uppercase tracking-[0.2em] text-primary">
            Colección curada
          </p>
          <h2 className="mb-2 font-headline text-2xl text-on-surface lg:text-headline-lg">
            {category.name}
          </h2>
          {/* Describe la colección, no el filtro: con la búsqueda vacía diría
              "de 0 piezas" justo al lado del mensaje de "nada coincide". */}
          <p className="max-w-2xl text-body-md text-on-surface-variant/80">
            Una selección breve de {products.length} {products.length === 1 ? "pieza" : "piezas"},
            elegidas por su textura, su contención y cómo envejecen con el tiempo.
          </p>
        </div>

        {/* Search on mobile */}
        <div className="mb-8 flex items-center rounded-full border border-transparent bg-surface-container-low px-4 py-2 focus-within:border-primary/20 lg:hidden">
          <span className="material-symbols-outlined mr-2 text-[20px] text-outline">search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar en el catálogo"
            className="w-full border-none bg-transparent font-body text-body-md placeholder:text-outline-variant focus:outline-none focus:ring-0"
          />
        </div>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-gutter">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                wished={wishlist.includes(product.id)}
                onToggleWish={toggleWish}
                priority={i < 3}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          // Colección sin piezas todavía (p. ej. una categoría recién creada).
          <div className="rounded-lg border border-dashed border-primary/20 py-20 text-center">
            <span className="material-symbols-outlined mb-3 text-4xl text-outline-variant">
              inventory_2
            </span>
            <p className="font-headline text-title-md text-on-surface">Colección en camino</p>
            <p className="mt-1 text-body-md text-on-surface-variant/70">
              Pronto encontrarás piezas aquí.
            </p>
          </div>
        ) : (
          // Hay piezas, pero la búsqueda no encontró ninguna.
          <div className="rounded-lg border border-dashed border-primary/20 py-20 text-center">
            <span className="material-symbols-outlined mb-3 text-4xl text-outline-variant">
              search_off
            </span>
            <p className="font-headline text-title-md text-on-surface">Nada coincide con «{query}»</p>
            <p className="mt-1 text-body-md text-on-surface-variant/70">
              Prueba con algo más suave: una tela, un color, un estado de ánimo.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
