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

    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type') ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;
    const clienteId = searchParams.get('clienteId') ?? undefined;

    const movements = await prisma.movement.findMany({
      where: {
        ...(type && { type: type as any }),
        ...(startDate && endDate && { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }),
        ...(clienteId && { product: { clienteId } }),
      },
      include: {
        product: {
          select: {
            id: true, codigo: true, nome: true, modelo: true, unidade: true,
            quantidadeNG: true,
            cliente: { select: { nome: true } },
          },
        },
        user: { select: { nome: true, matricula: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const labelDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const labelTime = String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
    const filename = `movimentacao_${labelDate}_${labelTime}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockPRO';

    // ========== ABA: EntradaSaida ==========
    const sheetES = workbook.addWorksheet('EntradaSaida');

    sheetES.mergeCells('A1:H1');
    const titleES = sheetES.getCell('A1');
    titleES.value = 'STOCKPRO — RELATÓRIO DE MOVIMENTAÇÃO';
    titleES.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    titleES.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleES.alignment = { horizontal: 'center', vertical: 'middle' };
    sheetES.getRow(1).height = 25;

    sheetES.columns = [
      { header: 'DATA E HORA', key: 'dataHora', width: 22 },
      { header: 'TIPO', key: 'tipo', width: 12 },
      { header: 'CÓDIGO', key: 'codigo', width: 15 },
      { header: 'PRODUTO', key: 'produto', width: 35 },
      { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
      { header: 'MODELO', key: 'modelo', width: 18 },
      { header: 'CLIENTE', key: 'cliente', width: 30 },
      { header: 'NG', key: 'ng', width: 10 },
    ];

    // Header row styling (row 2)
    const headerRow = sheetES.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      };
    });

    // Data rows
    for (const m of movements) {
      const dt = new Date(m.createdAt);
      const dataHora = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const row = sheetES.addRow({
        dataHora,
        tipo: m.type === 'ENTRADA' ? 'Entrada' : 'Saída',
        codigo: m.product?.codigo ?? '',
        produto: m.product?.nome ?? '',
        quantidade: m.quantidade,
        modelo: m.product?.modelo || '-',
        cliente: m.product?.cliente?.nome || '-',
        ng: m.notaFiscal || '-',
      });

      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        cell.alignment = { vertical: 'middle' };
      });

      // Color coding for type
      const tipoCell = row.getCell('tipo');
      if (m.type === 'ENTRADA') {
        tipoCell.font = { color: { argb: 'FF047857' }, bold: true };
      } else {
        tipoCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }

      // Quantity with sign color
      const qtyCell = row.getCell('quantidade');
      qtyCell.alignment = { horizontal: 'center' };
      if (m.type === 'ENTRADA') {
        qtyCell.font = { color: { argb: 'FF047857' }, bold: true };
      } else {
        qtyCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    }

    // ========== ABA: Movimentacao (resumo) ==========
    const sheetMov = workbook.addWorksheet('Movimentacao');

    sheetMov.mergeCells('A1:E1');
    const titleMov = sheetMov.getCell('A1');
    titleMov.value = 'RESUMO DE MOVIMENTAÇÃO';
    titleMov.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    titleMov.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleMov.alignment = { horizontal: 'center', vertical: 'middle' };
    sheetMov.getRow(1).height = 25;

    sheetMov.columns = [
      { header: 'MÉTRICA', key: 'metrica', width: 30 },
      { header: 'VALOR', key: 'valor', width: 20 },
    ];

    const headerMov = sheetMov.getRow(2);
    headerMov.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerMov.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { horizontal: 'center' };
    });

    const totalEntradas = movements.filter((m) => m.type === 'ENTRADA').length;
    const totalSaidas = movements.filter((m) => m.type === 'SAIDA').length;
    const qtdEntradas = movements.filter((m) => m.type === 'ENTRADA').reduce((acc, m) => acc + m.quantidade, 0);
    const qtdSaidas = movements.filter((m) => m.type === 'SAIDA').reduce((acc, m) => acc + m.quantidade, 0);

    const resumoRows = [
      { metrica: 'Total de Movimentações', valor: movements.length },
      { metrica: 'Entradas', valor: totalEntradas },
      { metrica: 'Saídas', valor: totalSaidas },
      { metrica: 'Quantidade Total Entrada', valor: qtdEntradas },
      { metrica: 'Quantidade Total Saída', valor: qtdSaidas },
      { metrica: 'Balanço Líquido', valor: qtdEntradas - qtdSaidas },
    ];

    for (const item of resumoRows) {
      const row = sheetMov.addRow(item);
      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        cell.alignment = { vertical: 'middle' };
      });
    }

    // Footer
    sheetES.addRow([]);
    const footerES = sheetES.addRow([`Relatório gerado em ${now.toLocaleString('pt-BR')} — StockPRO Gestão de Ativos`]);
    footerES.font = { italic: true, size: 8, color: { argb: 'FF64748B' } };
    sheetES.mergeCells(footerES.number, 1, footerES.number, 8);

    sheetMov.addRow([]);
    const footerMov = sheetMov.addRow([`Relatório gerado em ${now.toLocaleString('pt-BR')} — StockPRO Gestão de Ativos`]);
    footerMov.font = { italic: true, size: 8, color: { argb: 'FF64748B' } };
    sheetMov.mergeCells(footerMov.number, 1, footerMov.number, 2);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export const dynamic = 'force-dynamic';
