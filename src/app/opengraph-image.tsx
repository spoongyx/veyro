import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { APP_VERSION } from '@/lib/version';

export const alt = 'Ascned - Focus, simplified';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const logoData = readFileSync(join(process.cwd(), 'public', 'icon-192.png')).toString('base64');
const logoSrc = `data:image/png;base64,${logoData}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #121212 0%, #171717 55%, #2A1A0E 100%)',
          color: '#F5F3EF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt=""
            width={92}
            height={92}
            style={{ width: 92, height: 92, borderRadius: 26 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>Ascned</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid rgba(245, 243, 239, 0.18)',
                borderRadius: 999,
                padding: '7px 14px 9px',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1,
                color: '#A09C95',
              }}
            >
              {APP_VERSION}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 46, fontWeight: 700, letterSpacing: -1 }}>
          Focus, simplified.
        </div>
        <div style={{ display: 'flex', marginTop: 18, fontSize: 26, color: '#A09C95' }}>
          Tasks, habits, goals and deep work in one calm workspace.
        </div>
      </div>
    ),
    size
  );
}
