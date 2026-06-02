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

  if (!latestInventory) return;

  let products = latestInventory.items.map(item => ({
    codigo: item.product.codigo,
    nome: item.product.nome,
  }));

  products.sort((a, b) => a.nome.localeCompare(b.nome));

  console.log('--- DEFAULT LOCALE COMPARE ---');
  for (let i = 0; i < 15; i++) {
    console.log(products[i].nome);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
