import type { MetadataRoute } from 'next';
import { tools } from '@/tools';
import { absoluteUrl } from '@/lib/site';

const STATIC_PATHS = ['/', '/tools', '/about', '/privacy', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [...STATIC_PATHS, ...tools.map((tool) => tool.path)].map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/tools') ? 0.8 : 0.4,
  }));
}
