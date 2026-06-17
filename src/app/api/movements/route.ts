import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, serverError } from '@/lib/auth';
import { verificarAlerta, registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { searchParams } = req.nextUrl;
    const productId = searchParams.get('productId') ?? undefined;
    const type = searchParams.get('type') ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;
    const clienteId = searchParams.get('clienteId') ?? undefined;

    const movements = await prisma.movement.findMany({
      where: {
        ...(productId && { productId }),
        ...(type && { type: type as any }),
        ...(startDate && endDate && { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }),
        ...(clienteId && { product: { clienteId } }),
        NOT: {
          OR: [
            { observacao: { contains: 'invent', mode: 'insensitive' } },
            { notaFiscal: { contains: 'invent', mode: 'insensitive' } },
          ],
        },
      },
      include: {
        product: { select: { id: true, codigo: true, nome: true, modelo: true, unidade: true, cliente: { select: { id: true, nome: true } } } },
        user: { select: { id: true, nome: true, matricula: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return Response.json(movements);
  } catch (e) {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { type, quantidade, productId, notaFiscal, observacao } = await req.json();

    if (!type || !quantidade || !productId) return badRequest('type, quantidade e productId são obrigatórios');
    if (quantidade <= 0) return badRequest('Quantidade deve ser maior que zero');

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.ativo) return Response.json({ message: 'Produto não encontrado' }, { status: 404 });

    if (type === 'SAIDA' && product.quantidade < quantidade) {
      return badRequest(`Estoque insuficiente. Disponível: ${product.quantidade} ${product.unidade}`);
    }

    const novaQtd = type === 'ENTRADA' ? product.quantidade + quantidade : product.quantidade - quantidade;

    const [movement] = await prisma.$transaction([
      prisma.movement.create({
        data: { type, quantidade, productId, userId: user.id, notaFiscal, observacao },
        include: {
          product: { select: { codigo: true, nome: true, unidade: true } },
          user: { select: { nome: true, matricula: true } },
        },
      }),
      prisma.product.update({ where: { id: productId }, data: { quantidade: novaQtd } }),
    ]);

    const sinal = type === 'ENTRADA' ? '+' : '-';
    await registrarLog({
      action: type === 'ENTRADA' ? 'ENTRADA_REGISTRADA' : 'SAIDA_REGISTRADA',
      descricao: `${sinal}${quantidade} "${product.nome}"${notaFiscal ? ` · NF: ${notaFiscal}` : ''}`,
      entidade: 'Movement',
      entidadeId: movement.id,
      userId: user.id,
    });
    await verificarAlerta(productId);

    return Response.json(movement, { status: 201 });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export const dynamic = 'force-dynamic';
