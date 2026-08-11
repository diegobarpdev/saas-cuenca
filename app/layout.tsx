import type { Metadata } from 'next';
import { CustomToaster } from '@/components/ui/CustomToaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaltiro.com — Pedidos directos para tu restaurante. $20/mes, 0% de comisión.',
  description: 'Kaltiro es la plataforma de pedidos para restaurantes, cafeterías y negocios de comida en Ecuador. Catálogo digital con QR, pedidos a WhatsApp, cobros integrados y cero comisión por venta. Plan fijo $20/mes.',
  keywords: [
    'kaltiro', 'kaltiro.com', 'catálogo digital restaurante ecuador',
    'pedidos whatsapp restaurante', 'menú digital QR cuenca',
    'plataforma pedidos sin comisión', 'sistema pedidos restaurante cuenca',
    'payphone restaurant', 'pedidos online ecuador', '0 comision delivery',
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <CustomToaster />
      </body>
    </html>
  );
}
