"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/browserClient";
import Modal from "../components/Modal";
import { Field, inputClass, ErrorNote, PrimaryButton, GhostButton } from "../components/Field";

export default function CuentasPage() {
  const { profile, createAccount } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from("profiles").select("*").order("created_at");
    if (err) setError(err.message);
    else setAccounts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="mx-auto max-w-container-max px-5 py-8 lg:px-margin-x lg:py-margin-y">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-label text-label-sm uppercase tracking-[0.2em] text-primary">Equipo</p>
          <h1 className="font-headline text-2xl text-on-surface lg:text-headline-lg">Cuentas</h1>
          <p className="mt-1 text-body-md text-on-surface-variant/80">
            {loading
              ? "Cargando…"
              : `${accounts.length} cuenta${accounts.length === 1 ? "" : "s"} · todas con los mismos permisos`}
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => setCreating(true)}>
          + Nueva cuenta
        </PrimaryButton>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-gutter">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-lg p-5 glass-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-headline text-title-md text-on-surface">
                  {a.full_name || a.username}
                  {a.id === profile?.id && (
                    <span className="font-body text-body-md text-on-surface-variant/60"> · tú</span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-body-md text-on-surface-variant/70">@{a.username}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {!loading && accounts.length === 0 && (
        <div className="rounded-lg border border-dashed border-primary/20 py-16 text-center">
          <p className="text-body-md text-on-surface-variant/70">Todavía no hay cuentas.</p>
        </div>
      )}

      {creating && (
        <AccountModal
          onSave={async (a) => {
            await createAccount(a);
            await load();
            setCreating(false);
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </section>
  );
}

function AccountModal({ onSave, onClose }) {
  const [f, setF] = useState({ fullName: "", username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const valid = f.fullName.trim() && f.username.trim() && f.password.length >= 6;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await onSave(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Nueva cuenta" onClose={onClose}>
      <p className="-mt-3 mb-5 text-sm leading-relaxed text-on-surface-variant/70">
        Todas las cuentas tienen los mismos permisos: pueden subir y editar productos de
        cualquier categoría, y crear otras cuentas.
      </p>

      <Field label="Nombre completo">
        <input className={inputClass} value={f.fullName} onChange={set("fullName")} placeholder="Elena Ruiz" autoFocus />
      </Field>

      <Field label="Nombre de usuario" hint="Con esto inicia sesión. No es un correo.">
        <input
          className={inputClass}
          value={f.username}
          onChange={set("username")}
          autoCapitalize="none"
          placeholder="elena"
        />
      </Field>

      <Field label="Contraseña" hint="Mínimo 6 caracteres.">
        <input className={inputClass} type="password" value={f.password} onChange={set("password")} />
      </Field>

      <ErrorNote>{error}</ErrorNote>

      <div className="flex justify-end gap-3">
        <GhostButton type="button" onClick={onClose}>
          Cancelar
        </GhostButton>
        <PrimaryButton type="button" disabled={!valid || busy} onClick={submit}>
          {busy ? "Creando…" : "Crear cuenta"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
