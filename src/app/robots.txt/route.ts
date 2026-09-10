import { NextResponse } from 'next/server';
import { absoluteUrl } from '@/lib/site';

export function GET(): NextResponse {
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${absoluteUrl('/sitemap.xml')}`, ''].join('\n');

  return new NextResponse(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
