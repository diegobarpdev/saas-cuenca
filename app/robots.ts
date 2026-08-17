import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/app/', '/super-admin/'],
      },
    ],
    sitemap: 'https://kaltiro.com/sitemap.xml',
  };
}
