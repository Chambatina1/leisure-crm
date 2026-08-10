#!/bin/sh
set -e

echo "▶ [0/4] Verificando configuracion..."
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL no esta configurada."
  exit 1
fi
echo "  DATABASE_URL OK"

echo "▶ [1/4] Aplicando esquema (db push SIN borrar datos)..."
npx prisma db push 2>&1 || echo "WARNING: db push fallo, continuando..."

echo "▶ [2/4] Generando cliente Prisma..."
npx prisma generate 2>&1 || echo "WARNING: generate fallo"

echo "▶ [3/4] Verificando seed (PROTEGE DATOS)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.agencia.count().then(n => {
  db.\$disconnect();
  if (n === 0) {
    console.log('BD vacia -> seed inicial...');
    const { execSync } = require('child_process');
    try { execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' }); }
    catch(e){ console.log('WARNING: seed fallo'); }
  } else {
    console.log('PROTECCION: ' + n + ' agencias existentes. NO se borra nada.');
  }
}).catch(e => { console.log('WARNING:', e.message); });
"

echo "▶ [4/4] Iniciando Next.js..."
exec npx next start -p ${PORT:-3000} -H 0.0.0.0
