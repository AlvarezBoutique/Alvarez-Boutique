"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Logo from "@/app/components/Logo";

const NAV = [
  { href: "/admin/inventario", label: "Inventario", icon: "inventory_2" },
  { href: "/admin/cuentas", label: "Cuentas", icon: "group" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-sidebar-width flex-col space-y-gutter border-r border-primary/10 py-margin-y shadow-xl shadow-primary/5 glass-panel lg:flex">
        <div className="mb-10 flex items-center gap-3 px-8">
          <Logo size={52} />
          <div className="min-w-0">
            <h1 className="font-display text-2xl leading-tight tracking-tight text-primary">
              Alvarez
              <span className="block">Boutique</span>
            </h1>
            <p className="mt-1 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60">
              Panel de inventario
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "group flex items-center border-l-2 border-primary bg-primary/5 px-8 py-3 font-bold text-primary transition-all duration-300"
                    : "group flex items-center px-8 py-3 text-on-surface-variant transition-all duration-300 hover:bg-primary/5 hover:text-primary"
                }
              >
                <span className={`material-symbols-outlined mr-4 ${active ? "" : "opacity-70"}`}>
                  {item.icon}
                </span>
                <span className="font-label text-label-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 border-t border-primary/5 px-8 pt-8">
          <div className="rounded-xl bg-surface-container-low p-3">
            <p className="font-label text-label-sm font-bold text-on-surface">
              {profile?.full_name || profile?.username}
            </p>
            <p className="text-[10px] text-on-surface-variant/70">@{profile?.username}</p>
          </div>

          <Link
            href="/"
            className="flex items-center py-1 text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined mr-3 text-[20px]">storefront</span>
            <span className="font-label text-label-sm">Ver catálogo</span>
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center py-1 text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined mr-3 text-[20px]">logout</span>
            <span className="font-label text-label-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Barra superior en móvil */}
      <div className="fixed inset-x-0 top-0 z-50 border-b border-primary/10 glass-panel lg:hidden">
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <span className="font-display text-xl tracking-tight text-primary">Alvarez Boutique</span>
          <button
            type="button"
            onClick={signOut}
            className="font-label text-label-sm uppercase text-on-surface-variant"
          >
            Salir
          </button>
        </div>
        <nav className="flex gap-1 px-3 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 font-label text-label-sm transition-colors ${
                  active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-primary/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="min-h-screen pt-28 lg:ml-sidebar-width lg:pt-0">{children}</main>
    </>
  );
}
