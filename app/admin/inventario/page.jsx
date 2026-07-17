"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/browserClient";
import { formatPrice } from "@/lib/catalog";
import ProductModal from "../components/ProductModal";
import Modal from "../components/Modal";
import { ErrorNote, PrimaryButton, GhostButton, inputClass } from "../components/Field";

const TODAS = "todas";

export default function InventarioPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState(TODAS);
  const [editing, setEditing] = useState(null); // null | {} | product

  // Modo selección para borrar varios de una vez.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmDel, setConfirmDel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: prods, error: e1 }, { data: cats, error: e2 }] = await Promise.all([
      supabase.from("products").select("*, categories(id, name, slug)").order("sort", { ascending: true }),
      supabase.from("categories").select("id, name, slug").order("sort"),
    ]);
    if (e1 || e2) setError((e1 || e2).message);
    else {
      setProducts(prods || []);
      setCategories(cats || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (p) => {
    const row = { ...p };
    if (!row.id) {
      // El orden se calcula dentro de su propia categoría.
      const enCat = products.filter((x) => x.category_id === row.category_id);
      row.sort = (enCat.at(-1)?.sort || 0) + 1;
    }
    // `categories` viene del join de lectura; no es una columna que se pueda escribir.
    delete row.categories;

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

  const removeMany = async (ids) => {
    const { error: err } = await supabase.from("products").delete().in("id", ids);
    if (err) throw new Error(err.message);
    await load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== TODAS && p.category_id !== cat) return false;
      if (!q) return true;
      return [p.name, p.subtitle, p.description].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [products, search, cat]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // "Todos" se refiere a lo que estás viendo con el filtro puesto, no a todo el inventario.
  const todosVisiblesMarcados = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleTodosVisibles = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (todosVisiblesMarcados) filtered.forEach((p) => next.delete(p.id));
      else filtered.forEach((p) => next.add(p.id));
      return next;
    });

  const salirSeleccion = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const visibles = products.filter((p) => p.in_stock).length;
  const marcados = products.filter((p) => selected.has(p.id));

  return (
    <section className="mx-auto max-w-container-max px-5 py-8 lg:px-margin-x lg:py-margin-y">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-label text-label-sm uppercase tracking-[0.2em] text-primary">Catálogo</p>
          <h1 className="font-headline text-2xl text-on-surface lg:text-headline-lg">Inventario</h1>
          <p className="mt-1 text-body-md text-on-surface-variant/80">
            {loading
              ? "Cargando…"
              : selecting
                ? `${selected.size} seleccionado${selected.size === 1 ? "" : "s"}`
                : `${products.length} producto${products.length === 1 ? "" : "s"} · ${visibles} visible${
                    visibles === 1 ? "" : "s"
                  } en el catálogo`}
          </p>
        </div>

        {selecting ? (
          <div className="flex flex-wrap items-center gap-3">
            <GhostButton type="button" onClick={toggleTodosVisibles} disabled={filtered.length === 0}>
              {todosVisiblesMarcados ? "Quitar todos" : "Seleccionar todos"}
            </GhostButton>
            <GhostButton type="button" onClick={salirSeleccion}>
              Cancelar
            </GhostButton>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => setConfirmDel(true)}
              className="rounded bg-error px-5 py-2 font-label text-label-sm uppercase text-on-error transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Eliminar ({selected.size})
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {products.length > 0 && (
              <GhostButton type="button" onClick={() => setSelecting(true)}>
                Eliminar productos
              </GhostButton>
            )}
            <PrimaryButton type="button" onClick={() => setEditing({})}>
              + Nuevo producto
            </PrimaryButton>
          </div>
        )}
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="mb-8 flex flex-wrap gap-3">
        <div className="flex min-w-[240px] flex-1 items-center rounded-full border border-transparent bg-surface-container-low px-4 py-2 focus-within:border-primary/20 sm:max-w-md">
          <span className="material-symbols-outlined mr-2 text-[20px] text-outline">search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            aria-label="Buscar productos"
            className="w-full border-none bg-transparent font-body text-body-md placeholder:text-outline-variant focus:outline-none"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Filtrar por categoría"
          className={`${inputClass} w-auto rounded-full`}
        >
          <option value={TODAS}>Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-primary/20 py-20 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-outline-variant">
            {products.length === 0 ? "inventory_2" : "search_off"}
          </span>
          <p className="font-headline text-title-md text-on-surface">
            {products.length === 0 ? "Aún no hay productos" : "Nada coincide con ese filtro"}
          </p>
          <p className="mt-1 text-body-md text-on-surface-variant/70">
            {products.length === 0
              ? "Sube el primero con “+ Nuevo producto”."
              : "Prueba con otro nombre o cambia la categoría."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-gutter">
          {filtered.map((p) => {
            const sel = selected.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selecting ? sel : undefined}
                onClick={() => (selecting ? toggle(p.id) : setEditing(p))}
                className={`group flex flex-col overflow-hidden rounded-lg text-left glass-card ${
                  selecting && sel ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="relative isolate aspect-[3/4] overflow-hidden bg-[#F2F0F7]">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className={`object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105 ${
                        selecting && !sel ? "opacity-60" : ""
                      }`}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-outline-variant">
                      <span className="material-symbols-outlined text-3xl">image</span>
                    </div>
                  )}

                  {selecting && (
                    <span
                      className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 backdrop-blur-md transition-colors ${
                        sel ? "border-primary bg-primary text-on-primary" : "border-white/80 bg-white/60"
                      }`}
                    >
                      {sel && <span className="material-symbols-outlined text-[16px]">check</span>}
                    </span>
                  )}

                  {!p.in_stock && !selecting && (
                    <span className="absolute left-3 top-3 rounded-full bg-surface-container-highest/90 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.08em] text-on-surface-variant backdrop-blur-md">
                      Oculto
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="mb-1 font-label text-[10px] uppercase tracking-[0.08em] text-primary">
                    {p.categories?.name}
                  </p>
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
            );
          })}
        </div>
      )}

      {editing !== null && (
        <ProductModal
          product={editing.id ? editing : null}
          categories={categories}
          // Al crear, propone la categoría del filtro activo: si estás viendo
          // Perfumes, lo más probable es que quieras subir un perfume.
          defaultCategoryId={cat !== TODAS ? cat : categories[0]?.id}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDel && (
        <ConfirmarBorrado
          items={marcados}
          onConfirm={async () => {
            await removeMany(marcados.map((p) => p.id));
            setConfirmDel(false);
            salirSeleccion();
          }}
          onClose={() => setConfirmDel(false)}
        />
      )}
    </section>
  );
}

function ConfirmarBorrado({ items, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Eliminar ${items.length} producto${items.length === 1 ? "" : "s"}`} onClose={onClose}>
      <p className="-mt-3 mb-5 text-sm leading-relaxed text-on-surface-variant/70">
        Se quitarán del catálogo público de inmediato. Esta acción no se puede deshacer.
      </p>

      <ul className="mb-5 max-h-60 overflow-y-auto rounded border border-outline-variant/40 divide-y divide-outline-variant/30">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="truncate text-body-md text-on-surface">{p.name}</span>
            <span className="shrink-0 font-label text-[10px] uppercase tracking-[0.08em] text-on-surface-variant/60">
              {p.categories?.name}
            </span>
          </li>
        ))}
      </ul>

      <ErrorNote>{error}</ErrorNote>

      <div className="flex justify-end gap-3">
        <GhostButton type="button" onClick={onClose}>
          Cancelar
        </GhostButton>
        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          className="rounded bg-error px-5 py-2 font-label text-label-sm uppercase text-on-error transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Eliminando…" : `Eliminar ${items.length}`}
        </button>
      </div>
    </Modal>
  );
}
