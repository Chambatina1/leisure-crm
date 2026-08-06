# Leisure Exporting LLC · CRM (`leisure-crm`)

CRM con **servidor + base de datos central** para Leisure Exporting LLC.
Paquetería, agencias/subagencias, etiquetas con QR, **rastreo GPS** y
**contabilidad de doble entrada**. El **administrador (matriz)** opera un
**rastreador central** con el rastreo general consolidado de todas las agencias.

Stack: **Next.js 16 + Prisma + PostgreSQL + Render**.

## ✨ Funcionalidad

- **Login por roles** con contraseñas **hasheadas** (bcrypt) y sesión JWT en cookie httpOnly.
- **Agencias y subagencias** jerárquicas: Matriz → Agencias → Subagencias.
- **Rastreador central del administrador**: el `admin` ve **TODAS** las agencias y el consolidado.
- **Aislamiento estricto**: cada agencia ve **SOLO su información**.
- **Permiso delegable**: el admin concede "puede crear subagencias" a una agencia; esta puede crear subagencias **solo bajo sí misma**.
- **Paquetes** con etiqueta + QR imprimible; ingreso contable automático al crear.
- **Escaneo de cámara + GPS**: el camionero escanea el QR y queda registrado en el servidor central.
- **Mapa** con el historial GPS de cada paquete.
- **Contabilidad doble entrada**: libro mayor, ingresos/gastos/caja/utilidad.

## 🚀 Desarrollo local

```bash
cd leisure-crm
npm install
cp .env.example .env     # (si no existe .env)
npx prisma db push       # crea la BD SQLite local
npm run seed             # datos demo
npm run dev              # http://localhost:3000
```

### Usuarios de demo

| Usuario  | Contraseña | Rol        | Qué ve                          |
|----------|------------|------------|---------------------------------|
| `admin`  | `admin`    | admin      | **Rastreo general** (todas)     |
| `habana` | `habana`   | agencia    | Solo Agencia La Habana          |
| `camion` | `camion`   | camionero  | Escaneo y rastreo               |

## ☁️ Despliegue en Render (producción)

1. Sube el repo a GitHub.
2. En `prisma/schema.prisma`, cambia el `provider` a `"postgresql"` (y deja `DATABASE_URL` del entorno).
3. Entra a https://dashboard.render.com → **New → Blueprint** → selecciona el repo.
4. Render lee `render.yaml` y crea: base PostgreSQL + web service + job de seed.
5. Tras el primer despliegue, ejecuta el seed (job `leisure-crm-seed` o `npx prisma db seed` en la Shell).

Variables de entorno (Render las inyecta):
- `DATABASE_URL` — del recurso PostgreSQL.
- `JWT_SECRET` — generado automáticamente (mín. 32 chars).
- `NEXT_PUBLIC_APP_URL` — la URL pública (para los QR).

## 🧱 Arquitectura

```
leisure-crm/
├── prisma/schema.prisma    # 7 modelos (Agencia, Usuario, Cliente, Paquete, Evento, Asiento, Config)
├── src/
│   ├── lib/                # db.ts, auth.ts, permisos.ts, contabilidad.ts, codigo.ts
│   ├── app/api/            # REST: auth, agencias, usuarios, clientes, paquetes, escaneo, contabilidad, dashboard
│   ├── app/login/          # página de login
│   └── middleware.ts       # protege /api/* (cookie de sesión)
├── public/app/             # frontend (PWA) que consume la API
├── render.yaml             # blueprint de Render
└── start.sh                # arranque tolerante
```

## 🔐 Modelo de permisos (aislamiento estricto)

| Rol              | Ve                                   | Puede                              |
|------------------|--------------------------------------|------------------------------------|
| **admin**        | Todas las agencias + consolidado     | Crear agencias, conceder permisos  |
| agencia          | Solo su agencia                      | Sus paquetes/clientes/contabilidad |
| agencia + permiso| Su agencia + sus subagencias         | Crear subagencias bajo sí misma    |
| camionero        | Su agencia                           | Escanear y rastrear                |

**El rastreo general consolidado lo ve ÚNICAMENTE el administrador.**

## 💰 Contabilidad

Plan de cuentas: 110 Caja, 120 Bancos, 130 Cuentas por cobrar, 210 Cuentas por pagar,
300 Capital, 400 Ingresos por envío, 410 Otros ingresos, 500 Costo de transporte,
510 Gastos operativos, 520 Combustible.

Crear una etiqueta registra el asiento automáticamente según la forma de pago
(efectivo→110, banco→120, crédito→130, contra 400 Ingresos).

---

**Leisure Exporting LLC** · CRM con servidor central · marca `geocabezas`.
