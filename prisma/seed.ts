import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create sample pedidos
  const pedidos = await Promise.all([
    prisma.pedido.create({
      data: {
        nombreComprador: 'María López',
        emailComprador: 'maria.lopez@email.com',
        telefonoComprador: '786-555-1234',
        nombreDestinatario: 'José López Hernández',
        telefonoDestinatario: '53-5432-1098',
        carnetDestinatario: '94111138336',
        direccionDestinatario: 'Calle Tomás Estrada Palma #45, Havana',
        producto: 'Ropa y zapatos - 15 lb',
        estado: 'pendiente',
      },
    }),
    prisma.pedido.create({
      data: {
        nombreComprador: 'Carlos Rodriguez',
        emailComprador: 'carlos.r@email.com',
        telefonoComprador: '786-555-5678',
        nombreDestinatario: 'Ana Rodriguez Vega',
        telefonoDestinatario: '53-5555-7890',
        carnetDestinatario: '90011223344',
        direccionDestinatario: 'Calle 10 #234, Vedado, Havana',
        producto: 'Electrodomésticos - 30 lb',
        notas: 'Contiene microondas, manejar con cuidado',
        estado: 'en_proceso',
      },
    }),
    prisma.pedido.create({
      data: {
        nombreComprador: 'Elena Martínez',
        emailComprador: 'elena.m@email.com',
        telefonoComprador: '786-555-9012',
        nombreDestinatario: 'Roberto Martínez Silva',
        telefonoDestinatario: '53-5667-2345',
        carnetDestinatario: '85099887766',
        direccionDestinatario: 'Avenida Simón Bolívar #567, Santiago de Cuba',
        producto: 'Alimentos variados - 20 lb',
        estado: 'en_transito',
      },
    }),
    prisma.pedido.create({
      data: {
        nombreComprador: 'Pedro Gómez',
        emailComprador: 'pedro.g@email.com',
        telefonoComprador: '786-555-3456',
        nombreDestinatario: 'Laura Gómez Pérez',
        telefonoDestinatario: '53-5789-4567',
        carnetDestinatario: '92005566778',
        direccionDestinatario: 'Calle Martí #890, Camagüey',
        producto: 'Bicicleta adulta desarmada',
        notas: 'Bicicleta desarmada, viene en caja',
        estado: 'en_aduana',
      },
    }),
    prisma.pedido.create({
      data: {
        nombreComprador: 'Antonio Sánchez',
        emailComprador: 'antonio.s@email.com',
        telefonoComprador: '786-555-7890',
        nombreDestinatario: 'Carmen Sánchez Ruiz',
        telefonoDestinatario: '53-5234-6789',
        carnetDestinatario: '88004455667',
        direccionDestinatario: 'Calle Independencia #123, Holguín',
        producto: 'Compras TikTok - 8 lb',
        estado: 'entregado',
      },
    }),
  ]);

  console.log(`✅ Created ${pedidos.length} pedidos`);

  // Create sample tracking entries
  const tracking = await Promise.all([
    prisma.trackingEntry.create({
      data: {
        cpk: 'CPK-0266228',
        fecha: '2026-04-13',
        estado: 'EN TRANSITO HACIA CUBA',
        descripcion: 'ACEITE DE MOTOR 4 L',
        embarcador: 'CHAMBATINA MIAMI',
        consignatario: 'ARIANNA CORDERO MARTINEZ',
        carnetPrincipal: '94111138336',
        rawData: 'CHAMBATINA MIAMI\tGEO MIA\t\tCPK-0266228\tEMBARCADO\tSí\tCPK-323\tREGULA/(SEGU 5278396)/(CWPS26188262)\tENVIO\tACEITE DE MOTOR 4 L\t11481\t2026-04-13\tARIANNA CORDERO MARTINEZ\t\t94111138336\tCALLE TOMAS...\t54357818\tROLANDO AQUINO CANCIO',
      },
    }),
    prisma.trackingEntry.create({
      data: {
        cpk: 'CPK-0300455',
        fecha: '2026-04-20',
        estado: 'EN AGENCIA',
        descripcion: 'ROPA Y ZAPATOS VARIOS',
        embarcador: 'CHAMBATINA MIAMI',
        consignatario: 'MARIA GARCIA',
        carnetPrincipal: '90011223344',
        rawData: 'CHAMBATINA MIAMI\tGEO MIA\t\tCPK-0300455\tEN AGENCIA\tSí\tCPK-456\tREGULA/(SEGU 6278901)/(CWPS35012345)\tENVIO\tROPA Y ZAPATOS VARIOS\t11482\t2026-04-20\tMARIA GARCIA\t\t90011223344\tCALLE 10 #234\t55556789\tPEDRO GARCIA',
      },
    }),
    prisma.trackingEntry.create({
      data: {
        cpk: 'CPK-0199988',
        fecha: '2026-03-25',
        estado: 'ENTREGADO',
        descripcion: 'EQUIPO DE AUDIO',
        embarcador: 'CHAMBATINA MIAMI',
        consignatario: 'LUIS HERNANDEZ',
        carnetPrincipal: '85099887766',
        rawData: 'CHAMBATINA MIAMI\tGEO MIA\t\tCPK-0199988\tENTREGADO\tSí\tCPK-789\tREGULA/(SEGU 4455678)/(CWPS29098765)\tENVIO\tEQUIPO DE AUDIO\t11480\t2026-03-25\tLUIS HERNANDEZ\t\t85099887766\tCALLE MARTI #100\t56672345\tJUANA HERNANDEZ',
      },
    }),
  ]);

  console.log(`✅ Created ${tracking.length} tracking entries`);
  console.log('🎉 Seeding complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
