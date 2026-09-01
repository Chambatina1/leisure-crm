import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
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
