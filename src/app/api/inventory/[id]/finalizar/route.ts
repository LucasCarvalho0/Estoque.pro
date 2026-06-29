import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, notFound, serverError } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const inventory = await prisma.inventory.findUnique({ where: { id: params.id } });
    if (!inventory) return notFound('Inventário não encontrado');
    if (inventory.status !== 'EM_ANDAMENTO') return badRequest('Inventário não está em andamento');

    const { items: rawItems } = await req.json();
    const items = (rawItems ?? []) as any[];

    await prisma.$transaction(async (tx) => {
      // OTIMIZAÇÃO: Carrega todos os dados necessários em lote para evitar centenas de consultas
      const existingItems = await tx.inventoryItem.findMany({
        where: { inventoryId: params.id }
      });

      const productIds = existingItems.map(i => i.productId);
      
      // Carrega todos os alertas ativos dos produtos envolvidos de uma só vez
      const activeAlerts = await tx.alert.findMany({
        where: { 
          productId: { in: productIds }, 
          status: 'ATIVO' 
        }
      });
      const activeAlertsSet = new Set(activeAlerts.map(a => a.productId));

      const itemsMap = new Map(existingItems.map(i => [i.productId, i]));

      for (const item of items) {
        if (!item.productId) continue;
        
        const invItem = itemsMap.get(item.productId);
        if (!invItem) continue;

        const parsedQtd = parseInt(item.quantidadeContada || 0);
        const qContada = isNaN(parsedQtd) ? 0 : parsedQtd;
        const divergencia = qContada - invItem.quantidadeSistema;
        
        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: { 
            quantidadeContada: qContada, 
            divergencia, 
            conferido: true, 
            observacao: item.observacao ?? null
          },
        });

        // BUG 2 FIX: Atualizar o estoque real do produto com o valor contado no inventário.
        // Isso garante que o saldo do sistema reflita a contagem física realizada.
        await tx.product.update({
          where: { id: item.productId },
          data: { quantidade: qContada },
        });

        // Lógica de Alerta otimizada (checa em memória)
        if (qContada < invItem.quantidadeSistema && !activeAlertsSet.has(item.productId)) {
          await tx.alert.create({
            data: {
              tipo: 'DIVERGENCIA_INVENTARIO',
              productId: item.productId,
              quantidadeAtual: qContada,
              quantidadeMinima: invItem.quantidadeSistema,
              status: 'ATIVO',
            },
          });
          // Adiciona ao set para evitar duplicados na mesma rodada se necessário
          activeAlertsSet.add(item.productId);
        }
      }


      await tx.inventory.update({
        where: { id: params.id },
        data: { status: 'CONCLUIDO', finalizadoEm: new Date() },
      });
    }, { timeout: 30000 }); // Aumenta timeout da transação para segurança

    await registrarLog({
      action: 'INVENTARIO_FINALIZADO',
      descricao: `Inventário finalizado por ${inventory.responsavel} (Mat. ${inventory.matricula}) - ${items.length} itens conferidos.`,
      entidade: 'Inventory',
      entidadeId: params.id,
      userId: user.id,
    });

    const updated = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: { select: { id: true, codigo: true, nome: true, unidade: true } } } } },
    });

    return Response.json(updated);
  } catch (e) {
    return serverError('Erro ao finalizar inventário', e);
  }
}

export const dynamic = 'force-dynamic';
