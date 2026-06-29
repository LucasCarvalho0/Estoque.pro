import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, serverError } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const tipo = req.nextUrl.searchParams.get('tipo');

    if (tipo === 'ativo') {
      const inv = await prisma.inventory.findFirst({
        where: { status: 'EM_ANDAMENTO' },
        include: {
          user: { select: { nome: true, matricula: true } },
          items: { include: { product: { select: { id: true, codigo: true, nome: true, unidade: true } } } },
        },
      });
      return Response.json(inv);
    }

    if (tipo === 'historico') {
      const historico = await prisma.inventory.findMany({
        where: { status: 'CONCLUIDO' },
        include: { user: { select: { nome: true, matricula: true } }, _count: { select: { items: true } } },
        orderBy: { finalizadoEm: 'desc' },
      });
      return Response.json(historico);
    }

    const inventories = await prisma.inventory.findMany({
      include: { user: { select: { nome: true, matricula: true } }, _count: { select: { items: true } } },
      orderBy: { iniciadoEm: 'desc' },
    });
    return Response.json(inventories);
  } catch (e) {
    return serverError('Erro ao buscar inventários', e);
  }
}

export async function POST(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { responsavel, matricula } = await req.json();
    if (!responsavel || !matricula) return badRequest('Responsável e matrícula são obrigatórios');

    // Controle de concorrência: apenas 1 inventário ativo
    const ativo = await prisma.inventory.findFirst({ where: { status: 'EM_ANDAMENTO' } });
    if (ativo) return badRequest('Já existe um inventário em andamento. Finalize-o antes de iniciar outro.');

    const products = await prisma.product.findMany({ where: { ativo: true }, select: { id: true, quantidade: true } });

    // Buscar o último inventário concluído para usar as quantidades contadas como ponto de partida
    const ultimoInventario = await prisma.inventory.findFirst({
      where: { status: 'CONCLUIDO' },
      orderBy: { finalizadoEm: 'desc' },
      include: {
        items: { select: { productId: true, quantidadeContada: true, conferido: true } },
      },
    });

    // Mapa: productId → quantidadeContada do último inventário (apenas itens conferidos)
    const ultimoInventarioMap = new Map<string, number>();
    if (ultimoInventario) {
      for (const item of ultimoInventario.items) {
        if (item.conferido) {
          ultimoInventarioMap.set(item.productId, item.quantidadeContada);
        }
      }
    }

    const inventory = await prisma.inventory.create({
      data: {
        responsavel,
        matricula,
        userId: user.id,
        items: {
          create: products.map((p) => ({
            productId: p.id,
            // Se o produto existia no último inventário (conferido), usa aquela contagem como base.
            // Caso contrário, usa a quantidade atual do produto no banco.
            quantidadeSistema: ultimoInventarioMap.has(p.id) ? ultimoInventarioMap.get(p.id)! : p.quantidade,
            quantidadeContada: 0,
            divergencia: 0,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { id: true, codigo: true, nome: true, unidade: true } } } },
      },
    });

    await registrarLog({
      action: 'INVENTARIO_INICIADO',
      descricao: `Inventário iniciado por ${responsavel} (Mat. ${matricula})`,
      entidade: 'Inventory',
      entidadeId: inventory.id,
      userId: user.id,
    });

    return Response.json(inventory, { status: 201 });
  } catch (e) {
    return serverError('Erro ao criar inventário', e);
  }
}

export const dynamic = 'force-dynamic';
