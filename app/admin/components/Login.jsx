"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/browserClient";
import { Field, inputClass, ErrorNote } from "./Field";
import Logo from "@/app/components/Logo";

export default function Login() {
  const { signIn, signUpFirstAccount, hasAccounts, authError, setAuthError } = useAuth();
  const [mode, setMode] = useState("login"); // login | setup
  const [checked, setChecked] = useState(false);
  const [categories, setCategories] = useState([]);
  const [f, setF] = useState({ username: "", fullName: "", password: "", categoryId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  // Si aún no hay ninguna cuenta, ofrecemos crear la primera. Si la consulta falla
  // nos quedamos en modo login y lo decimos: no sabemos si hay cuentas, y ofrecer
  // "crear la primera" sobre una base inalcanzable sería mentir sobre su estado.
  useEffect(() => {
    let active = true;
    hasAccounts()
      .then(async (exists) => {
        if (!active) return;
        if (!exists) {
          setMode("setup");
          const { data } = await supabase.from("categories").select("id, name").order("sort");
          if (!active) return;
          setCategories(data || []);
          setF((prev) => ({ ...prev, categoryId: data?.[0]?.id || "" }));
        }
      })
      .catch(() => {
        if (active) setError("No se pudo conectar con la base de datos. Revisa tu conexión o las variables de entorno.");
      })
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setAuthError(null);
    setBusy(true);
    try {
      if (mode === "setup") {
        if (f.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        await signUpFirstAccount(f);
      } else {
        await signIn(f.username, f.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-primary/10 bg-white/80 p-8 shadow-xl shadow-primary/5 backdrop-blur-xl"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={88} className="mb-4" />
          <h1 className="font-display text-3xl tracking-tight text-primary">Alvarez Boutique</h1>
          <p className="mt-1 font-label text-label-sm uppercase tracking-[0.2em] text-on-surface-variant/60">
            Panel de inventario
          </p>
        </div>

        <p className="mb-6 text-center text-body-md text-on-surface-variant/80">
          {mode === "setup" ? "Crea la primera cuenta" : "Inicia sesión para continuar"}
        </p>

        {mode === "setup" && (
          <>
            <Field label="Nombre completo">
              <input className={inputClass} value={f.fullName} onChange={set("fullName")} autoFocus />
            </Field>
            <Field label="Categoría a cargo" hint="Sólo podrás subir productos de esta categoría.">
              <select className={inputClass} value={f.categoryId} onChange={set("categoryId")}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        <Field label="Nombre de usuario">
          <input
            className={inputClass}
            value={f.username}
            onChange={set("username")}
            autoCapitalize="none"
            placeholder="elena"
            autoFocus={mode === "login"}
          />
        </Field>

        <Field label="Contraseña">
          <input className={inputClass} type="password" value={f.password} onChange={set("password")} />
        </Field>

        <ErrorNote>{error || authError}</ErrorNote>

        <button
          disabled={busy || !checked}
          className="w-full rounded bg-primary py-2.5 font-label text-label-sm uppercase text-on-primary transition-all hover:bg-on-primary-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Un momento…" : mode === "setup" ? "Crear cuenta" : "Entrar"}
        </button>

        {mode === "setup" && (
          <p className="mt-4 text-center text-xs leading-relaxed text-on-surface-variant/70">
            Todas las cuentas son iguales: no hay administradores. Después podrás crear las demás
            desde <strong className="text-on-surface">Cuentas</strong>.
          </p>
        )}
      </form>
    </div>
  );
}
