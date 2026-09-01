'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          maxWidth: '400px',
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
            marginBottom: '1.5rem',
          }}>
            Ocurrió un error inesperado. Esto puede deberse a datos temporales.
          </p>
          <button
            onClick={() => {
              try { localStorage.clear(); } catch {}
              reset();
            }}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '0.625rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
