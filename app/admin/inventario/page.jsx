"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/browserClient";
import { formatPrice } from "@/lib/catalog";
import ProductModal from "../components/ProductModal";
import { ErrorNote, PrimaryButton } from "../components/Field";

export default function InventarioPage() {
  const { categoryId, category } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | {} | product

  const load = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .order("sort", { ascending: true });
    if (err) setError(err.message);
    else setProducts(data || []);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (p) => {
    // El category_id lo fija la cuenta, no el formulario: RLS rechaza cualquier otro.
    const row = { ...p, category_id: categoryId };
    if (!row.id) row.sort = (products.at(-1)?.sort || 0) + 1;

    const { error: err } = row.id
      ? await supabase.from("products").update(row).eq("id", row.id)
      : await supabase.from("products").insert(row);

    if (err) throw new Error(err.message);
    await load();
    setEditing(null);
  };

  const remove = async (id) => {
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    await load();
    setEditing(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.subtitle, p.description].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [products, search]);

  const visibles = products.filter((p) => p.in_stock).length;

  return (
    <section className="mx-auto max-w-container-max px-5 py-8 lg:px-margin-x lg:py-margin-y">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-label text-label-sm uppercase tracking-[0.2em] text-primary">
            {category?.name || "Inventario"}
          </p>
          <h1 className="font-headline text-2xl text-on-surface lg:text-headline-lg">Inventario</h1>
          <p className="mt-1 text-body-md text-on-surface-variant/80">
            {loading
              ? "Cargando…"
              : `${products.length} producto${products.length === 1 ? "" : "s"} · ${visibles} visible${
                  visibles === 1 ? "" : "s"
                } en el catálogo`}
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => setEditing({})}>
          + Nuevo producto
        </PrimaryButton>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="mb-8 flex max-w-md items-center rounded-full border border-transparent bg-surface-container-low px-4 py-2 focus-within:border-primary/20">
        <span className="material-symbols-outlined mr-2 text-[20px] text-outline">search</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en tu inventario…"
          aria-label="Buscar productos"
          className="w-full border-none bg-transparent font-body text-body-md placeholder:text-outline-variant focus:outline-none"
        />
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-primary/20 py-20 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-outline-variant">
            {products.length === 0 ? "inventory_2" : "search_off"}
          </span>
          <p className="font-headline text-title-md text-on-surface">
            {products.length === 0 ? "Aún no hay productos" : `Nada coincide con “${search}”`}
          </p>
          <p className="mt-1 text-body-md text-on-surface-variant/70">
            {products.length === 0
              ? "Sube el primero con “+ Nuevo producto”."
              : "Prueba con otro nombre o color."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-gutter">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setEditing(p)}
              className="group flex flex-col overflow-hidden rounded-lg text-left glass-card"
            >
              <div className="relative isolate aspect-[3/4] overflow-hidden bg-[#F2F0F7]">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-outline-variant">
                    <span className="material-symbols-outlined text-3xl">image</span>
                  </div>
                )}
                {!p.in_stock && (
                  <span className="absolute left-3 top-3 rounded-full bg-surface-container-highest/90 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.08em] text-on-surface-variant backdrop-blur-md">
                    Oculto
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-headline text-title-md">{p.name}</h3>
                  <span className="shrink-0 font-label text-label-sm text-primary">
                    {formatPrice(p.price, p.currency)}
                  </span>
                </div>
                {p.subtitle && (
                  <p className="mt-1 font-label text-label-sm uppercase tracking-[0.08em] text-on-surface-variant/60">
                    {p.subtitle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {editing !== null && (
        <ProductModal
          product={editing.id ? editing : null}
          categoryName={category?.name || ""}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
