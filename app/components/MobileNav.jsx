"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/catalog";
import Logo from "./Logo";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-primary/10 glass-panel lg:hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display text-xl tracking-tight text-primary">Alvarez Boutique</span>
        </Link>
        <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60">
          Lujo Silencioso
        </span>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-3 py-2">
        {CATEGORIES.map((cat) => {
          const href = `/${cat.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={cat.slug}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 font-label text-label-sm transition-colors ${
                active
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
        <Link
          href="/deseos"
          aria-label="Lista de deseos"
          className={`ml-1 flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
            pathname === "/deseos"
              ? "bg-primary text-on-primary"
              : "text-tertiary hover:bg-primary/5"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">favorite</span>
        </Link>
      </nav>
    </div>
  );
}
