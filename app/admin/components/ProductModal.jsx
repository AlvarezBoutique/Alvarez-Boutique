"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/browserClient";
import Modal from "./Modal";
import { Field, inputClass, ErrorNote, PrimaryButton, GhostButton } from "./Field";

const BADGES = ["", "Novedad", "Edición Limitada", "Más Vendido"];
const MAX_MB = 5;

export default function ProductModal({ product, categoryName, onSave, onDelete, onClose }) {
  const [f, setF] = useState({
    name: product?.name || "",
    subtitle: product?.subtitle || "",
    description: product?.description || "",
    price: product?.price ?? "",
    image_url: product?.image_url || "",
    badge: product?.badge || "",
    in_stock: product?.in_stock ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const valid = f.name.trim() && f.price !== "" && Number(f.price) >= 0;

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Ese archivo no es una imagen.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      // Nombre único: evita que dos fotos con el mismo nombre se pisen.
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) throw new Error(upErr.message);

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setF((prev) => ({ ...prev, image_url: data.publicUrl }));
    } catch (err) {
      setError(`No se pudo subir la foto: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await onSave({
        ...(product ? { id: product.id } : {}),
        name: f.name.trim(),
        subtitle: f.subtitle.trim() || null,
        description: f.description.trim() || null,
        price: Number(f.price) || 0,
        image_url: f.image_url.trim() || null,
        badge: f.badge || null,
        in_stock: f.in_stock,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={product ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      <p className="-mt-3 mb-5 text-sm text-on-surface-variant/70">
        Se publicará en <strong className="text-primary">{categoryName}</strong>.
      </p>

      {/* Foto */}
      <div className="mb-5">
        <span className="mb-1.5 block font-label text-label-sm uppercase tracking-[0.08em] text-on-surface-variant/70">
          Foto del producto
        </span>
        <div className="flex gap-4">
          <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded border border-outline-variant/50 bg-[#F2F0F7]">
            {f.image_url ? (
              <Image src={f.image_url} alt="" fill sizes="96px" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-outline-variant">
                <span className="material-symbols-outlined">image</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={pickFile}
              disabled={uploading}
              className="block w-full text-sm text-on-surface-variant file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:font-label file:text-label-sm file:uppercase file:text-on-primary hover:file:bg-on-primary-container disabled:opacity-50"
            />
            <p className="mt-2 text-xs leading-relaxed text-on-surface-variant/60">
              {uploading
                ? "Subiendo foto…"
                : `JPG o PNG, máximo ${MAX_MB} MB. Se recomienda vertical (3:4).`}
            </p>
            {f.image_url && !uploading && (
              <button
                type="button"
                onClick={() => setF((prev) => ({ ...prev, image_url: "" }))}
                className="mt-1 text-xs text-error underline"
              >
                Quitar foto
              </button>
            )}
          </div>
        </div>
      </div>

      <Field label="Nombre">
        <input className={inputClass} value={f.name} onChange={set("name")} placeholder="Vestido Lencero de Seda" autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio (USD)">
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={f.price}
            onChange={set("price")}
            placeholder="420"
          />
        </Field>
        <Field label="Etiqueta">
          <select className={inputClass} value={f.badge} onChange={set("badge")}>
            {BADGES.map((b) => (
              <option key={b} value={b}>
                {b || "Sin etiqueta"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Subtítulo" hint="Color o variante. Ej: Bruma Lavanda">
        <input className={inputClass} value={f.subtitle} onChange={set("subtitle")} />
      </Field>

      <Field label="Descripción">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} value={f.description} onChange={set("description")} />
      </Field>

      <label className="mb-5 flex items-center gap-2">
        <input
          type="checkbox"
          checked={f.in_stock}
          onChange={(e) => setF((prev) => ({ ...prev, in_stock: e.target.checked }))}
          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/30"
        />
        <span className="text-body-md text-on-surface">Disponible en el catálogo</span>
      </label>

      <ErrorNote>{error}</ErrorNote>

      <div className="flex items-center justify-end gap-3">
        {product && (
          <button
            type="button"
            onClick={() => window.confirm(`¿Eliminar "${product.name}" del catálogo?`) && onDelete(product.id)}
            className="mr-auto text-sm text-error underline"
          >
            Eliminar
          </button>
        )}
        <GhostButton type="button" onClick={onClose}>
          Cancelar
        </GhostButton>
        <PrimaryButton type="button" disabled={!valid || busy || uploading} onClick={submit}>
          {busy ? "Guardando…" : "Guardar"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
