"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { supabaseEnabled } from "@/lib/browserClient";
import AdminShell from "./components/AdminShell";
import Login from "./components/Login";

function Gate({ children }) {
  const { session, profile, loadingAuth } = useAuth();

  if (!supabaseEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-xl border border-primary/10 bg-white/80 p-8 text-center shadow-xl shadow-primary/5 backdrop-blur-xl">
          <h1 className="mb-3 font-display text-3xl text-primary">Falta configurar Supabase</h1>
          <p className="text-body-md leading-relaxed text-on-surface-variant/80">
            El panel necesita <code className="text-on-surface">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code className="text-on-surface">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. El catálogo
            público sigue funcionando con los datos de ejemplo, pero para subir productos hay que
            conectar la base de datos.
          </p>
        </div>
      </div>
    );
  }

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-label text-label-sm uppercase tracking-[0.2em] text-on-surface-variant/60">
          Cargando…
        </p>
      </div>
    );
  }

  if (!session || !profile) return <Login />;

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
