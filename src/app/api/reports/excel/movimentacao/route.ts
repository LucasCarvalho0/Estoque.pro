import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';
import ExcelJS from 'exceljs';

// Azul idêntico ao da imagem (cabeçalho da planilha)
const BLUE_HEADER = 'FF1565C0';   // azul vivo
const WHITE_TEXT  = 'FFFFFFFF';
const BORDER_COLOR = 'FFBDBDBD'; // cinza claro para bordas internas

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type        = searchParams.get('type')      ?? undefined;
    const startDateStr = searchParams.get('startDate') ?? undefined;
    const endDateStr   = searchParams.get('endDate')   ?? undefined;
    const clienteId   = searchParams.get('clienteId') ?? undefined;

    let dateFilter: any = {};
    if (startDateStr && endDateStr) {
      dateFilter = {
        createdAt: {
          gte: new Date(`${startDateStr}T00:00:00.000Z`),
          lte: new Date(`${endDateStr}T23:59:59.999Z`),
        },
      };
    } else {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      dateFilter = {
        createdAt: {
          gte: startOfYear,
        },
      };
    }

    const movements = await prisma.movement.findMany({
      where: {
        ...(type      && { type: type as any }),
        ...dateFilter,
        ...(clienteId && { product: { clienteId } }),
        NOT: {
          OR: [
            { observacao: { contains: 'invent', mode: 'insensitive' } },
            { notaFiscal: { contains: 'invent', mode: 'insensitive' } },
          ],
        },
      },
      include: {
        product: {
          select: {
            codigo: true, nome: true, modelo: true,
            cliente: { select: { nome: true } },
          },
        },
        user: { select: { nome: true, matricula: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // ── Workbook ────────────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockPRO';

    const sheet = workbook.addWorksheet('Movimentacoes');

    // ── Colunas (sem row de título — igual ao print) ─────────────────────
    sheet.columns = [
      { key: 'dataHora',    width: 20 },
      { key: 'tipo',        width: 12 },
      { key: 'codigo',      width: 14 },
      { key: 'produto',     width: 36 },
      { key: 'quantidade',  width: 14 },
      { key: 'modelo',      width: 18 },
      { key: 'cliente',     width: 28 },
      { key: 'ng',          width: 16 },
    ];

    // ── Linha de cabeçalho (row 1) ───────────────────────────────────────
    const HEADERS = [
      'Data e Hora', 'Tipo', 'Codigo', 'Produto',
      'Quantidade', 'Modelo', 'Cliente', 'NG',
    ];

    const headerRow = sheet.addRow(HEADERS);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.value    = cell.value;         // mantém o texto
      cell.font     = { bold: true, color: { argb: WHITE_TEXT }, size: 10, name: 'Calibri' };
      cell.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
      cell.border   = {
        top:    { style: 'thin', color: { argb: BORDER_COLOR } },
        left:   { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right:  { style: 'thin', color: { argb: BORDER_COLOR } },
      };
    });

    // AutoFilter — ícone de ▼ em cada coluna (igual ao Excel do print)
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to:   { row: 1, column: HEADERS.length },
    };

    // ── Linhas de dados ──────────────────────────────────────────────────
    for (const m of movements) {
      const dt = new Date(m.createdAt);
      const dataHora =
        dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const row = sheet.addRow({
        dataHora,
        tipo:       m.type === 'ENTRADA' ? 'Entrada' : 'Saída',
        codigo:     m.product?.codigo ?? '',
        produto:    m.product?.nome   ?? '',
        quantidade: m.quantidade,
        modelo:     m.product?.modelo || '-',
        cliente:    m.product?.cliente?.nome || '-',
        ng:         m.notaFiscal || '-',
      });

      row.height = 18;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font      = { size: 10, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border    = {
          top:    { style: 'hair', color: { argb: BORDER_COLOR } },
          left:   { style: 'hair', color: { argb: BORDER_COLOR } },
          bottom: { style: 'hair', color: { argb: BORDER_COLOR } },
          right:  { style: 'hair', color: { argb: BORDER_COLOR } },
        };
      });

      // Produto: alinhado à esquerda (mais legível)
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };

      // Tipo colorido
      const tipoCell = row.getCell(2);
      tipoCell.font = {
        size: 10, name: 'Calibri', bold: false,
        color: { argb: m.type === 'ENTRADA' ? 'FF1B5E20' : 'FFB71C1C' },
      };

      // Quantidade colorida
      const qtyCell = row.getCell(5);
      qtyCell.font = {
        size: 10, name: 'Calibri', bold: true,
        color: { argb: m.type === 'ENTRADA' ? 'FF1B5E20' : 'FFB71C1C' },
      };
    }

    // ── Gerar buffer e retornar ──────────────────────────────────────────
    const now      = new Date();
    const label    = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `movimentacao_${label}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error('[EXCEL MOVIMENTACAO] Erro:', e?.message || e);
    return serverError('Erro ao gerar relatório Excel', e);
  }
}

export const dynamic = 'force-dynamic';
