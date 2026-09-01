import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectarIntencion, BUSINESS_CONTEXT, calcularEnvio, BICICLETAS, CAJAS } from '@/lib/leisure-exporting';
import ZAI from 'z-ai-web-dev-sdk';

// Config keys and their defaults
const CONFIG_DEFAULTS: Record<string, string> = {
  direccion: '7523 Aloma Ave, Winter Park, FL 32792, Suite 112',
  telefono1: '786-942-6904',
  nombre_contacto1: 'Geo',
  telefono2: '786-784-6421',
  nombre_contacto2: 'Adriana',
  telefono3: '',
  nombre_contacto3: '',
  horario: 'Lunes a Viernes 9:00 AM - 6:00 PM',
  email: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
};

async function getConfig(keys: string[]): Promise<Record<string, string>> {
  try {
    const entries = await db.config.findMany({
      where: { clave: { in: keys } },
    });
    const result: Record<string, string> = {};
    for (const k of keys) {
      const entry = entries.find(e => e.clave === k);
      result[k] = entry?.valor || CONFIG_DEFAULTS[k] || '';
    }
    return result;
  } catch {
    const result: Record<string, string> = {};
    for (const k of keys) result[k] = CONFIG_DEFAULTS[k] || '';
    return result;
  }
}

// Search knowledge base for matching entries
async function searchKnowledge(query: string): Promise<string> {
  try {
    const queryWords = query.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (queryWords.length === 0) return '';

    const entries = await db.aIKnowledge.findMany({
      where: { activa: true },
      orderBy: { prioridad: 'desc' },
    });

    // Score each entry
    const scored = entries.map(entry => {
      const preguntaLower = entry.pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const respuestaLower = entry.respuesta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const keywordsLower = entry.keywords.map(k => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      
      let score = 0;
      
      // Check keywords match
      for (const kw of keywordsLower) {
        if (kw && kw.length > 1) {
          for (const qw of queryWords) {
            if (qw === kw || qw.includes(kw) || kw.includes(qw)) {
              score += 10;
            }
          }
        }
      }
      
      // Check pregunta words match
      for (const qw of queryWords) {
        if (preguntaLower.includes(qw)) {
          score += 5;
        }
        // Also check respuesta words
        if (respuestaLower.includes(qw)) {
          score += 2;
        }
      }
      
      // Category bonus
      if (entry.prioridad > 0) score += entry.prioridad;
      
      return { entry, score };
    }).filter(s => s.score > 3).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const topEntries = scored.slice(0, 3);
      return topEntries.map(s => s.entry.respuesta).join('\n\n');
    }
    return '';
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mensaje, sessionId } = body;

    if (!mensaje || !sessionId) {
      return NextResponse.json({ ok: false, error: 'Mensaje y sessionId son requeridos' }, { status: 400 });
    }

    // Save user message
    await db.chatMessage.create({
      data: { sessionId, role: 'user', content: mensaje },
    });

    // ALWAYS search knowledge base first (before intent detection)
    const knowledgeContext = await searchKnowledge(mensaje);
    const hasStrongKnowledge = knowledgeContext.length > 50;

    // Detect intent
    const intent = detectarIntencion(mensaje);
    let respuesta = '';

    // If knowledge base has strong match, use it directly (bypass intent)
    if (hasStrongKnowledge && intent.intent === 'default') {
      try {
        const chatHistory = await db.chatMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
          take: 20,
        });
        const messages = chatHistory.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        let systemPrompt = BUSINESS_CONTEXT;
        systemPrompt += `\n\nCONOCIMIENTO ESPECÍFICO DE LA BASE DE DATOS:\n${knowledgeContext}\n\nUsa esta información para responder si es relevante. Si la información de la base de datos responde la pregunta, dale prioridad y responde directamente.`;
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        });
        respuesta = completion.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
      } catch (aiError) {
        console.error('AI Error:', aiError);
        respuesta = knowledgeContext;
      }
    } else {
    switch (intent.intent) {
      case 'saludo':
        respuesta = '¡Hola! 👋 Soy el asistente virtual de **Leisure Exporting**. Estoy aquí para ayudarte con lo que necesites.\n\nPuedo ayudarte con:\n- 📦 **Precios de envío** — Dime el peso y te calculo el costo\n- 🚲 **Envío de bicicletas** — Precios por tipo\n- 📋 **Rastreo de paquetes** — Busca por CPK o carnet\n- ☀️ **Sistemas solares** — Info sobre EcoFlow\n- 📍 **Información de contacto** — Dirección y teléfonos\n\n¿En qué te puedo ayudar?';
        break;

      case 'precio_peso': {
        const { peso, tipo, total, subtotal, cargoEquipo } = intent.data;
        const tipoLabel = tipo === 'recogida' ? 'recogida a domicilio' : tipo === 'tiktok' ? 'compras TikTok' : 'equipo';
        respuesta = `💰 **Cálculo de envío:**\n\n- **Peso:** ${peso} lb\n- **Tipo:** ${tipoLabel}\n- **Precio por libra:** $${intent.data.precioPorLibra.toFixed(2)}\n- **Subtotal:** $${subtotal.toFixed(2)}\n${cargoEquipo > 0 ? `- **Cargo por equipo:** $${cargoEquipo.toFixed(2)}\n` : ''}- **Total: $${total.toFixed(2)}**\n\n${tipo === 'equipo' ? 'Fórmula: (Peso × $1.99) + $25 cargo de equipo' : `Fórmula: Peso × $${intent.data.precioPorLibra.toFixed(2)}`}\n\n¿Deseas hacer este envío? Puedes ir a la sección de **Hacer un Envío** desde el menú.`;
        break;
      }

      case 'precio_bicicleta':
        respuesta = `🚲 **Precios de Envío de Bicicletas:**\n\n${intent.data.bicicletas.map((b: { descripcion: string; precio: number }) => `- **${b.descripcion}**: $${b.precio}`).join('\n')}\n\n¿Necesitas enviar una bicicleta? Contáctanos para coordinar la recogida.`;
        break;

      case 'precio_caja':
        respuesta = `📦 **Precios de Cajas de Envío:**\n\n${intent.data.cajas.map((c: { nombre: string; dimensiones: string; pesoMaximo: number; precio: number }) => `- **${c.nombre}** (${c.dimensiones}, hasta ${c.pesoMaximo} lb): $${c.precio}`).join('\n')}\n\n¿Necesitas una caja para tu envío?`;
        break;

      case 'precio_general':
        respuesta = `💰 **Lista de Precios Leisure Exporting:**\n\n**Envíos por libra:**\n- 🏢 Equipo: **$1.99/lb** + $25 cargo\n- 🏠 Recogida a domicilio: **$2.30/lb**\n- 🛒 Compras TikTok: **$1.80/lb**\n\n**Bicicletas:**\n${intent.data.bicicletas.map((b: { descripcion: string; precio: number }) => `- ${b.descripcion}: $${b.precio}`).join('\n')}\n\n**Cajas:**\n${intent.data.cajas.map((c: { nombre: string; dimensiones: string; precio: number }) => `- ${c.nombre} (${c.dimensiones}): $${c.precio}`).join('\n')}\n\n¿Quieres que calcule el precio de un envío específico? Solo dime el peso.`;
        break;

      case 'tracking_cpk':
        respuesta = `📋 Para rastrear el paquete **${intent.data.cpk}**, usa el **Rastreador** en el menú principal.\n\nAhí podrás ver el estado actual, la ubicación y el historial completo de tu envío en tiempo real.`;
        break;

      case 'tracking_carnet':
        respuesta = `📋 Para buscar por carnet **${intent.data.carnet}**, ve al **Rastreador** en el menú principal.\n\nSolo ingresa tu número de carnet y te mostraremos todos los paquetes asociados.`;
        break;

      case 'tracking_info':
        respuesta = `📋 **Rastreo de Paquetes:**\n\nPuedes rastrear tu paquete usando:\n- **Número CPK** (ejemplo: CPK-0266228 o solo el número 266228)\n- **Carnet de identidad** del destinatario o de un familiar\n\nUsa el **Rastreador** en el menú principal para buscar en tiempo real.`;
        break;

      case 'contacto': {
        const d = await getConfig(['direccion', 'telefono1', 'nombre_contacto1', 'telefono2', 'nombre_contacto2', 'telefono3', 'nombre_contacto3', 'horario', 'email', 'whatsapp']);
        const direccion = d.direccion;
        const lines: string[] = [];
        if (d.telefono1) lines.push(`${d.nombre_contacto1 || 'Tel'}: **${d.telefono1}**`);
        if (d.telefono2) lines.push(`${d.nombre_contacto2 || 'Tel'}: **${d.telefono2}**`);
        if (d.telefono3) lines.push(`${d.nombre_contacto3 || 'Tel'}: **${d.telefono3}**`);
        let telefonos = lines.join('\n- ');
        if (d.whatsapp) telefonos += `\n- WhatsApp: **${d.whatsapp}**`;
        if (d.email) telefonos += `\n- Email: **${d.email}**`;
        let horarioStr = '';
        if (d.horario) horarioStr = `\n\n⏰ **Horario:** ${d.horario}`;
        respuesta = `📍 **Información de Contacto:**\n\n🏢 **Oficina:** ${direccion}\n\n📞 **Teléfonos:**\n- ${telefonos}${horarioStr}\n\n¡Visítanos o llámanos, estamos para ayudarte!`;
        break;
      }

      case 'bicicletas':
        respuesta = `🚲 **Servicio de Envío de Bicicletas Leisure Exporting:**\n\n${BICICLETAS.map(b => `- **${b.descripcion}**: $${b.precio}`).join('\n')}\n\n¿Te interesa enviar una bicicleta? Contáctanos y coordinamos la recogida.`;
        break;

      case 'solar': {
        const sd = await getConfig(['telefono1', 'nombre_contacto1', 'telefono2', 'nombre_contacto2']);
        const solarLines: string[] = [];
        if (sd.telefono1) solarLines.push(`📞 **${sd.telefono1}** (${sd.nombre_contacto1 || 'Contacto'})`);
        if (sd.telefono2) solarLines.push(`📞 **${sd.telefono2}** (${sd.nombre_contacto2 || 'Contacto'})`);
        const solarPhones = solarLines.join('\n') || '📞 Contacta a la oficina';
        respuesta = `☀️ **Sistemas de Energía Solar:**\n\nLeisure Exporting ofrece orientación y productos de energía solar, incluyendo sistemas **EcoFlow** para tu hogar o negocio.\n\nPara más información sobre productos y precios:\n${solarPhones}\n\n¡La energía solar es el futuro, y nosotros te ayudamos a dar el primer paso!`;
        break;
      }

      default: {
        // For general chat, use knowledge base + AI
        try {
          const chatHistory = await db.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: 20,
          });

          const messages = chatHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          let systemPrompt = BUSINESS_CONTEXT;
          if (knowledgeContext) {
            systemPrompt += `\n\nCONOCIMIENTO ESPECÍFICO DE LA BASE DE DATOS:\n${knowledgeContext}\n\nUsa esta información para responder si es relevante a la pregunta del usuario. Si la información de la base de datos es relevante, dale prioridad.`;
          }

          const zai = await ZAI.create();
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
          });

          respuesta = completion.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
        } catch (aiError) {
          console.error('AI Error:', aiError);
          respuesta = 'Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías reformular tu pregunta?\n\nSi necesitas información sobre **precios** o **rastreo**, puedo ayudarte directamente. También puedes contactarnos por teléfono o WhatsApp.';
        }
        break;
      }
    }
    } // end else block (knowledge bypass)

    // Save assistant response
    await db.chatMessage.create({
      data: { sessionId, role: 'assistant', content: respuesta },
    });

    return NextResponse.json({ ok: true, respuesta });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ ok: false, error: 'Error en el chat' }, { status: 500 });
  }
}
