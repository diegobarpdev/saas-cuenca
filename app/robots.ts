import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/super-admin/', '/demo/'],
      },
    ],
    sitemap: 'https://kaltiro.com/sitemap.xml',
  };
}
