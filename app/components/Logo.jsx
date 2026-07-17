import Image from "next/image";

export const BRAND = "Alvarez Boutique";
export const TAGLINE = "Lujo Silencioso";

/**
 * El logo original es dorado sobre un fondo negro cuadrado. Se recorta a círculo
 * (`rounded-full`) para que ese negro lea como una insignia sobre el fondo pastel,
 * en vez de un bloque negro con esquinas.
 */
export default function Logo({ size = 48, className = "" }) {
  return (
    <Image
      src="/logo.jpg"
      alt={BRAND}
      width={size}
      height={size}
      priority
      className={`shrink-0 rounded-full ring-1 ring-primary/15 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
