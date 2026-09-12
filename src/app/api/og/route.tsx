import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { SITE_NAME } from '@/lib/site';

export const dynamic = 'force-static';

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') ?? 'Semiconductor Engineering Tools').slice(0, 110);
  const category = searchParams.get('category');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0b1f3a 0%, #123a63 55%, #1b5e8f 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 700,
              color: '#0b1f3a',
            }}
          >
            S
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 1 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1040 }}>{title}</div>
          {category ? (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '10px 26px',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.45)',
                fontSize: 28,
                color: '#bae6fd',
              }}
            >
              {category}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.75)' }}>
          Semiconductor engineering tools · runs entirely in your browser
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
