import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "JABR — Pipeline éditorial intelligent",
  description: "Le cockpit éditorial intelligent. Du manuscrit au livre publié, en passant par la couverture, l'audiobook et le marketing. 28 modules, 10 moteurs IA.",
  keywords: ["édition", "publishing", "manuscrit", "couverture", "audiobook", "marketing éditorial", "JABR", "Jabrilia"],
  openGraph: {
    title: "JABR — Pipeline éditorial intelligent",
    description: "28 modules, 10 moteurs IA. De la couverture au plan média.",
    type: "website",
    url: "https://jabr-eta.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D1B4E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JABR" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{});}` }} />
      </head>
      <body className="antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
