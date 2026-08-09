// Logo SVG del Grupo Empresarial — fondo transparente, color terracota.
export default function Logo({ height = 40 }: { height?: number }) {
  return (
    <svg viewBox="0 0 380 120" role="img" aria-label="Grupo Empresarial" height={height}>
      <g fill="#C23B22">
        <g>
          <path d="M44 20 q5 -6 0 -12 q-5 -6 0 -10" fill="none" stroke="#C23B22" strokeWidth="3" strokeLinecap="round" />
          <path d="M64 20 q5 -6 0 -12 q-5 -6 0 -10" fill="none" stroke="#C23B22" strokeWidth="3" strokeLinecap="round" />
          <rect x="40" y="26" width="9" height="20" rx="1.5" />
          <rect x="60" y="26" width="9" height="20" rx="1.5" />
          <rect x="34" y="46" width="58" height="20" rx="2" />
          <rect x="36" y="50" width="13" height="12" />
          <rect x="51" y="50" width="13" height="12" />
          <rect x="66" y="50" width="13" height="12" />
          <rect x="81" y="50" width="9" height="12" />
          <path d="M20 70 H106 L96 94 a6 6 0 0 1 -6 4 H36 a6 6 0 0 1 -6 -4 Z" />
          <path d="M8 100 H118" fill="none" stroke="#C23B22" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 6" />
        </g>
        <g fontFamily="Arial, Helvetica, sans-serif" fontWeight="900">
          <text x="140" y="46" fontSize="34">LEISURE</text>
          <text x="140" y="74" fontSize="22" letterSpacing="1.2">EXPORTING</text>
          <text x="140" y="98" fontSize="17" letterSpacing="2.5">L L C</text>
        </g>
      </g>
    </svg>
  );
}
