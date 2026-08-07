#!/bin/sh
# start.sh — arranque para producción (Render).
# 1. Aplica el esquema de Prisma a la base (db push).
# 2. Genera el cliente Prisma.
# 3. Corre el seed si la BD está vacía.
# 4. Arranca Next.js.
#
# IMPORTANTE: db push es OBLIGATORIO. Si falla, la app no arranca bien
# porque las columnas nuevas del schema no existen en la DB.
set -e

echo "▶ [1/4] Aplicando esquema de base de datos (prisma db push)…"
npx prisma db push --accept-data-loss

echo "▶ [2/4] Generando cliente Prisma…"
npx prisma generate

echo "▶ [3/4] Verificando si hay datos (seed solo si BD vacía)…"
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.usuario.count().then(n => {
  db.\$disconnect();
  if (n === 0) {
    console.log('▶ BD vacía → corriendo seed…');
    const { execSync } = require('child_process');
    try { execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' }); }
    catch(e){ console.log('⚠ seed falló:', e.message); }
  } else {
    console.log('▶ BD ya tiene ' + n + ' usuarios, saltando seed.');
  }
}).catch(e => { console.log('⚠ no se pudo verificar seed:', e.message); });
" || echo "⚠ verificación de seed falló (no crítico)"

echo "▶ [4/4] Iniciando Next.js…"
exec npx next start -p ${PORT:-3000} -H 0.0.0.0
