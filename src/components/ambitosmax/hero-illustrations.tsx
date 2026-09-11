'use client';

// ═══════════════════════════════════════════════════════════════════
// Ilustraciones SVG premium para el carrusel principal + fondo animado
// Estilo corporativo Ambitosmax: azul marino #071a46/#123d83 + verde #55b949
// ═══════════════════════════════════════════════════════════════════

// ── BALAS DE GAS (grupo de cilindros) ─────────────────────────────
export function GasCylindersSVG() {
  return (
    <svg viewBox="0 0 320 260" className="w-full h-full drop-shadow-2xl" aria-label="Balas de gas">
      <defs>
        <linearGradient id="cylBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8eefb" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c3d2ec" />
        </linearGradient>
        <linearGradient id="cylGreen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a9e30" />
          <stop offset="1" stopColor="#7ed957" />
        </linearGradient>
      </defs>
      {/* sombra */}
      <ellipse cx="160" cy="240" rx="130" ry="14" fill="#071a46" opacity="0.35" />
      {/* cilindro grande */}
      <g>
        <rect x="96" y="70" width="56" height="164" rx="26" fill="url(#cylBody)" />
        <rect x="96" y="150" width="56" height="30" fill="url(#cylGreen)" opacity="0.9" />
        <rect x="110" y="52" width="28" height="22" rx="4" fill="#9fb3d9" />
        <rect x="117" y="40" width="14" height="14" rx="3" fill="#123d83" />
        <circle cx="124" cy="34" r="7" fill="#55b949" />
        <rect x="96" y="222" width="56" height="12" rx="6" fill="#123d83" />
        <ellipse cx="124" cy="120" rx="8" ry="12" fill="#071a46" opacity="0.15" />
      </g>
      {/* cilindro mediano */}
      <g>
        <rect x="164" y="92" width="48" height="142" rx="22" fill="url(#cylBody)" />
        <rect x="164" y="162" width="48" height="26" fill="url(#cylGreen)" opacity="0.9" />
        <rect x="176" y="76" width="24" height="18" rx="4" fill="#9fb3d9" />
        <rect x="182" y="66" width="12" height="12" rx="3" fill="#123d83" />
        <circle cx="188" cy="61" r="6" fill="#55b949" />
        <rect x="164" y="222" width="48" height="12" rx="6" fill="#123d83" />
      </g>
      {/* cilindro chico */}
      <g>
        <rect x="222" y="116" width="40" height="118" rx="18" fill="url(#cylBody)" />
        <rect x="222" y="176" width="40" height="22" fill="url(#cylGreen)" opacity="0.9" />
        <rect x="232" y="102" width="20" height="16" rx="4" fill="#9fb3d9" />
        <rect x="237" y="94" width="10" height="10" rx="2.5" fill="#123d83" />
        <circle cx="242" cy="90" r="5" fill="#55b949" />
        <rect x="222" y="222" width="40" height="12" rx="6" fill="#123d83" />
      </g>
      {/* llama decorativa */}
      <g transform="translate(58,150) scale(1.6)">
        <path d="M10 0 C16 8 20 12 20 18 A10 10 0 0 1 0 18 C0 12 4 8 10 0 Z" fill="#55b949" />
        <path d="M10 8 C13 12 15 14 15 18 A5 5 0 0 1 5 18 C5 14 7 12 10 8 Z" fill="#a7e05a" />
      </g>
    </svg>
  );
}

// ── ISOTANQUE (tanque contenedor ISO) ──────────────────────────────
export function IsotankSVG() {
  return (
    <svg viewBox="0 0 320 260" className="w-full h-full drop-shadow-2xl" aria-label="Isotanque de combustible">
      <defs>
        <linearGradient id="tankBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#dbe6f7" />
          <stop offset="1" stopColor="#9fb3d9" />
        </linearGradient>
        <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1750a8" />
          <stop offset="1" stopColor="#071a46" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="240" rx="140" ry="14" fill="#071a46" opacity="0.35" />
      {/* marco ISO */}
      <rect x="18" y="60" width="284" height="168" rx="10" fill="none" stroke="url(#frame)" strokeWidth="12" />
      <rect x="14" y="56" width="26" height="26" rx="4" fill="#071a46" />
      <rect x="280" y="56" width="26" height="26" rx="4" fill="#071a46" />
      <rect x="14" y="206" width="26" height="26" rx="4" fill="#071a46" />
      <rect x="280" y="206" width="26" height="26" rx="4" fill="#071a46" />
      {/* tanque cilíndrico */}
      <rect x="42" y="92" width="236" height="106" rx="53" fill="url(#tankBody)" />
      <rect x="42" y="132" width="236" height="22" fill="#55b949" opacity="0.85" />
      {/* boca de hombre */}
      <ellipse cx="160" cy="92" rx="20" ry="8" fill="#123d83" />
      <rect x="152" y="78" width="16" height="12" rx="3" fill="#123d83" />
      {/* escalera */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="270" y={104 + i * 18} width="18" height="5" rx="2" fill="#071a46" opacity="0.7" />
      ))}
      <rect x="284" y="100" width="6" height="96" rx="3" fill="#071a46" opacity="0.7" />
      {/* brillo */}
      <rect x="60" y="104" width="120" height="10" rx="5" fill="#ffffff" opacity="0.55" />
      {/* gota decorativa */}
      <g transform="translate(44,138) scale(1.5)">
        <path d="M10 0 C16 8 20 12 20 18 A10 10 0 0 1 0 18 C0 12 4 8 10 0 Z" fill="#55b949" />
        <path d="M10 8 C13 12 15 14 15 18 A5 5 0 0 1 5 18 C5 14 7 12 10 8 Z" fill="#a7e05a" />
      </g>
    </svg>
  );
}

