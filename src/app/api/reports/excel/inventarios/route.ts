import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const inventories = await prisma.inventory.findMany({
      where: { status: 'CONCLUIDO' },
      include: {
        items: { include: { product: { select: { codigo: true, nome: true, unidade: true } } } },
      },
      orderBy: { finalizadoEm: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockPRO';
    workbook.created = new Date();

    // Aba resumo
    const resumo = workbook.addWorksheet('Resumo');
    resumo.columns = [
      { header: 'Data', key: 'data', width: 14 },
      { header: 'Hora', key: 'hora', width: 10 },
      { header: 'Responsável', key: 'responsavel', width: 25 },
      { header: 'Matrícula', key: 'matricula', width: 12 },
      { header: 'Total Itens', key: 'itens', width: 12 },
      { header: 'Com Divergência', key: 'diverg', width: 16 },
    ];
    resumo.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resumo.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1628' } };

    for (const inv of inventories) {
      resumo.addRow({
        data: new Date(inv.iniciadoEm).toLocaleDateString('pt-BR'),
        hora: new Date(inv.iniciadoEm).toLocaleTimeString('pt-BR'),
        responsavel: inv.responsavel,
        matricula: inv.matricula,
        itens: inv.items.length,
        diverg: inv.items.filter((i) => i.divergencia !== 0).length,
      });

      // Aba por inventário — desambiguar nomes duplicados (mesmo dia)
      const label = new Date(inv.iniciadoEm).toLocaleDateString('pt-BR').replace(/\//g, '-');
      let sheetName = `Inv ${label}`;
      let suffix = 2;
      while (workbook.getWorksheet(sheetName)) {
        sheetName = `Inv ${label} (${suffix})`;
        suffix++;
      }
      const sheet = workbook.addWorksheet(sheetName);
      sheet.columns = [
        { header: 'Código', key: 'codigo', width: 12 },
        { header: 'Produto', key: 'produto', width: 30 },
        { header: 'Qtd Sistema', key: 'sistema', width: 13 },
        { header: 'Qtd Contada', key: 'contada', width: 13 },
        { header: 'Divergência', key: 'diverg', width: 13 },
        { header: 'Unidade', key: 'unidade', width: 10 },
        { header: 'Observação', key: 'obs', width: 25 },
      ];
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3460' } };

      for (const item of inv.items) {
        const row = sheet.addRow({
          codigo: item.product.codigo,
          produto: item.product.nome,
          sistema: item.quantidadeSistema,
          contada: item.quantidadeContada,
          diverg: item.divergencia,
          unidade: item.product.unidade,
          obs: item.observacao ?? '',
        });
        if (item.divergencia !== 0) {
          row.getCell('diverg').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
          row.getCell('diverg').font = { color: { argb: 'FFDC2626' }, bold: true };
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="inventarios-semanais.xlsx"',
      },
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export const dynamic = 'force-dynamic';
