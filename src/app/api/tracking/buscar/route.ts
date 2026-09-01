import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizarCPK, estadoPorTiempo, ETAPAS } from '@/lib/leisure-exporting';

// Map real estado string to matching ETAPA for timeline display
function matchEtapa(estado: string) {
  const upper = estado.toUpperCase().trim();
  for (const etapa of ETAPAS) {
    if (upper === etapa.estado || upper.includes(etapa.estado)) {
      return etapa;
    }
  }
  // Fallback mappings for common variations
  if (upper.includes('ENTREGADO')) return ETAPAS.find(e => e.estado === 'ENTREGADO');
  if (upper.includes('DISTRIBUCION') || upper.includes('DISTRIBUCIÓN') || upper.includes('REPARTO')) return ETAPAS.find(e => e.estado === 'EN DISTRIBUCION');
  if (upper.includes('ADUANA')) return ETAPAS.find(e => e.estado === 'EN ADUANA');
  if (upper.includes('TRANSITO') || upper.includes('TRÁNSITO')) return ETAPAS.find(e => e.estado === 'EN TRANSITO');
  if (upper.includes('AGENCIA') || upper.includes('RECIBIDO') || upper.includes('PENDIENTE')) return ETAPAS.find(e => e.estado === 'EN AGENCIA');
  if (upper.includes('EMBARCADO')) return ETAPAS.find(e => e.estado === 'EN AGENCIA');
  return null;
}

// GET /api/tracking/buscar?cpk=XXX or ?carnet=XXX or ?q=XXX (smart search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpk = searchParams.get('cpk');
    const carnet = searchParams.get('carnet');
    const q = searchParams.get('q'); // Smart search - auto detect CPK or carnet

    // Smart search: if q is provided, auto-detect what it is
    let searchCPK = cpk;
    let searchCarnet = carnet;

    if (q && !cpk && !carnet) {
      const trimmed = q.trim();
      const digitsOnly = trimmed.replace(/[^0-9]/g, '');
      
      // Check if it contains CPK prefix
      if (/CPK/i.test(trimmed)) {
        searchCPK = trimmed;
      }
      // Check if it looks like a carnet (11 digits = Cuban carnet, or 9-12 digits)
      else if (/^\d{9,12}$/.test(digitsOnly)) {
        searchCarnet = digitsOnly;
      }
      // Check if it looks like a CPK number (digits only, 4-8 digits)
      else if (/^\d{1,8}$/.test(digitsOnly)) {
        // Could be partial CPK number - search by contains
        searchCPK = trimmed;
      }
      // Ambiguous: 8-9 digits - try BOTH CPK and carnet
      else if (/^\d{8,9}$/.test(digitsOnly)) {
        searchCPK = trimmed;
        searchCarnet = digitsOnly;
      }
      // Otherwise, try CPK first (might have mixed format)
      else {
        searchCPK = trimmed;
      }
    }

    if (!searchCPK && !searchCarnet) {
      return NextResponse.json({ ok: false, error: 'Se requiere un número de búsqueda' }, { status: 400 });
    }

    let results: any[] = [];
    const seenIds = new Set<number>();

    // Search by CPK
    if (searchCPK) {
      const normalizedCPK = normalizarCPK(searchCPK);
      
      // First try exact match
      const cpkResults = await db.trackingEntry.findMany({
        where: { cpk: normalizedCPK },
        orderBy: { createdAt: 'desc' },
      });
      for (const r of cpkResults) {
        if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
      }

      // If no exact match and searchCPK is just digits (partial), try contains search
      if (results.length === 0 && /^\d+$/.test(searchCPK.trim())) {
        const digits = searchCPK.trim();
        // Pad to 7 digits for searching
        const paddedDigits = digits.padStart(7, '0');
        const containsResults = await db.trackingEntry.findMany({
          where: {
            cpk: { contains: paddedDigits },
          },
          orderBy: { createdAt: 'desc' },
        });
        for (const r of containsResults) {
          if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
        }

        // Also try with various CPK formats
        if (results.length === 0) {
          const allEntries = await db.trackingEntry.findMany({
            orderBy: { createdAt: 'desc' },
          });
          const filtered = allEntries.filter(e => {
            const numOnly = e.cpk.replace(/[^0-9]/g, '');
            return numOnly.includes(digits) || paddedDigits.includes(numOnly) || numOnly.includes(paddedDigits);
          });
          for (const r of filtered) {
            if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
          }
        }
      }
    }

    // Search by carnet
    if (searchCarnet) {
      const normalizedCarnet = searchCarnet.replace(/[^0-9]/g, '');
      
      // Search in TrackingEntry.carnetPrincipal
      const trackingResults = await db.trackingEntry.findMany({
        orderBy: { createdAt: 'desc' },
      });
      
      const carnetTracking = trackingResults.filter(e => {
        if (!e.carnetPrincipal) return false;
        const eCarnet = e.carnetPrincipal.replace(/[^0-9]/g, '');
        return eCarnet.includes(normalizedCarnet) || normalizedCarnet.includes(eCarnet);
      });
      for (const r of carnetTracking) {
        if (!seenIds.has(r.id)) { results.push(r); seenIds.add(r.id); }
      }
      
      // Also search in Pedido.carnetDestinatario using digit-only comparison
      const allPedidos = await db.pedido.findMany({
        orderBy: { createdAt: 'desc' },
      });
      
      const carnetPedidos = allPedidos.filter(p => {
        if (!p.carnetDestinatario) return false;
        const pCarnet = p.carnetDestinatario.replace(/[^0-9]/g, '');
        return pCarnet.includes(normalizedCarnet) || normalizedCarnet.includes(pCarnet);
      });
      
      // Add pedidos as tracking-style results
      for (const p of carnetPedidos) {
        const alreadyExists = results.some(r => r.cpk === `PED-${p.id}`);
        if (!alreadyExists) {
          results.push({
            id: p.id,
            cpk: `PED-${p.id}`,
            fecha: p.createdAt?.toISOString().split('T')[0] || null,
            estado: p.estado,
            descripcion: p.producto,
            embarcador: p.nombreComprador,
            consignatario: p.nombreDestinatario,
            carnetPrincipal: p.carnetDestinatario,
            rawData: null,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          });
        }
      }
    }

    // Add etapaInfo for timeline display
    results = (results || []).map(entry => {
      const matchedEtapa = matchEtapa(entry.estado);
      const etapaInfo = matchedEtapa || estadoPorTiempo(entry.fecha || '');
      return {
        ...entry,
        estadoCalculado: estadoPorTiempo(entry.fecha || '').estado,
        etapaInfo,
      };
    });

    return NextResponse.json({ ok: true, data: results });
  } catch (error) {
    console.error('Error searching tracking:', error);
    return NextResponse.json({ ok: false, error: 'Error al buscar en rastreo' }, { status: 500 });
  }
}
