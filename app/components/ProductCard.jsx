"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/catalog";

const BADGE_STYLES = {
  "Novedad": "bg-secondary-container/70 text-on-secondary-container",
  "Edición Limitada": "bg-primary-fixed/80 text-on-primary-container",
  "Más Vendido": "bg-tertiary-fixed/80 text-on-tertiary-fixed-variant",
};

export default function ProductCard({ product, wished, onToggleWish, priority = false }) {
  const badgeClass = BADGE_STYLES[product.badge] || "bg-primary-fixed/80 text-on-primary-container";

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg glass-card">
      {/* `isolate` is load-bearing: it gives the multiply blend below a stacking context
          to resolve against. Without it the blend reaches the body's fixed-attachment
          wash, which Chromium composites separately, and the image paints white. */}
      <div className="relative isolate aspect-[3/4] overflow-hidden bg-[#F2F0F7]">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            // Eager, not lazy: these are the page's LCP images and they mount already
            // inside the viewport on an App Router soft navigation, where next/image's
            // lazy IntersectionObserver can settle without ever painting them.
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-outline-variant">
            <span className="material-symbols-outlined text-4xl">image</span>
          </div>
        )}

        {product.badge && (
          <span
            className={`absolute left-3 top-3 max-w-[calc(100%-4rem)] truncate rounded-full px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.08em] backdrop-blur-md lg:left-6 lg:top-6 lg:px-3 lg:text-label-sm ${badgeClass}`}
          >
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWish(product.id)}
          aria-label={wished ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          aria-pressed={wished}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-md transition-all hover:scale-110 lg:right-6 lg:top-6 lg:h-10 lg:w-10 ${
            wished ? "text-tertiary" : "text-outline hover:text-tertiary"
          }`}
          style={wished ? { boxShadow: "0 0 12px rgba(255, 209, 220, 0.9)" } : undefined}
        >
          <span className={`material-symbols-outlined text-[20px] ${wished ? "filled" : ""}`}>
            favorite
          </span>
        </button>
      </div>

      <div className="p-4 lg:p-6">
        <div className="mb-2 flex items-start justify-between gap-2 lg:gap-3">
          <h3 className="font-headline text-title-md">{product.name}</h3>
          <span className="shrink-0 font-label text-label-sm text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>
        {product.subtitle && (
          <p className="mb-2 font-label text-label-sm uppercase tracking-[0.08em] text-on-surface-variant/60">
            {product.subtitle}
          </p>
        )}
        <p className="line-clamp-2 text-body-md text-on-surface-variant/80">{product.description}</p>
      </div>
    </article>
  );
}
