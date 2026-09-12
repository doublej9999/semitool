import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SemiTools — Semiconductor Engineering Calculators',
    short_name: 'SemiTools',
    description: 'Browser-based semiconductor engineering calculators with explicit units and formulas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f6f5',
    theme_color: '#0d7c82',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
