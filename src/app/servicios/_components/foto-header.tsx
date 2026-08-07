// ════════════════════════════════════════════════════════════════════════════
// FotoHeader — cabecera con foto a pantalla completa que usan todas las
// páginas de servicios. Overlay oscuro + título + subtítulo en blanco.
// ════════════════════════════════════════════════════════════════════════════

export function FotoHeader({ img, titulo, subtitulo }: { img: string; titulo: string; subtitulo: string }) {
  return (
    <div className="srv-header">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={titulo} className="srv-header-img" />
      <div className="srv-header-overlay" />
      <div className="srv-header-text">
        <a href="/" className="srv-header-back">← Inicio</a>
        <h1>{titulo}</h1>
        <p>{subtitulo}</p>
      </div>
    </div>
  );
}
