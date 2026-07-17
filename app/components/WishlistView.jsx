"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/catalog";
import { BRAND } from "./Logo";

const WISHLIST_KEY = "alvarez:wishlist";
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_TIENDA;

export default function WishlistView({ allProducts }) {
  const searchParams = useSearchParams();
  const shared = searchParams.get("items");

  const [ownIds, setOwnIds] = useState([]);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISHLIST_KEY);
      setOwnIds(raw ? JSON.parse(raw) : []);
    } catch {
      setOwnIds([]);
    }
    setReady(true);
  }, []);

  // Con ?items= mostramos esa lista (es lo que abre el dueño); sin él, la del visitante.
  const isShared = Boolean(shared);
  const ids = useMemo(() => (isShared ? shared.split(",").filter(Boolean) : ownIds), [isShared, shared, ownIds]);

  const items = useMemo(() => {
    // Respetamos el orden en que vienen los ids, no el del catálogo.
    const byId = new Map(allProducts.map((p) => [String(p.id), p]));
    return ids.map((id) => byId.get(String(id))).filter(Boolean);
  }, [allProducts, ids]);

  const total = items.reduce((s, p) => s + Number(p.price || 0), 0);
  const faltantes = ids.length - items.length;

  function remove(id) {
    const next = ownIds.filter((x) => x !== id);
    setOwnIds(next);
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const shareUrl =
    typeof window !== "undefined" && items.length
      ? `${window.location.origin}/deseos?items=${items.map((p) => p.id).join(",")}`
      : "";

  const mensaje = () => {
    const lista = items.map((p) => `• ${p.name} — ${formatPrice(p.price)}`).join("\n");
    const saludo = nombre.trim() ? `Hola, soy ${nombre.trim()}.` : "Hola.";
    return `${saludo} Me interesan estas piezas de ${BRAND}:\n\n${lista}\n\nVerlas aquí: ${shareUrl}`;
  };

  async function copiar() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sin permiso de portapapeles: al menos que puedan seleccionarlo a mano.
      window.prompt("Copia este link:", shareUrl);
    }
  }

  if (!ready && !isShared) {
    return <p className="py-20 text-center text-body-md text-on-surface-variant/60">Cargando…</p>;
  }

  return (
    <section className="mx-auto max-w-container-max px-5 pb-margin-y pt-32 lg:px-margin-x lg:pt-24">
      <div className="mb-10">
        <p className="mb-2 font-label text-label-sm uppercase tracking-[0.2em] text-primary">
          {isShared ? "Lista compartida" : "Tus favoritos"}
        </p>
        <h1 className="mb-2 font-headline text-2xl text-on-surface lg:text-headline-lg">
          {isShared ? "Piezas que le gustaron a tu clienta" : "Lista de deseos"}
        </h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant/80">
          {isShared
            ? `${items.length} ${items.length === 1 ? "pieza seleccionada" : "piezas seleccionadas"} · ${formatPrice(total)} en total`
            : items.length
              ? "Comparte la lista con la tienda y te confirmamos disponibilidad."
              : "Toca el corazón en cualquier pieza para guardarla aquí."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-primary/20 py-20 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-outline-variant">favorite</span>
          <p className="font-headline text-title-md text-on-surface">
            {isShared ? "Esta lista ya no está disponible" : "Todavía no has guardado nada"}
          </p>
          <p className="mt-1 text-body-md text-on-surface-variant/70">
            {isShared
              ? "Puede que las piezas ya no estén en el catálogo."
              : "Explora el catálogo y guarda lo que te guste."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded bg-primary px-5 py-2 font-label text-label-sm uppercase text-on-primary transition-colors hover:bg-on-primary-container"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Piezas */}
          <ul className="space-y-4">
            {items.map((p) => (
              <li key={p.id} className="flex gap-4 overflow-hidden rounded-lg p-3 glass-card">
                <div className="relative isolate h-28 w-20 shrink-0 overflow-hidden rounded bg-[#F2F0F7]">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="80px"
                      // Eager, igual que en el catálogo: en navegación cliente estas
                      // miniaturas montan ya dentro del viewport y el lazy de
                      // next/image puede dejarlas cargadas pero sin pintar.
                      priority
                      className="object-cover mix-blend-multiply"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-outline-variant">
                      <span className="material-symbols-outlined">image</span>
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <h2 className="font-headline text-title-md text-on-surface">{p.name}</h2>
                  {p.subtitle && (
                    <p className="mt-0.5 font-label text-label-sm uppercase tracking-[0.08em] text-on-surface-variant/60">
                      {p.subtitle}
                    </p>
                  )}
                  <p className="mt-1 font-label text-label-sm text-primary">
                    {formatPrice(p.price)}
                  </p>
                </div>

                {!isShared && (
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label={`Quitar ${p.name} de la lista`}
                    className="self-start p-1 text-outline transition-colors hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Compartir / resumen */}
          <aside className="h-fit rounded-lg p-6 glass-card lg:sticky lg:top-24">
            <div className="mb-5 flex items-baseline justify-between">
              <span className="font-label text-label-sm uppercase tracking-[0.08em] text-on-surface-variant/70">
                Total
              </span>
              <span className="font-headline text-2xl text-primary">{formatPrice(total)}</span>
            </div>

            {isShared ? (
              <p className="text-body-md leading-relaxed text-on-surface-variant/80">
                Esta es la selección que te compartieron. Los precios son los del catálogo al
                momento de abrir el link.
              </p>
            ) : (
              <>
                <label className="mb-4 block">
                  <span className="mb-1.5 block font-label text-label-sm uppercase tracking-[0.08em] text-on-surface-variant/70">
                    Tu nombre <span className="normal-case tracking-normal">(opcional)</span>
                  </span>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="María"
                    className="w-full rounded border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 font-body text-body-md placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                {WHATSAPP ? (
                  <a
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 font-label text-label-sm uppercase text-on-primary transition-colors hover:bg-on-primary-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Enviar por WhatsApp
                  </a>
                ) : (
                  <p className="mb-3 rounded border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs leading-relaxed text-on-surface-variant/70">
                    Para el botón de WhatsApp falta configurar{" "}
                    <code className="text-on-surface">NEXT_PUBLIC_WHATSAPP_TIENDA</code>.
                  </p>
                )}

                <button
                  type="button"
                  onClick={copiar}
                  className="flex w-full items-center justify-center gap-2 rounded border border-primary/30 py-2.5 font-label text-label-sm uppercase text-primary transition-colors hover:bg-primary/5"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? "check" : "link"}
                  </span>
                  {copied ? "Link copiado" : "Copiar link"}
                </button>

                <p className="mt-4 text-xs leading-relaxed text-on-surface-variant/60">
                  El link lleva tu selección dentro, así que quien lo abra ve exactamente estas
                  piezas. No guarda datos tuyos.
                </p>
              </>
            )}
          </aside>
        </div>
      )}

      {faltantes > 0 && (
        <p className="mt-6 text-center text-xs text-on-surface-variant/60">
          {faltantes} {faltantes === 1 ? "pieza ya no está" : "piezas ya no están"} en el catálogo y
          no {faltantes === 1 ? "se muestra" : "se muestran"}.
        </p>
      )}
    </section>
  );
}
