// ═══════════════════════════════════════════════════════════════
// QuickBooks Online: facturas con pago en línea, confirmación de
// pagos y contabilidad (ingresos, gastos y utilidad).
//
// Variables de entorno (Render):
//   QBO_CLIENT_ID, QBO_CLIENT_SECRET  → app de developer.intuit.com
//   QBO_ENV            → 'production' (por defecto) o 'sandbox'
//   QBO_REDIRECT_URI   → por defecto https://ambitosmax.com/api/quickbooks/callback
//   QBO_WEBHOOK_TOKEN  → "Verifier token" de los webhooks de Intuit
// La empresa (realmId) y el refresh token se guardan en la tabla
// Config al pulsar "Conectar QuickBooks" en el panel.
// ═══════════════════════════════════════════════════════════════
import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';

const MINOR = 'minorversion=75';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const SCOPES = 'com.intuit.quickbooks.accounting com.intuit.quickbooks.payment';

const CLAVE_REFRESH = 'QBO_REFRESH_TOKEN';
const CLAVE_REALM = 'QBO_REALM_ID';

const apiBase = () =>
  process.env.QBO_ENV === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

export const redirectUri = () =>
  process.env.QBO_REDIRECT_URI || 'https://ambitosmax.com/api/quickbooks/callback';

/** La app de Intuit está configurada (credenciales en Render). */
export const qboAppConfigurada = () => Boolean(process.env.QBO_CLIENT_ID && process.env.QBO_CLIENT_SECRET);

async function leerConfig(clave: string): Promise<string> {
  const fila = await db.config.findUnique({ where: { clave } }).catch(() => null);
  return fila?.valor || '';
}

async function guardarConfig(clave: string, valor: string) {
  await db.config.upsert({ where: { clave }, update: { valor }, create: { clave, valor } });
}

/** QuickBooks conectado: app configurada y empresa autorizada. */
export async function qboConectado(): Promise<boolean> {
  if (!qboAppConfigurada()) return false;
  const [refresh, realm] = await Promise.all([leerConfig(CLAVE_REFRESH), leerConfig(CLAVE_REALM)]);
  return Boolean(refresh && realm);
}

// ─── OAuth ───────────────────────────────────────────────────────

const secretoEstado = () => process.env.SESSION_SECRET || process.env.JWT_SECRET || '';

/** URL de autorización de Intuit, con un "state" firmado que caduca en 10 min. */
export function urlAutorizacion(): string {
  const exp = String(Date.now() + 10 * 60 * 1000);
  const firma = createHmac('sha256', secretoEstado()).update(`qbo.${exp}`).digest('base64url');
  const q = new URLSearchParams({
    client_id: process.env.QBO_CLIENT_ID || '',
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: redirectUri(),
    state: `${exp}.${firma}`,
  });
  return `${AUTH_URL}?${q}`;
}

