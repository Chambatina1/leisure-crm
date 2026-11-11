/**
 * Pruebas de integración de los pagos por Zelle de balitas.
 *
 * Usan una base de datos PostgreSQL DE PRUEBAS (nunca la de producción) y no
 * envían correos: se guardan en un archivo (CORREO_PRUEBAS_ARCHIVO).
 *
 *   DATABASE_URL=postgresql://usuario@localhost:5432/prueba npx prisma db push --skip-generate
 *   DATABASE_URL=postgresql://usuario@localhost:5432/prueba npm run test:zelle
 */
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ARCHIVO = path.join(os.tmpdir(), `correos-prueba-${process.pid}.jsonl`);
process.env.CORREO_PRUEBAS_ARCHIVO = ARCHIVO;

if (!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '')) {
  throw new Error('Estas pruebas solo se ejecutan contra una base de datos local de pruebas (DATABASE_URL con localhost).');
}

type Correo = { to: string; subject: string; text: string; html: string; replyTo?: string };
const correos = (): Correo[] =>
  fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

let db: typeof import('../src/lib/db').db;
let zelle: typeof import('../src/lib/zelle');
let cil: typeof import('../src/lib/cilindros');

// Firma de Gmail tal como llega en los avisos reales de Wells Fargo
const AUTH_BANCO =
  'Authentication-Results: mx.google.com; dkim=pass header.i=@notify.wellsfargo.com header.s=s1; spf=pass; dmarc=pass header.from=notify.wellsfargo.com';
let n = 0;
const avisoBanco = (monto: string, nota = '') => ({
  mensajeId: `prueba-${Date.now()}-${++n}`,
  from: 'Wells Fargo <alerts@notify.wellsfargo.com>',
  asunto: 'You received money with Zelle',
  cuerpo: `JUAN PRUEBA sent you ${monto}. ${nota ? `Memo: ${nota}` : ''}`,
  autenticacion: AUTH_BANCO,
});

async function compra(numero: string, monto: number, email: string, minutosAtras = 5) {
  await db.$executeRawUnsafe(
    `INSERT INTO "ReservaCilindro" ("numero","nombreComprador","telefonoComprador","emailComprador","nombreRecoge","carnetRecoge","cantidad","montoUsd","lote","createdAt")
     VALUES ($1,$2,'3050000000',$3,'Recoge Prueba','85010112345',1,$4,$5, NOW() - ($6 || ' minutes')::interval)`,
    numero, `Cliente ${numero}`, email, monto, cil.loteActual(), String(minutosAtras)
  );
}
const estado = async (numero: string) =>
  (await db.$queryRawUnsafe<{ estado: string; pin: string | null }[]>(`SELECT "estado","pin" FROM "ReservaCilindro" WHERE "numero"=$1`, numero))[0];

before(async () => {
  ({ db } = await import('../src/lib/db'));
  zelle = await import('../src/lib/zelle');
  cil = await import('../src/lib/cilindros');
  await cil.asegurarTablaReservas();
});

beforeEach(async () => {
  await db.$executeRawUnsafe(`DELETE FROM "ReservaCilindro"`);
  await db.$executeRawUnsafe(`DO $$ BEGIN IF to_regclass('"AvisoZelle"') IS NOT NULL THEN DELETE FROM "AvisoZelle"; END IF; END $$`);
  if (fs.existsSync(ARCHIVO)) fs.unlinkSync(ARCHIVO);
});

after(async () => {
  await db.$disconnect();
  if (fs.existsSync(ARCHIVO)) fs.unlinkSync(ARCHIVO);
});

test('1. Monto único: cada compra nueva recibe centavos distintos', async () => {
  assert.equal(await cil.montoUnico(68.25), 68.24);
  await compra('RC-000001', 68.24, 'a@prueba.com');
  assert.equal(await cil.montoUnico(68.25), 68.23);
  await compra('RC-000002', 68.23, 'b@prueba.com');
  await compra('RC-000003', 68.25, 'c@prueba.com'); // compra antigua sin centavos
  assert.equal(await cil.montoUnico(68.25), 68.22);
  assert.equal(await cil.montoUnico(136.5), 136.49, 'otro precio no choca');
});

test('2. Zelle con RC- en la nota: se confirma y llega el PIN al cliente', async () => {
  await compra('RC-000010', 68.24, 'cliente10@prueba.com');
  const r = await zelle.procesarAviso(avisoBanco('$68.24', 'RC-000010'));
  assert.equal(r.resultado, 'aplicado');
  const e = await estado('RC-000010');
  assert.equal(e.estado, 'pagada');
  assert.match(e.pin || '', /^\d{6}$/);
  assert.ok(correos().some((c) => c.to === 'cliente10@prueba.com' && c.subject.includes(e.pin!)), 'correo con el PIN al cliente');
});

test('3. Zelle con RC- que llega tarde (3 h después): se confirma igual', async () => {
  await compra('RC-000011', 68.25, 'cliente11@prueba.com', 180);
  const r = await zelle.procesarAviso(avisoBanco('$68.25', 'RC-000011'));
  assert.equal(r.resultado, 'aplicado');
  assert.match(r.detalle, /después de reservar/);
  assert.equal((await estado('RC-000011')).estado, 'pagada');
});

