#!/bin/sh
# start.sh — arranque para producción (Render) con PostgreSQL.
# 1. Verifica que DATABASE_URL esté configurada.
# 2. Aplica el esquema (db push) — crea las tablas en PostgreSQL.
# 3. Seed si la BD está vacía.
# 4. Arranca Next.js.
set -e

echo "▶ [0/4] Verificando configuración…"
if [ -z "$DATABASE_URL" ]; then
  echo "✗ ERROR: DATABASE_URL no está configurada."
  echo "  En Render: Environment → Add Variable → DATABASE_URL = (URL interna del PostgreSQL)"
  exit 1
fi
echo "  ✓ DATABASE_URL configurada (${#DATABASE_URL} chars)"

echo "▶ [1/4] Aplicando esquema a PostgreSQL (prisma db push)…"
npx prisma db push --accept-data-loss 2>&1 || { echo "✗ db push falló"; exit 1; }

echo "▶ [2/4] Generando cliente Prisma…"
npx prisma generate 2>&1 || { echo "✗ generate falló"; exit 1; }

echo "▶ [3/4] Verificando seed…"
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
    console.log('✓ BD ya tiene ' + n + ' usuarios, saltando seed.');
  }
}).catch(e => { console.log('⚠ verificación de seed falló:', e.message); });
"

echo "▶ [4/4] Iniciando Next.js…"
exec npx next start -p ${PORT:-3000} -H 0.0.0.0
