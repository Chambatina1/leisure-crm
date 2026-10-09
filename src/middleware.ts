import { NextRequest, NextResponse } from 'next/server';

// La web solo debe verse en ambitosmax.com. La dirección técnica del
// alojamiento (*.onrender.com) redirige allí para que Google no la muestre
// como "Render" ni la tome por contenido duplicado.
export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (host.endsWith('.onrender.com')) {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, 'https://ambitosmax.com');
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  // No tocar archivos internos de Next ni las llamadas a la API
  matcher: ['/((?!_next/|api/).*)'],
};
