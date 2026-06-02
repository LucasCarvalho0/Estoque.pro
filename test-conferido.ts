import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestInventory = await prisma.inventory.findFirst({
    where: { status: 'CONCLUIDO' },
    orderBy: { finalizadoEm: 'desc' },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!latestInventory) return;

  const loc09 = latestInventory.items.find(i => i.product.codigo === 'LOC09');
  const trava = latestInventory.items.find(i => i.product.codigo === 'BRPRT 11354');
  const b11605 = latestInventory.items.find(i => i.product.codigo === 'BRPRT 11605');

  console.log('LOC09 conferido?', loc09?.conferido, 'Contada:', loc09?.quantidadeContada, 'Sistema:', loc09?.quantidadeSistema);
  console.log('Trava conferido?', trava?.conferido, 'Contada:', trava?.quantidadeContada, 'Sistema:', trava?.quantidadeSistema);
  console.log('11605 conferido?', b11605?.conferido, 'Contada:', b11605?.quantidadeContada, 'Sistema:', b11605?.quantidadeSistema);
}

main().catch(console.error).finally(() => prisma.$disconnect());
