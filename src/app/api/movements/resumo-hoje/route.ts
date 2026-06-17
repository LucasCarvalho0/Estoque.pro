import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const [entradas, saidas] = await Promise.all([
      prisma.movement.count({
        where: {
          type: 'ENTRADA',
          createdAt: { gte: hoje, lt: amanha },
          NOT: {
            OR: [
              { observacao: { contains: 'invent', mode: 'insensitive' } },
              { notaFiscal: { contains: 'invent', mode: 'insensitive' } },
            ],
          },
        },
      }),
      prisma.movement.count({
        where: {
          type: 'SAIDA',
          createdAt: { gte: hoje, lt: amanha },
          NOT: {
            OR: [
              { observacao: { contains: 'invent', mode: 'insensitive' } },
              { notaFiscal: { contains: 'invent', mode: 'insensitive' } },
            ],
          },
        },
      }),
    ]);

    return Response.json({ entradas, saidas, total: entradas + saidas });
  } catch (e) {
    return serverError();
  }
}

export const dynamic = 'force-dynamic';
