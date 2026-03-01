import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JABR — Pipeline éditorial",
  description: "De l'idée au livre, sans friction. Plateforme SaaS de Jabrilia Éditions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
