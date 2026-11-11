// Periodos, destinatarios y correo del informe de utilidad (QuickBooks).
import { db } from '@/lib/db';
import { estadoResultados, type PyG } from '@/lib/quickbooks';

export const ZONA_NEGOCIO = 'America/New_York';
export const CLAVE_EMAIL_INFORME = 'email_informe_utilidad';

/** Fecha YYYY-MM-DD en la zona del negocio (Tampa). */
export function hoyNegocio(fecha = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_NEGOCIO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}

function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type Periodo = 'semana' | 'mes' | 'anio';

/** Semana de lunes a hoy, mes en curso o año en curso. */
export function rango(periodo: Periodo, hoy = hoyNegocio()): { desde: string; hasta: string } {
  if (periodo === 'mes') return { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy };
  if (periodo === 'anio') return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy };
  const diaSemana = new Date(`${hoy}T12:00:00Z`).getUTCDay(); // 0 = domingo
  return { desde: sumarDias(hoy, -((diaSemana + 6) % 7)), hasta: hoy };
}

export async function destinatariosInforme(): Promise<string[]> {
  const cfg = await db.config.findMany({ where: { clave: { in: [CLAVE_EMAIL_INFORME, 'email_reportes', 'email'] } } });
  const lista =
    process.env.INFORME_UTILIDAD_EMAIL ||
    cfg.find((c) => c.clave === CLAVE_EMAIL_INFORME)?.valor ||
    cfg.find((c) => c.clave === 'email_reportes')?.valor ||
    cfg.find((c) => c.clave === 'email')?.valor ||
    '';
  return lista
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

const usd = (n: number) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function fechaCorta(dia: string) {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

const margen = (p: PyG) => (p.ingresos > 0 ? `${((p.utilidad / p.ingresos) * 100).toFixed(1)}%` : '—');

function bloque(titulo: string, p: PyG) {
  const color = p.utilidad >= 0 ? '#15803d' : '#b91c1c';
  return `<td style="padding:14px;border:1px solid #e5e7eb;border-radius:10px;vertical-align:top;width:33%">
    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">${titulo}</div>
    <div style="font-size:12px;color:#9ca3af">${fechaCorta(p.desde)} – ${fechaCorta(p.hasta)}</div>
    <div style="margin-top:8px;font-size:13px">Ingresos <b style="float:right">${usd(p.ingresos)}</b></div>
    <div style="font-size:13px">Gastos <b style="float:right">${usd(p.gastos + p.costoVentas)}</b></div>
    <div style="margin-top:6px;font-size:18px;font-weight:800;color:${color}">Utilidad <span style="float:right">${usd(p.utilidad)}</span></div>
    <div style="font-size:12px;color:#6b7280">Margen ${margen(p)}</div>
  </td>`;
}

/** Arma el correo con la utilidad de la semana, el mes y el año. */
export async function informeSemanal(hoy = hoyNegocio()) {
  const [semana, mes, anio] = await Promise.all(
    (['semana', 'mes', 'anio'] as Periodo[]).map((p) => {
      const r = rango(p, hoy);
      return estadoResultados(r.desde, r.hasta);
    })
  );
  const gastosTop = [...semana.detalleGastos].sort((a, b) => b.monto - a.monto).slice(0, 8);
  const filasGastos = gastosTop.length
    ? gastosTop
        .map((g) => `<tr><td style="padding:4px 0">${esc(g.nombre)}</td><td style="text-align:right">${usd(g.monto)}</td></tr>`)
        .join('')
    : '<tr><td style="color:#6b7280">Sin gastos registrados esta semana</td></tr>';

  const asunto = `Utilidad de la semana: ${usd(semana.utilidad)} · Ambitosmax`;
  const texto = [
    `Utilidad de la semana (${semana.desde} a ${semana.hasta}): ${usd(semana.utilidad)} — ingresos ${usd(semana.ingresos)}, gastos ${usd(semana.gastos + semana.costoVentas)}.`,
    `Mes en curso: utilidad ${usd(mes.utilidad)} (ingresos ${usd(mes.ingresos)}, gastos ${usd(mes.gastos + mes.costoVentas)}).`,
    `Año en curso: utilidad ${usd(anio.utilidad)} (ingresos ${usd(anio.ingresos)}, gastos ${usd(anio.gastos + anio.costoVentas)}).`,
    'Datos de QuickBooks.',
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827">
    <h2 style="color:#071a46;margin-bottom:4px">¿Cómo va la utilidad?</h2>
    <p style="color:#6b7280;margin-top:0">Informe de los viernes · datos de QuickBooks</p>
    <table cellspacing="8" style="width:100%;border-collapse:separate"><tr>
      ${bloque('Esta semana', semana)}${bloque('Este mes', mes)}${bloque('Este año', anio)}
    </tr></table>
    <h3 style="color:#071a46;font-size:15px;margin-bottom:4px">Gastos de la semana</h3>
    <table style="width:100%;font-size:13px">${filasGastos}</table>
    <p style="color:#9ca3af;font-size:12px;margin-top:18px">Detalle completo en el panel de administración → Contabilidad.</p>
  </div>`;
  return { asunto, texto, html, semana, mes, anio };
}
