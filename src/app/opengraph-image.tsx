import { ImageResponse } from 'next/og';

// Imagen de vista previa al compartir ambitosmax.com en WhatsApp, Facebook, etc.
export const alt = 'Ambitosmax — Cilindros de gas, combustible y envíos a Cuba';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '80px', background: 'linear-gradient(135deg, #071a46 0%, #123d83 100%)', color: 'white',
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 8, color: '#7ed957' }}>AMBITOSMAX</div>
        <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, marginTop: 24 }}>Gas, combustible y envíos a Cuba</div>
        <div style={{ fontSize: 34, marginTop: 32, color: 'rgba(255,255,255,0.8)' }}>
          Cilindro de gas lleno en La Habana · $85 · sin entrega de vacío
        </div>
        <div style={{ fontSize: 28, marginTop: 40, color: '#7ed957' }}>ambitosmax.com</div>
      </div>
    ),
    size
  );
}
