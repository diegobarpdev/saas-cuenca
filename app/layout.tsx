import type { Metadata, Viewport } from 'next';
import { CustomToaster } from '@/components/ui/CustomToaster';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#080B11' },
    { media: '(prefers-color-scheme: light)', color: '#080B11' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://kaltiro.com'),
  title: {
    default: 'Kaltiro — Pedidos directos para tu restaurante. $29.99/mes, 0% de comisión.',
    template: '%s | Kaltiro',
  },
  description:
    'Kaltiro es la plataforma de pedidos para restaurantes, cafeterías y negocios de comida en Ecuador. Catálogo digital con QR, pedidos a WhatsApp, cobros integrados y cero comisión por venta. Plan fijo $29.99/mes.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    url: 'https://kaltiro.com',
    siteName: 'Kaltiro',
    title: 'Kaltiro — Pedidos directos para tu restaurante. $29.99/mes, 0% de comisión.',
    description:
      'Catálogo digital con QR, pedidos a WhatsApp, cobros integrados y cero comisión por venta. Plan fijo $29.99/mes.',
    images: [
      {
        url: '/assets/KALTIRO_FONDO_PRINCIPAL.png',
        width: 1200,
        height: 630,
        alt: 'Kaltiro — Plataforma de pedidos para restaurantes en Ecuador',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaltiro — Pedidos directos para tu restaurante',
    description:
      'Catálogo digital con QR, pedidos a WhatsApp, cobros integrados y 0% de comisión. $29.99/mes.',
    images: ['/assets/KALTIRO_FONDO_PRINCIPAL.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
