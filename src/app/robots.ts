import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/export/', '/api/'],
      },
    ],
    sitemap: 'https://oosira.com/sitemap.xml',
  };
}
