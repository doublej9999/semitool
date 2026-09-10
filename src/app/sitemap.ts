import type { MetadataRoute } from 'next';
export default function sitemap():MetadataRoute.Sitemap{const base='https://semitools.dev';return ['','/tools','/tools/wafer-mark-calculator','/tools/wafer-die-calculator','/tools/wafer-map-generator','/tools/yield-calculator','/about','/privacy','/contact'].map(path=>({url:base+path,lastModified:new Date()}))}
