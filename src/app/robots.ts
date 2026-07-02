import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/feed',
          '/portal',
          '/checkout',
          '/activate',
          '/redirect',
          '/join',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://jengasuppliers.com/sitemap.xml',
    host: 'https://jengasuppliers.com',
  }
}
