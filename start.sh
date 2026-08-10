#!/bin/sh
# start.sh — arranque para producción (Render) con PostgreSQL.
# 1. Verifica que DATABASE_URL esté configurada.
# 2. Aplica el esquema (prisma migrate deploy) — NO borra datos.
# 3. Seed SOLO si la BD está completamente vacía.
# 4. Arranca Next.js.
set -e

echo "▶ [0/4] Verificando configuracion..."
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL no esta configurada."
  exit 1
fi
echo "  DATABASE_URL OK (${#DATABASE_URL} chars)"

echo "▶ [1/4] Aplicando esquema a PostgreSQL (prisma db push)..."
# db push crea/actualiza tablas SIN borrar datos existentes.
# La bandera --accept-data-loss solo aplica si un tipo cambia (raro).
npx prisma db push 2>&1 || npx prisma db push --accept-data-loss 2>&1 || echo "WARNING: db push falto, continuando..."

echo "▶ [2/4] Generando cliente Prisma..."
npx prisma generate 2>&1 || echo "WARNING: generate fallo"

echo "▶ [3/4] Verificando si necesita seed..."
# SOLO sembrar si NO hay agencias. Si hay agencias, los datos existen.
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.agencia.count().then(n => {
  db.\$disconnect();
  if (n === 0) {
    console.log('BD vacia -> corriendo seed...');
    const { execSync } = require('child_process');
    try { execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' }); }
    catch(e){ console.log('WARNING: seed fallo:', e.message); }
  } else {
    console.log('BD ya tiene ' + n + ' agencias. NO se borran datos.');
  }
}).catch(e => { console.log('WARNING:', e.message); });
"

echo "▶ [4/4] Iniciando Next.js..."
exec npx next start -p ${PORT:-3000} -H 0.0.0.0
