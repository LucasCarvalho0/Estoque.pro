import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestInventory = await prisma.inventory.findFirst({
    where: { status: 'CONCLUIDO' },
    orderBy: { finalizadoEm: 'desc' },
    include: {
      items: {
        include: {
          product: {
            include: {
              cliente: true
            }
          },
        },
      },
    },
  });

  if (!latestInventory) {
    console.log('Nenhum inventario');
    return;
  }

  const products = latestInventory.items.map(item => ({
    codigo: item.product.codigo,
    nome: item.product.nome,
    modelo: item.product.modelo,
    cliente: item.product.cliente,
    quantidade: item.quantidadeContada ?? item.quantidadeSistema,
  }));

  const p1 = products.find(p => p.codigo === 'BRPRT 11605');
  const p2 = products.find(p => p.codigo === 'BRPRT 11608');
  
  console.log('BRPRT 11605:', p1?.quantidade);
  console.log('BRPRT 11608:', p2?.quantidade);
}

main().catch(console.error).finally(() => prisma.$disconnect());
