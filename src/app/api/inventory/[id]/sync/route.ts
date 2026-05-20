import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, serverError } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { id } = params;

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { items: { select: { productId: true } } },
    });

    if (!inventory) return badRequest('Inventário não encontrado');
    if (inventory.status !== 'EM_ANDAMENTO') {
      return badRequest('Apenas inventários em andamento podem ser sincronizados');
    }

    const currentItems = await prisma.inventoryItem.findMany({
      where: { inventoryId: id },
      include: { product: { select: { id: true, quantidade: true } } },
    });

    let updatedCount = 0;
    // Atualizar a quantidadeSistema dos itens que já estão no inventário
    for (const item of currentItems) {
      if (item.quantidadeSistema !== item.product.quantidade) {
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: { 
            quantidadeSistema: item.product.quantidade,
            // Recalcular a divergência baseada no novo quantidadeSistema se o item já foi conferido
            divergencia: item.conferido ? item.quantidadeContada - item.product.quantidade : 0
          },
        });
        updatedCount++;
      }
    }

    const currentProductIds = currentItems.map((i) => i.productId);

    // Buscar produtos ativos que ainda não estão no inventário
    const missingProducts = await prisma.product.findMany({
      where: {
        ativo: true,
        id: { notIn: currentProductIds },
      },
      select: { id: true, quantidade: true },
    });

    if (missingProducts.length > 0) {
      // Adicionar os itens faltantes
      await prisma.inventoryItem.createMany({
        data: missingProducts.map((p) => ({
          inventoryId: id,
          productId: p.id,
          quantidadeSistema: p.quantidade,
          quantidadeContada: 0,
          divergencia: 0,
          conferido: false,
        })),
      });
    }

    await registrarLog({
      action: 'USUARIO_EDITADO',
      descricao: `Sincronização de inventário ${id}: ${missingProducts.length} novos itens adicionados, ${updatedCount} estoques atualizados.`,
      entidade: 'Inventory',
      entidadeId: id,
      userId: user.id,
    });

    return Response.json({
      message: `${missingProducts.length} novos itens adicionados com sucesso`,
      added: missingProducts.length,
    });
  } catch (e) {
    return serverError('Erro ao sincronizar inventário', e);
  }
}

export const dynamic = 'force-dynamic';
