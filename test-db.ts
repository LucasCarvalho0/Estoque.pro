import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestInventory = await prisma.inventory.findFirst({
    where: { status: 'CONCLUIDO' },
    orderBy: { finalizadoEm: 'desc' },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!latestInventory) {
    console.log('No inventory found');
    return;
  }

  console.log(`Inventory ID: ${latestInventory.id}, Finished: ${latestInventory.finalizadoEm}`);

  const item11605 = latestInventory.items.find(i => i.product.codigo === 'BRPRT 11605');
  const item11608 = latestInventory.items.find(i => i.product.codigo === 'BRPRT 11608');
  const itemMOV05 = latestInventory.items.find(i => i.product.codigo === 'MOV05');

  console.log('BRPRT 11605:', item11605 ? `Contada: ${item11605.quantidadeContada}, Sistema: ${item11605.quantidadeSistema}` : 'Not found');
  console.log('BRPRT 11608:', item11608 ? `Contada: ${item11608.quantidadeContada}, Sistema: ${item11608.quantidadeSistema}` : 'Not found');
  console.log('MOV05:', itemMOV05 ? `Contada: ${itemMOV05.quantidadeContada}, Sistema: ${itemMOV05.quantidadeSistema}` : 'Not found');
  
  // also get product current quantity
  const p11605 = await prisma.product.findUnique({ where: { codigo: 'BRPRT 11605' } });
  const p11608 = await prisma.product.findUnique({ where: { codigo: 'BRPRT 11608' } });
  const pMOV05 = await prisma.product.findUnique({ where: { codigo: 'MOV05' } });
  
  console.log('Product BRPRT 11605 qty:', p11605?.quantidade);
  console.log('Product BRPRT 11608 qty:', p11608?.quantidade);
  console.log('Product MOV05 qty:', pMOV05?.quantidade);
}

main().catch(console.error).finally(() => prisma.$disconnect());
