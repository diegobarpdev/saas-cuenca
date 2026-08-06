import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Piku 🚀 - Sistema de Pedidos en Vivo & Catálogo Digital para Cuenca',
  description: 'Plataforma SaaS multi-empresa de pedidos en tiempo real, cobros con PayPhone / Deuna y comanda térmica POS para comercios de Cuenca y Ecuador.',
  keywords: ['Piku', 'Piku Ecuador', 'pedidos Cuenca', 'catálogo digital', 'comanda pos', 'payphone', 'deuna'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Space+Grotesk:wght@500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#080B11] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        {children}
        <Toaster position="bottom-right" theme="dark" closeButton richColors />
      </body>
    </html>
  );
}
