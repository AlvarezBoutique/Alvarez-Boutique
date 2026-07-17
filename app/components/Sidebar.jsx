"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/catalog";
import Logo, { BRAND, TAGLINE } from "./Logo";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-sidebar-width flex-col space-y-gutter border-r border-primary/10 py-margin-y shadow-xl shadow-primary/5 glass-panel lg:flex">
      <div className="mb-12 flex items-center gap-3 px-8">
        <Logo size={52} />
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight tracking-tight text-primary">
            Alvarez
            <span className="block">Boutique</span>
          </h1>
          <p className="mt-1 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60">
            {TAGLINE}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {CATEGORIES.map((cat) => {
          const href = `/${cat.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={cat.slug}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "group flex items-center border-l-2 border-primary bg-primary/5 px-8 py-3 font-bold text-primary transition-all duration-300"
                  : "group flex items-center px-8 py-3 text-on-surface-variant transition-all duration-300 hover:bg-primary/5 hover:text-primary"
              }
            >
              <span
                className={`material-symbols-outlined mr-4 ${
                  active ? "" : "opacity-70 group-hover:opacity-100"
                }`}
              >
                {cat.icon}
              </span>
              <span className="font-label text-label-sm">{cat.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 border-t border-primary/5 px-8 pt-8">
        <div className="mb-6 flex items-center space-x-3 rounded-xl bg-surface-container-low p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
          <div>
            <p className="font-label text-label-sm font-bold">Perfil</p>
            <p className="text-[10px] text-on-surface-variant/70">Membresía: Gold</p>
          </div>
        </div>

        <Link
          href="#"
          className="group flex items-center py-1 text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">settings</span>
          <span className="font-label text-label-sm">Ajustes</span>
        </Link>
        <Link
          href="#"
          className="group flex items-center py-1 text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">help</span>
          <span className="font-label text-label-sm">Ayuda</span>
        </Link>
      </div>
    </aside>
  );
}