export function estadoValido(state: string): boolean {
  const [exp, firma] = state.split('.');
  if (!exp || !firma || !/^\d+$/.test(exp) || Number(exp) < Date.now() || !secretoEstado()) return false;
  const esperado = createHmac('sha256', secretoEstado()).update(`qbo.${exp}`).digest('base64url');
  const a = Buffer.from(firma);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function pedirToken(cuerpo: Record<string, string>) {
  const basic = Buffer.from(`${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(cuerpo),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    throw new Error(`QBO_TOKEN: ${j.error || r.status} ${j.error_description || ''}`.trim());
  }
  return j as { access_token: string; refresh_token: string; expires_in: number };
}

let cache: { token: string; hasta: number } | null = null;

/** Intercambia el código de autorización y guarda la conexión. */
export async function completarConexion(code: string, realmId: string) {
  const t = await pedirToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() });
  await guardarConfig(CLAVE_REFRESH, t.refresh_token);
  await guardarConfig(CLAVE_REALM, realmId);
  cache = { token: t.access_token, hasta: Date.now() + (t.expires_in - 120) * 1000 };
}

async function accessToken(): Promise<string> {
  if (cache && cache.hasta > Date.now()) return cache.token;
  const refresh = await leerConfig(CLAVE_REFRESH);
  if (!refresh) throw new Error('QBO_NO_CONECTADO');
  const t = await pedirToken({ grant_type: 'refresh_token', refresh_token: refresh });
  // Intuit rota el refresh token: hay que guardar siempre el nuevo
  if (t.refresh_token && t.refresh_token !== refresh) await guardarConfig(CLAVE_REFRESH, t.refresh_token);
  cache = { token: t.access_token, hasta: Date.now() + (t.expires_in - 120) * 1000 };
  return cache.token;
}

async function qbo<T = Record<string, unknown>>(ruta: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const realm = await leerConfig(CLAVE_REALM);
  if (!realm) throw new Error('QBO_NO_CONECTADO');
  const sep = ruta.includes('?') ? '&' : '?';
  const r = await fetch(`${apiBase()}/v3/company/${realm}/${ruta}${sep}${MINOR}`, {
    method: init?.method || 'GET',
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      Accept: 'application/json',
      ...(init?.body
        ? { 'Content-Type': 'application/json' }
        : init?.method === 'POST'
        ? { 'Content-Type': 'application/octet-stream' }
        : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const det = j?.Fault?.Error?.[0];
    throw new Error(`QBO ${r.status}: ${det?.Message || ''} ${det?.Detail || ''}`.trim());
  }
  return j as T;
}

const comillas = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function consultar<T>(sql: string, entidad: string): Promise<T[]> {
  const j = await qbo<{ QueryResponse: Record<string, T[]> }>(`query?query=${encodeURIComponent(sql)}`);
  return j.QueryResponse?.[entidad] || [];
}

// ─── Cuentas, clientes y productos ───────────────────────────────

export interface Cuenta { Id: string; Name: string; AccountType: string; FullyQualifiedName?: string }

export async function cuentas(tipos: string[]): Promise<Cuenta[]> {
  const lista = tipos.map((t) => `'${comillas(t)}'`).join(',');
  return consultar<Cuenta>(
    `SELECT Id, Name, AccountType, FullyQualifiedName FROM Account WHERE Active = true AND AccountType IN (${lista}) MAXRESULTS 200`,
    'Account'
  );
}

async function clientePara(nombre: string, email: string): Promise<string> {
  const display = `${nombre} (${email})`.slice(0, 100);
  const hay = await consultar<{ Id: string }>(
    `SELECT Id FROM Customer WHERE DisplayName = '${comillas(display)}'`,
    'Customer'
  );
  if (hay[0]) return hay[0].Id;
  const j = await qbo<{ Customer: { Id: string } }>('customer', {
    method: 'POST',
    body: { DisplayName: display, GivenName: nombre.slice(0, 100), PrimaryEmailAddr: { Address: email } },
  });
  return j.Customer.Id;
}

const itemsCache = new Map<string, string>();

async function itemPara(nombre: string): Promise<string> {
  const guardado = itemsCache.get(nombre);
  if (guardado) return guardado;
  const hay = await consultar<{ Id: string }>(`SELECT Id FROM Item WHERE Name = '${comillas(nombre)}'`, 'Item');
  let id = hay[0]?.Id;
  if (!id) {
    const ingresos = await cuentas(['Income']);
    if (!ingresos[0]) throw new Error('QBO: no hay ninguna cuenta de ingresos');
    const j = await qbo<{ Item: { Id: string } }>('item', {
      method: 'POST',
      body: { Name: nombre, Type: 'Service', IncomeAccountRef: { value: ingresos[0].Id } },
    });
    id = j.Item.Id;
  }
  itemsCache.set(nombre, id);
  return id;
}

// ─── Facturas con pago en línea ──────────────────────────────────

export type Producto = 'Balita de gas' | 'Combustible';

export interface FacturaCreada { invoiceId: string; pagoUrl: string | null }

/**
 * Crea la factura en QuickBooks con pago en línea (tarjeta y banco)
 * y devuelve el enlace de pago que se le muestra al cliente.
 */
export async function crearFactura(d: {
  numero: string;
  nombre: string;
  email: string;
  producto: Producto;
  descripcion: string;
  monto: number;
}): Promise<FacturaCreada> {
  const [clienteId, itemId] = await Promise.all([clientePara(d.nombre, d.email), itemPara(d.producto)]);
  const monto = Math.round(d.monto * 100) / 100;
  const j = await qbo<{ Invoice: { Id: string } }>('invoice', {
    method: 'POST',
    body: {
      DocNumber: d.numero,
      CustomerRef: { value: clienteId },
      BillEmail: { Address: d.email },
      AllowOnlineCreditCardPayment: true,
      AllowOnlineACHPayment: true,
      CustomerMemo: { value: `Reserva ${d.numero} · Ambitosmax` },
      Line: [
        {
          Amount: monto,
          Description: d.descripcion.slice(0, 4000),
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: { ItemRef: { value: itemId }, Qty: 1, UnitPrice: monto },
        },
      ],
    },
  });
  // QuickBooks le manda también la factura por correo con el botón de pago
  await qbo(`invoice/${j.Invoice.Id}/send`, { method: 'POST' }).catch((e) =>
    console.error('[qbo] No se pudo enviar la factura por correo:', e instanceof Error ? e.message : e)
  );
  return { invoiceId: j.Invoice.Id, pagoUrl: await enlacePago(j.Invoice.Id) };
}

/** Enlace de pago de la factura (requiere pagos en línea activos en QuickBooks). */
export async function enlacePago(invoiceId: string): Promise<string | null> {
  const j = await qbo<{ Invoice: { InvoiceLink?: string } }>(`invoice/${invoiceId}?include=invoiceLink`);
  return j.Invoice?.InvoiceLink || null;
}

/** true solo si QuickBooks registra la factura como pagada por completo. */
export async function facturaPagada(invoiceId: string): Promise<boolean> {
  const j = await qbo<{ Invoice: { Balance: number; TotalAmt: number } }>(`invoice/${invoiceId}`);
  return j.Invoice.TotalAmt > 0 && j.Invoice.Balance <= 0;
}

// ─── Webhooks ────────────────────────────────────────────────────

/** Verifica la firma "intuit-signature" (HMAC-SHA256 en base64 del cuerpo). */
export function firmaWebhookValida(cuerpo: string, firma: string | null): boolean {
  const token = process.env.QBO_WEBHOOK_TOKEN;
  if (!token || !firma) return false;
  const esperado = createHmac('sha256', token).update(cuerpo).digest('base64');
  const a = Buffer.from(firma);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ─── Contabilidad ────────────────────────────────────────────────

export interface LineaPyG { nombre: string; monto: number }
export interface PyG {
  desde: string;
  hasta: string;
  ingresos: number;
  costoVentas: number;
  gastos: number;
  utilidad: number;
  detalleIngresos: LineaPyG[];
  detalleGastos: LineaPyG[];
}

interface FilaReporte {
  type?: string;
  group?: string;
  ColData?: { value: string }[];
  Header?: { ColData?: { value: string }[] };
  Rows?: { Row?: FilaReporte[] };
  Summary?: { ColData?: { value: string }[] };
}

const num = (v?: string) => {
  const n = parseFloat(v || '0');
  return Number.isFinite(n) ? n : 0;
};

function lineasDe(fila?: FilaReporte): LineaPyG[] {
  const out: LineaPyG[] = [];
  for (const f of fila?.Rows?.Row || []) {
    if (f.ColData) out.push({ nombre: f.ColData[0]?.value || '', monto: num(f.ColData[1]?.value) });
    else if (f.Summary) out.push({ nombre: f.Header?.ColData?.[0]?.value || '', monto: num(f.Summary.ColData?.[1]?.value) });
  }
  return out.filter((l) => l.monto !== 0);
}

/** Estado de resultados (base contable "Accrual") de QuickBooks. */
export async function estadoResultados(desde: string, hasta: string): Promise<PyG> {
  const j = await qbo<{ Rows?: { Row?: FilaReporte[] } }>(
    `reports/ProfitAndLoss?start_date=${desde}&end_date=${hasta}&accounting_method=Accrual`
  );
  const filas = j.Rows?.Row || [];
  const grupo = (g: string) => filas.find((f) => f.group === g);
  const total = (g: string) => num(grupo(g)?.Summary?.ColData?.[1]?.value);
  const otrosGastos = total('OtherExpenses');
  const otrosIngresos = total('OtherIncome');
  return {
    desde,
    hasta,
    ingresos: total('Income') + otrosIngresos,
    costoVentas: total('COGS'),
    gastos: total('Expenses') + otrosGastos,
    utilidad: total('NetIncome'),
    detalleIngresos: [...lineasDe(grupo('Income')), ...lineasDe(grupo('OtherIncome'))],
    detalleGastos: [...lineasDe(grupo('COGS')), ...lineasDe(grupo('Expenses')), ...lineasDe(grupo('OtherExpenses'))],
  };
}

export interface GastoQbo { id: string; fecha: string; monto: number; cuenta: string; nota: string }

export async function gastosRecientes(desde: string, hasta: string): Promise<GastoQbo[]> {
  const compras = await consultar<{
    Id: string;
    TxnDate: string;
    TotalAmt: number;
    PrivateNote?: string;
    Line?: { Description?: string; AccountBasedExpenseLineDetail?: { AccountRef?: { name?: string } } }[];
  }>(
    `SELECT * FROM Purchase WHERE TxnDate >= '${desde}' AND TxnDate <= '${hasta}' ORDERBY TxnDate DESC MAXRESULTS 50`,
    'Purchase'
  );
  return compras.map((c) => ({
    id: c.Id,
    fecha: c.TxnDate,
    monto: c.TotalAmt,
    cuenta: c.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || '',
    nota: c.PrivateNote || c.Line?.[0]?.Description || '',
  }));
}

/** Registra un gasto en QuickBooks, pagado desde la cuenta de banco elegida. */
export async function registrarGasto(d: {
  fecha: string;
  monto: number;
  cuentaGastoId: string;
  cuentaPagoId: string;
  descripcion: string;
}): Promise<string> {
  const j = await qbo<{ Purchase: { Id: string } }>('purchase', {
    method: 'POST',
    body: {
      PaymentType: 'Cash',
      TxnDate: d.fecha,
      AccountRef: { value: d.cuentaPagoId },
      PrivateNote: d.descripcion.slice(0, 4000),
      Line: [
        {
          Amount: Math.round(d.monto * 100) / 100,
          Description: d.descripcion.slice(0, 4000),
          DetailType: 'AccountBasedExpenseLineDetail',
          AccountBasedExpenseLineDetail: { AccountRef: { value: d.cuentaGastoId } },
        },
      ],
    },
  });
  return j.Purchase.Id;
}
