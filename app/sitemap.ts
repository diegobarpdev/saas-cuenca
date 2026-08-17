import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kaltiro.com';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: businesses } = await supabase
    .from('businesses')
    .select('slug, created_at');

  const catalogPages: MetadataRoute.Sitemap = (businesses || []).map((b) => ({
    url: `${baseUrl}/${b.slug}`,
    lastModified: new Date(b.created_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    ...catalogPages,
  ];
}