test('4. Zelle SIN RC- con el monto único exacto: se confirma la compra correcta entre varias', async () => {
  await compra('RC-000020', 68.24, 'uno@prueba.com', 30);
  await compra('RC-000021', 68.23, 'dos@prueba.com', 20);
  await compra('RC-000022', 68.22, 'tres@prueba.com', 10);
  const r = await zelle.procesarAviso(avisoBanco('$68.23'));
  assert.equal(r.resultado, 'aplicado');
  assert.equal(r.referencia, 'RC-000021');
  assert.equal((await estado('RC-000021')).estado, 'pagada');
  assert.equal((await estado('RC-000020')).estado, 'pendiente_pago');
  assert.equal((await estado('RC-000022')).estado, 'pendiente_pago');
});

test('5. Zelle SIN RC- por el precio normal y varias personas: no se confirma nada, aviso claro a ventas', async () => {
  await compra('RC-000030', 68.24, 'uno@prueba.com', 600);
  await compra('RC-000031', 68.23, 'dos@prueba.com', 7);
  const r = await zelle.procesarAviso(avisoBanco('$68.25'));
  assert.equal(r.resultado, 'revisar');
  assert.equal((await estado('RC-000030')).estado, 'pendiente_pago');
  assert.equal((await estado('RC-000031')).estado, 'pendiente_pago');
  const ventas = correos().find((c) => c.to === cil.ZELLE_DESTINO);
  assert.ok(ventas, 'aviso a ventas');
  assert.match(ventas!.subject, /SIN número RC- .*probable RC-000031/);
  assert.match(ventas!.text, /QUÉ HACER/);
  assert.ok(correos().some((c) => c.to === 'dos@prueba.com' && /Falta tu número de reserva RC-000031/.test(c.subject)), 'se le pide la referencia al comprador reciente');
  assert.ok(!correos().some((c) => c.to === 'uno@prueba.com'), 'no se molesta a quien compró hace 10 h');
});

test('6. Zelle SIN RC- y una sola persona con compra de ese precio: se confirma', async () => {
  await compra('RC-000040', 68.24, 'solo@prueba.com');
  const r = await zelle.procesarAviso(avisoBanco('$68.25'));
  assert.equal(r.resultado, 'aplicado');
  assert.equal((await estado('RC-000040')).estado, 'pagada');
});

test('7. El cliente responde al correo con su RC-: se le asigna el Zelle y llega el PIN; un segundo reclamo no recibe nada', async () => {
  await compra('RC-000050', 68.25, 'ana@gmail.com', 30);
  await compra('RC-000051', 68.25, 'luis@gmail.com', 20);
  assert.equal((await zelle.procesarAviso(avisoBanco('$68.25'))).resultado, 'revisar');
  const respuesta = (de: string, rc: string) => ({
    mensajeId: `resp-${rc}-${Date.now()}`,
    from: `Cliente <${de}>`,
    asunto: `Re: ¿Pagaste $68.25 por Zelle? Falta tu número de reserva ${rc}`,
    cuerpo: `Sí, fui yo. ${rc}`,
    autenticacion: 'Authentication-Results: mx.google.com; dkim=pass header.i=@gmail.com header.s=20230601; spf=pass',
  });
  const r1 = await zelle.procesarAviso(respuesta('luis@gmail.com', 'RC-000051'));
  assert.equal(r1.resultado, 'aplicado');
  assert.equal((await estado('RC-000051')).estado, 'pagada');
  const r2 = await zelle.procesarAviso(respuesta('ana@gmail.com', 'RC-000050'));
  assert.notEqual(r2.resultado, 'aplicado', 'el mismo Zelle no se asigna dos veces');
  assert.equal((await estado('RC-000050')).estado, 'pendiente_pago');
});

test('8. Seguridad: un correo que no es del banco o sin firma no confirma nada', async () => {
  await compra('RC-000060', 68.25, 'x@prueba.com');
  const falso = { ...avisoBanco('$68.25', 'RC-000060'), from: 'Wells Fargo <alerts@wellsfarg0.com>' };
  assert.equal((await zelle.procesarAviso(falso)).resultado, 'ignorado');
  const sinFirma = { ...avisoBanco('$68.25', 'RC-000060'), autenticacion: 'Authentication-Results: mx.google.com; dkim=fail' };
  assert.equal((await zelle.procesarAviso(sinFirma)).resultado, 'ignorado');
  assert.equal((await estado('RC-000060')).estado, 'pendiente_pago');
});

test('9. Seguridad: responder desde otro correo no confirma la compra de otra persona', async () => {
  await compra('RC-000070', 68.25, 'duena@gmail.com', 30);
  await compra('RC-000071', 68.25, 'otra@gmail.com', 20);
  await zelle.procesarAviso(avisoBanco('$68.25'));
  const r = await zelle.procesarAviso({
    mensajeId: `resp-intruso-${Date.now()}`,
    from: 'Intruso <intruso@gmail.com>',
    asunto: 'Re: ¿Pagaste $68.25 por Zelle? Falta tu número de reserva RC-000070',
    cuerpo: 'RC-000070',
    autenticacion: 'Authentication-Results: mx.google.com; dkim=pass header.i=@gmail.com',
  });
  assert.equal(r.resultado, 'ignorado');
  assert.equal((await estado('RC-000070')).estado, 'pendiente_pago');
});

test('10. Un aviso repetido del banco no se aplica dos veces', async () => {
  await compra('RC-000080', 68.25, 'rep@prueba.com');
  const a = avisoBanco('$68.25', 'RC-000080');
  assert.equal((await zelle.procesarAviso(a)).resultado, 'aplicado');
  assert.equal((await zelle.procesarAviso(a)).resultado, 'duplicado');
});
