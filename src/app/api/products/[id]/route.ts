import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, notFound, serverError, hasRole } from '@/lib/auth';
import { verificarAlerta, registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        cliente: true,
        alerts: { where: { status: 'ATIVO' } },
        movements: { orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { nome: true } } } },
      },
    });
    if (!product || !product.ativo) return notFound('Produto não encontrado');
    return Response.json(product);
  } catch (e) {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR'))
      return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();

    if (body._action === 'deactivate') {
      const product = await prisma.product.update({ where: { id: params.id }, data: { ativo: false } });
      await registrarLog({ action: 'PRODUTO_EDITADO', descricao: `Produto "${product.nome}" desativado`, entidade: 'Product', entidadeId: params.id, userId: user.id });
      return Response.json({ message: 'Produto desativado' });
    }

    if (body._action === 'transfer_ng') {
      const { quantidade, observacao } = body;
      const current = await prisma.product.findUnique({ where: { id: params.id } });
      if (!current || current.quantidade < quantidade) {
        return Response.json({ message: 'Estoque limpo insuficiente para transferência' }, { status: 400 });
      }
      
      const product = await prisma.product.update({ 
        where: { id: params.id }, 
        data: { 
          quantidade: current.quantidade - quantidade,
          quantidadeNG: current.quantidadeNG + quantidade 
        } 
      });
      await registrarLog({ 
        action: 'PRODUTO_EDITADO', 
        descricao: `-${quantidade} "${product.nome}" movido para sucata. ${observacao || ''}`, 
        entidade: 'Product', 
        entidadeId: params.id, 
        userId: user.id 
      });
      return Response.json(product);
    }

    const { _action, ...data } = body;
    const product = await prisma.product.update({
      where: { id: params.id },
      data,
      include: {
        supplier: { select: { id: true, nome: true } },
        cliente: { select: { id: true, nome: true } },
      },
    });

    await registrarLog({ action: 'PRODUTO_EDITADO', descricao: `Produto "${product.nome}" atualizado`, entidade: 'Product', entidadeId: params.id, userId: user.id });
    await verificarAlerta(params.id);
    return Response.json(product);
  } catch (e) {
    return serverError();
  }
}

export const dynamic = 'force-dynamic';
