// ============================================================
// Contabilidad de las balitas de gas por punto de venta
// ------------------------------------------------------------
// Todo sale de la tabla "ReservaCilindro" (compras RC-) y de los
// puntos de recogida (Config puntos_recogida). No guarda nada aparte:
// cada vez que se abre el panel se recalcula desde la base de datos.
// - Venta = compra pagada o entregada. Su fecha es la del pago (hora de Cuba).
// - Pendiente de cobro = compra sin pagar de las últimas 24 h.
// - Por entregar = pagada y aún no recogida (dinero cobrado, balita debida).
// - Costo por balita: opcional, lo escribe el administrador (Config costo_balita_usd).
// ============================================================
import { db } from '@/lib/db';
import { asegurarTablaReservas, ZONA_CUBA, ahoraEnCuba } from '@/lib/cilindros';
import { HORAS_APARTADO } from '@/lib/existencia';
import { leerPuntos, leerPuntosDisponibles } from '@/lib/puntos-recogida';
import { textoPunto } from '@/lib/puntos-gas';

export const CLAVE_COSTO = 'costo_balita_usd';
const SIN_PUNTO = 'sin-punto';

// Fecha (día de Cuba) en que cuenta una venta
const DIA_VENTA = `(COALESCE("pagadaEn","createdAt") AT TIME ZONE 'UTC' AT TIME ZONE '${ZONA_CUBA}')::date`;
const PAGADAS = `"estado" IN ('pagada','entregada')`;
const PUNTO = `COALESCE("puntoId", '${SIN_PUNTO}')`;

export interface Cifras {
  compras: number;
  balitas: number;
  usd: number;
}

export interface FilaSerie extends Cifras {
  periodo: string; // YYYY-MM-DD (día, lunes de la semana o 1.º del mes)
}

export interface Comprador {
  nombre: string;
  telefono: string;
  email: string | null;
  compras: number;
  balitas: number;
  usd: number;
  primera: string;
  ultima: string;
}

export interface BalancePunto {
  id: string;
  nombre: string;
  activo: boolean;
  existencia: number | null; // balitas que hay en el punto (sin las apartadas)
  disponibles: number | null; // a la venta ahora (existencia - apartadas 1 h)
  apartadas: number;
  hoy: Cifras;
  semana: Cifras;
  mes: Cifras;
  total: Cifras;
  porEntregar: Cifras; // pagadas, sin recoger
  entregadas: Cifras;
  pendientes: Cifras; // sin pagar, últimas 24 h
  anuladas: number;
  compradores: number;
}

const cero = (): Cifras => ({ compras: 0, balitas: 0, usd: 0 });
const num = (v: unknown) => Number(v) || 0;
const redondear = (n: number) => Math.round(n * 100) / 100;
const cifras = (f?: { compras?: unknown; balitas?: unknown; usd?: unknown }): Cifras =>
  f ? { compras: num(f.compras), balitas: num(f.balitas), usd: redondear(num(f.usd)) } : cero();

