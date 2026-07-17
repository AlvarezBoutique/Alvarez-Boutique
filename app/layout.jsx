import "./globals.css";

export const metadata = {
  title: "Alvarez Boutique | Catálogo",
  description:
    "Alvarez Boutique — catálogo de moda y fragancias. Damas, Caballeros, Niños, Bebés y Perfumes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="boutique-wash">{children}</body>
    </html>
  );
}
