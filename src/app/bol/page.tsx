import { db } from "@/lib/db";
import BOLContent from "./bol-content";

export const dynamic = "force-dynamic";

export default async function BOLPage() {
  let paquetes: any[] = [];
  let brands: any[] = [];
  let dbError: string | null = null;
  try {
    paquetes = await db.paquete.findMany({
      where: { estado: { not: "entregado" } },
      orderBy: { codigo: "asc" },
    });
    brands = await db.brand.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { nombre: true, logo: true },
    });
  } catch (e) {
    dbError = String(e).slice(0, 300);
  }

  const fecha = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });

  return <BOLContent fecha={fecha} dbError={dbError} paquetes={paquetes} brands={brands} />;
}