// ── TAMBORES DE COMBUSTIBLE ────────────────────────────────────────
export function DrumsSVG() {
  return (
    <svg viewBox="0 0 320 260" className="w-full h-full drop-shadow-2xl" aria-label="Tambores de combustible">
      <defs>
        <linearGradient id="drumBlue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0d2a5c" />
          <stop offset="0.5" stopColor="#1a4fa0" />
          <stop offset="1" stopColor="#0d2a5c" />
        </linearGradient>
        <linearGradient id="drumGreen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2e7d28" />
          <stop offset="0.5" stopColor="#55b949" />
          <stop offset="1" stopColor="#2e7d28" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="240" rx="120" ry="13" fill="#071a46" opacity="0.35" />
      {[{ x: 52, fill: 'url(#drumBlue)' }, { x: 128, fill: 'url(#drumGreen)' }, { x: 204, fill: 'url(#drumBlue)' }].map((d, i) => (
        <g key={i}>
          <rect x={d.x} y={110 - i * 8} width="66" height={122 + i * 8} rx="10" fill={d.fill} />
          <rect x={d.x} y={138 - i * 8} width="66" height="8" fill="#071a46" opacity="0.45" />
          <rect x={d.x} y={172 - i * 8} width="66" height="8" fill="#071a46" opacity="0.45" />
          <rect x={d.x} y={206 - i * 8} width="66" height="8" fill="#071a46" opacity="0.45" />
          <ellipse cx={d.x + 33} cy={112 - i * 8} rx="33" ry="9" fill="#071a46" opacity="0.5" />
          <ellipse cx={d.x + 33} cy={108 - i * 8} rx="26" ry="6" fill="#e8eefb" opacity="0.25" />
        </g>
      ))}
      {/* surtidor decorativo */}
      <g transform="translate(278,120)">
        <rect x="0" y="20" width="14" height="80" rx="5" fill="#123d83" />
        <rect x="-8" y="96" width="30" height="8" rx="4" fill="#071a46" />
        <rect x="0" y="0" width="14" height="24" rx="5" fill="#55b949" />
      </g>
    </svg>
  );
}

// ── FONDO ANIMADO: olas en movimiento + partículas ────────────────
export function AnimatedSeaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#071a46] via-[#0d2a5c] to-[#123d83]">
      {/* brillos suaves */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#2f7fd1]/20 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-[#55b949]/15 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

      {/* partículas subiendo (burbujas) */}
      {[8, 18, 27, 39, 51, 63, 72, 85, 92].map((left, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${left}%`,
            bottom: '-10px',
            width: `${5 + (i % 4) * 3}px`,
            height: `${5 + (i % 4) * 3}px`,
            animation: `rise ${9 + (i % 5) * 3}s linear ${i * 1.4}s infinite`,
          }}
        />
      ))}

      {/* olas en movimiento (3 capas a distinta velocidad) */}
      <svg className="absolute bottom-0 left-0 w-[200%] h-40 opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ animation: 'waveSlide 16s linear infinite' }}>
        <path d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 V120 H0 Z" fill="#ffffff" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-[200%] h-32 opacity-25" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ animation: 'waveSlide 11s linear infinite reverse' }}>
        <path d="M0 70 Q200 30 400 70 T800 70 T1200 70 V120 H0 Z" fill="#55b949" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-[200%] h-28 opacity-30" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ animation: 'waveSlide 8s linear infinite' }}>
        <path d="M0 80 Q300 40 600 80 T1200 80 V120 H0 Z" fill="#2f7fd1" />
      </svg>
    </div>
  );
}
