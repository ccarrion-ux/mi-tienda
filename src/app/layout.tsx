import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Tienda",
  description: "Plataforma para crear y administrar tiendas online"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}