export async function leerCostoBalita(): Promise<number | null> {
  const fila = await db.config.findUnique({ where: { clave: CLAVE_COSTO } });
  const n = fila?.valor ? Number(fila.valor) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function guardarCostoBalita(costo: number | null) {
  const valor = costo === null ? '' : String(costo);
  await db.config.upsert({ where: { clave: CLAVE_COSTO }, update: { valor }, create: { clave: CLAVE_COSTO, valor } });
}

/** Lunes de la semana y día 1 del mes de hoy (Cuba). */
function inicios(hoy: string) {
  const d = new Date(`${hoy}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunes
  const lunes = new Date(d);
  lunes.setUTCDate(d.getUTCDate() - dow);
  return { hoy, lunes: lunes.toISOString().slice(0, 10), mes: hoy.slice(0, 8) + '01' };
}

/**
 * Balance completo. `punto` = id de un punto, o vacío para todos.
 */
export async function balanceBalitas(punto = '') {
  await asegurarTablaReservas();
  const { dia } = ahoraEnCuba();
  const { hoy, lunes, mes } = inicios(dia);
  const filtro = punto ? ` AND ${PUNTO} = $1` : '';
  const p = punto ? [punto] : [];

  const q = <T>(sql: string, ...extra: unknown[]) => db.$queryRawUnsafe<T[]>(sql, ...p, ...extra);
  const n = p.length; // posición de los parámetros extra

  const [porPunto, diaria, semanal, mensual, compradores, puntos, disponibles, costo] = await Promise.all([
    // Indicadores por punto, en una sola consulta
    q<Record<string, unknown>>(
      `SELECT ${PUNTO} AS punto,
        COUNT(*) FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} = $${n + 1}::date) AS hoy_c,
        COALESCE(SUM("cantidad") FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} = $${n + 1}::date),0) AS hoy_b,
        COALESCE(SUM("montoUsd") FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} = $${n + 1}::date),0) AS hoy_u,
        COUNT(*) FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} >= $${n + 2}::date) AS sem_c,
        COALESCE(SUM("cantidad") FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} >= $${n + 2}::date),0) AS sem_b,
        COALESCE(SUM("montoUsd") FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} >= $${n + 2}::date),0) AS sem_u,
        COUNT(*) FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} >= $${n + 3}::date) AS mes_c,
        COALESCE(SUM("cantidad") FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} >= $${n + 3}::date),0) AS mes_b,
        COALESCE(SUM("montoUsd") FILTER (WHERE ${PAGADAS} AND ${DIA_VENTA} >= $${n + 3}::date),0) AS mes_u,
        COUNT(*) FILTER (WHERE ${PAGADAS}) AS tot_c,
        COALESCE(SUM("cantidad") FILTER (WHERE ${PAGADAS}),0) AS tot_b,
        COALESCE(SUM("montoUsd") FILTER (WHERE ${PAGADAS}),0) AS tot_u,
        COUNT(*) FILTER (WHERE "estado"='pagada') AS pe_c,
        COALESCE(SUM("cantidad") FILTER (WHERE "estado"='pagada'),0) AS pe_b,
        COALESCE(SUM("montoUsd") FILTER (WHERE "estado"='pagada'),0) AS pe_u,
        COUNT(*) FILTER (WHERE "estado"='entregada') AS en_c,
        COALESCE(SUM("cantidad") FILTER (WHERE "estado"='entregada'),0) AS en_b,
        COALESCE(SUM("montoUsd") FILTER (WHERE "estado"='entregada'),0) AS en_u,
        COUNT(*) FILTER (WHERE "estado"='pendiente_pago' AND "createdAt" > NOW() - INTERVAL '24 hours') AS pp_c,
        COALESCE(SUM("cantidad") FILTER (WHERE "estado"='pendiente_pago' AND "createdAt" > NOW() - INTERVAL '24 hours'),0) AS pp_b,
        COALESCE(SUM("montoUsd") FILTER (WHERE "estado"='pendiente_pago' AND "createdAt" > NOW() - INTERVAL '24 hours'),0) AS pp_u,
        COALESCE(SUM("cantidad") FILTER (WHERE "estado"='pendiente_pago' AND "createdAt" > NOW() - INTERVAL '${HORAS_APARTADO} hours'),0) AS apartadas,
        COUNT(*) FILTER (WHERE "estado"='anulada') AS anuladas,
        COUNT(DISTINCT regexp_replace("telefonoComprador", '\\D', '', 'g')) FILTER (WHERE ${PAGADAS}) AS compradores
       FROM "ReservaCilindro" WHERE TRUE${filtro} GROUP BY 1`,
      hoy,
      lunes,
      mes
    ),
    // Ventas por día: últimos 31 días
    q<Record<string, unknown>>(
      `SELECT to_char(${DIA_VENTA}, 'YYYY-MM-DD') AS periodo, COUNT(*) AS compras, SUM("cantidad") AS balitas, SUM("montoUsd") AS usd
       FROM "ReservaCilindro" WHERE ${PAGADAS}${filtro} AND ${DIA_VENTA} > $${n + 1}::date - 31
       GROUP BY 1 ORDER BY 1`,
      hoy
    ),
    // Por semana (lunes): últimas 12
    q<Record<string, unknown>>(
      `SELECT to_char(date_trunc('week', ${DIA_VENTA}), 'YYYY-MM-DD') AS periodo, COUNT(*) AS compras, SUM("cantidad") AS balitas, SUM("montoUsd") AS usd
       FROM "ReservaCilindro" WHERE ${PAGADAS}${filtro} AND ${DIA_VENTA} >= $${n + 1}::date - 77
       GROUP BY 1 ORDER BY 1`,
      lunes
    ),
    // Por mes: últimos 12
    q<Record<string, unknown>>(
      `SELECT to_char(date_trunc('month', ${DIA_VENTA}), 'YYYY-MM-DD') AS periodo, COUNT(*) AS compras, SUM("cantidad") AS balitas, SUM("montoUsd") AS usd
       FROM "ReservaCilindro" WHERE ${PAGADAS}${filtro} AND ${DIA_VENTA} >= ($${n + 1}::date - INTERVAL '11 months')::date
       GROUP BY 1 ORDER BY 1`,
      mes
    ),
    // Compradores (agrupados por teléfono)
    q<Record<string, unknown>>(
      `SELECT (array_agg("nombreComprador" ORDER BY "id" DESC))[1] AS nombre,
              (array_agg("telefonoComprador" ORDER BY "id" DESC))[1] AS telefono,
              (array_agg("emailComprador" ORDER BY "id" DESC) FILTER (WHERE "emailComprador" IS NOT NULL))[1] AS email,
              COUNT(*) AS compras, SUM("cantidad") AS balitas, SUM("montoUsd") AS usd,
              to_char(MIN(${DIA_VENTA}), 'YYYY-MM-DD') AS primera, to_char(MAX(${DIA_VENTA}), 'YYYY-MM-DD') AS ultima
       FROM "ReservaCilindro" WHERE ${PAGADAS}${filtro}
       GROUP BY regexp_replace("telefonoComprador", '\\D', '', 'g')
       ORDER BY SUM("montoUsd") DESC, MAX("id") DESC LIMIT 500`
    ),
    leerPuntos(),
    leerPuntosDisponibles(),
    leerCostoBalita(),
  ]);

  const mapa = new Map(porPunto.map((f) => [String(f.punto), f]));
  const pref = (f: Record<string, unknown> | undefined, k: string) =>
    f ? { compras: f[`${k}_c`], balitas: f[`${k}_b`], usd: f[`${k}_u`] } : undefined;

  const filaPunto = (id: string, nombre: string, activo: boolean, existencia: number | null, disp: number | null): BalancePunto => {
    const f = mapa.get(id);
    return {
      id,
      nombre,
      activo,
      existencia,
      disponibles: disp,
      apartadas: num(f?.apartadas),
      hoy: cifras(pref(f, 'hoy')),
      semana: cifras(pref(f, 'sem')),
      mes: cifras(pref(f, 'mes')),
      total: cifras(pref(f, 'tot')),
      porEntregar: cifras(pref(f, 'pe')),
      entregadas: cifras(pref(f, 'en')),
      pendientes: cifras(pref(f, 'pp')),
      anuladas: num(f?.anuladas),
      compradores: num(f?.compradores),
    };
  };

  const filas: BalancePunto[] = puntos
    .filter((pt) => !punto || pt.id === punto)
    .map((pt) => {
      const d = disponibles.find((x) => x.id === pt.id);
      const ex = typeof pt.existencia === 'number' ? pt.existencia : null;
      return filaPunto(pt.id, textoPunto(pt), pt.activo, ex, typeof d?.existencia === 'number' ? d.existencia : null);
    });
  // Compras antiguas sin punto elegido (o de un punto borrado)
  const conocidos = new Set(puntos.map((pt) => pt.id));
  for (const id of mapa.keys()) {
    if (!conocidos.has(id) && (!punto || punto === id)) {
      filas.push(filaPunto(id, id === SIN_PUNTO ? 'Sin punto elegido (compras antiguas)' : `Punto ${id} (ya no existe)`, false, null, null));
    }
  }

  // Totales de todos los puntos mostrados
  const suma = (k: 'hoy' | 'semana' | 'mes' | 'total' | 'porEntregar' | 'entregadas' | 'pendientes'): Cifras =>
    filas.reduce(
      (s, f) => ({ compras: s.compras + f[k].compras, balitas: s.balitas + f[k].balitas, usd: redondear(s.usd + f[k].usd) }),
      cero()
    );
  const conControl = filas.filter((f) => f.activo);
  const existenciaTotal = conControl.length && conControl.every((f) => f.existencia !== null)
    ? conControl.reduce((s, f) => s + (f.existencia as number), 0)
    : null;

  const total = suma('total');
  const listaCompradores: Comprador[] = compradores.map((c) => ({
    nombre: String(c.nombre || ''),
    telefono: String(c.telefono || ''),
    email: c.email ? String(c.email) : null,
    compras: num(c.compras),
    balitas: num(c.balitas),
    usd: redondear(num(c.usd)),
    primera: String(c.primera || ''),
    ultima: String(c.ultima || ''),
  }));
  const repiten = listaCompradores.filter((c) => c.compras > 1).length;

  const serie = (lista: Record<string, unknown>[]): FilaSerie[] =>
    lista.map((f) => ({ periodo: String(f.periodo), ...cifras(f) }));

  const totales = {
    hoy: suma('hoy'),
    semana: suma('semana'),
    mes: suma('mes'),
    total,
    porEntregar: suma('porEntregar'),
    entregadas: suma('entregadas'),
    pendientes: suma('pendientes'),
    existencia: existenciaTotal,
    compradores: listaCompradores.length,
    compradoresQueRepiten: repiten,
    ticketPromedio: total.compras ? redondear(total.usd / total.compras) : 0,
    balitasPorCompra: total.compras ? Math.round((total.balitas / total.compras) * 100) / 100 : 0,
    precioPromedio: total.balitas ? redondear(total.usd / total.balitas) : 0,
  };

  // Ganancia: solo si el administrador escribió el costo por balita
  const ganancia = costo === null
    ? null
    : {
        costoBalita: costo,
        costoVendido: redondear(costo * total.balitas),
        gananciaBruta: redondear(total.usd - costo * total.balitas),
        gananciaMes: redondear(totales.mes.usd - costo * totales.mes.balitas),
        valorInventario: existenciaTotal === null ? null : redondear(costo * existenciaTotal),
      };

  return {
    generado: new Date().toISOString(),
    hoy,
    inicioSemana: lunes,
    inicioMes: mes,
    punto: punto || null,
    puntos: filas,
    totales,
    ganancia,
    series: { diaria: serie(diaria), semanal: serie(semanal), mensual: serie(mensual) },
    compradores: listaCompradores,
  };
}

export type BalanceBalitas = Awaited<ReturnType<typeof balanceBalitas>>;
