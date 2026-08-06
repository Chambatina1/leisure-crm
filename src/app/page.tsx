// La raíz "/" la gestiona el middleware: sin sesión → /login, con sesión → /app.
// Este componente es un fallback de carga.
export default function RootPage() {
  return null;
}
