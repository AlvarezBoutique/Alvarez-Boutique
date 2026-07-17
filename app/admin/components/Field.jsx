"use client";

/** Shared form primitives so the admin forms stay visually consistent. */

export function Field({ label, hint, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block font-label text-label-sm uppercase tracking-[0.08em] text-on-surface-variant/70">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-on-surface-variant/60">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 font-body text-body-md text-on-surface transition-colors placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container disabled:text-on-surface-variant/60";

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="mb-4 rounded border border-error/20 bg-error-container/60 px-3 py-2 text-sm text-on-error-container"
    >
      {children}
    </p>
  );
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded bg-primary px-5 py-2 font-label text-label-sm uppercase text-on-primary transition-all hover:bg-on-primary-container disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded border border-primary/30 px-5 py-2 font-label text-label-sm uppercase text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
