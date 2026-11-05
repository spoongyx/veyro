import { ImageResponse } from 'next/og';

export const alt = 'Veyro - Focus, simplified';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
          <div
            style={{
              display: 'flex',
              width: 92,
              height: 92,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 26,
              backgroundColor: '#FF8A32',
              color: '#180E04',
              fontSize: 56,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>Veyro</div>
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
