import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://rastreador_db_user:E89uVwg0xGMOLwEGQPRbjWpwHLXXHxE9@dpg-d7hoferbc2fs73dk6q1g-a.oregon-postgres.render.com/rastreador_db',
  ssl: { rejectUnauthorized: false }
});

export type Pedido = {
  id: number;
  nombre_comprador: string;
  email_comprador: string | null;
  telefono_comprador: string;
  nombre_destinatario: string;
  telefono_destinatario: string;
  carnet_destinatario: string | null;
  direccion_destinatario: string;
  producto: string;
  notas: string | null;
  estado: string;
  created_at: string;
};
