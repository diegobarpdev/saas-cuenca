import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: business } = await supabase
    .from('businesses')
    .select('nombre, slogan, logo_url, categoria')
    .eq('slug', slug)
    .single();

  if (!business) {
    return {
      title: 'Catálogo no encontrado',
      robots: { index: false, follow: false },
    };
  }

  const title = business.nombre;
  const description =
    business.slogan ||
    `Pide en línea desde el catálogo de ${business.nombre}. Menú digital con WhatsApp y pagos integrados.`;
  const ogImage = business.logo_url || '/assets/KALTIRO_FONDO_PRINCIPAL.png';
  const canonicalUrl = `https://kaltiro.com/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      locale: 'es_EC',
      url: canonicalUrl,
      siteName: 'Kaltiro',
      title,
      description,
      images: [{ url: ogImage, width: 800, height: 800, alt: business.nombre }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
