'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Limpieza TOTAL: datos del sitio + cachés + service workers (el SW viejo
  // congelaba la app sirviendo la versión anterior aunque el servidor fuera nueva)
  const handleFullReset = async () => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {}
    window.location.reload();
  };

  return (
    <html>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#fafafa',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '420px',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}>⚠️</div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#18181b',
            marginBottom: '0.5rem',
          }}>Algo salió mal</h1>
          <p style={{
            color: '#71717a',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}>
            Se limpiará la memoria del navegador (incluida la versión congelada) y se recargará.
          </p>
          {/* Detalle técnico del error real — ayuda a diagnosticar */}
          <p style={{
            color: '#a1a1aa',
            fontSize: '0.7rem',
            marginBottom: '1.5rem',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
          }}>
            {error?.message || 'Error desconocido'}
            {error?.digest ? ` · ${error.digest}` : ''}
          </p>
          <button
            onClick={handleFullReset}
            style={{
              backgroundColor: '#123d83',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Limpiar todo y recargar
          </button>
        </div>
      </body>
    </html>
  );
}
