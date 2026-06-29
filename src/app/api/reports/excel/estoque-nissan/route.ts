import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { nissanTemplate, locadorasTemplate } from './templates';

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    // Buscar o último inventário concluído para puxar as quantidades exatas daquela contagem
    const latestInventory = await prisma.inventory.findFirst({
      where: { status: 'CONCLUIDO' },
      orderBy: { finalizadoEm: 'desc' },
      include: {
        items: {
          select: {
            conferido: true,
            quantidadeContada: true,
            quantidadeSistema: true,
            product: {
              select: { codigo: true }
            }
          }
        }
      }
    });

    if (!latestInventory) {
      return new Response('Nenhum inventário concluído encontrado', { status: 404 });
    }

    // Criar um mapa (dicionário) para busca rápida da quantidade pelo código, e um Set para itens auditados
    const qtyMap = new Map();
    const auditedSet = new Set();
    latestInventory.items.forEach(item => {
      if (item.conferido) {
        qtyMap.set(item.product.codigo, item.quantidadeContada);
        auditedSet.add(item.product.codigo);
      }
    });

    const inventoryDate = latestInventory.finalizadoEm ? new Date(latestInventory.finalizadoEm) : new Date(latestInventory.iniciadoEm);
    const labelDate = inventoryDate.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const labelTime = String(inventoryDate.getHours()).padStart(2, '0') + '-' + String(inventoryDate.getMinutes()).padStart(2, '0');
    const filename = `planilha_nissan_${labelDate}_${labelTime}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockPRO';

    // Carregar imagens (Logos)
    let nissanLogoId: number | null = null;
    let seseLogoId: number | null = null;

    try {
      const nissanPath = path.join(process.cwd(), 'public', 'nissan.png');
      const sesePath = path.join(process.cwd(), 'public', 'sese.png');

      if (fs.existsSync(nissanPath)) {
        nissanLogoId = workbook.addImage({
          buffer: fs.readFileSync(nissanPath) as any,
          extension: 'png',
        });
      }

      if (fs.existsSync(sesePath)) {
        seseLogoId = workbook.addImage({
          buffer: fs.readFileSync(sesePath) as any,
          extension: 'png',
        });
      }
    } catch (e) {
      console.log('Logos not found or error loading them', e);
    }

    const createSheet = (sheetName: string, rawItems: any[]) => {
      // Filtrar para mostrar apenas os itens que foram auditados no inventário
      const items = rawItems.filter(p => auditedSet.has(p.codigo));
      const sheet = workbook.addWorksheet(sheetName);

      // ========== CABEÇALHO PRINCIPAL (Linhas 1-2) ==========
      sheet.mergeCells('A1:E2');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'Estoque VPC';
      titleCell.font = { bold: true, size: 18, color: { argb: 'FF000000' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5BC0DE' } }; // Azul Ciano
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.getRow(1).height = 25;
      sheet.getRow(2).height = 25;

      for (let col = 1; col <= 5; col++) {
        const cell1 = sheet.getCell(1, col);
        const cell2 = sheet.getCell(2, col);
        cell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5BC0DE' } };
        cell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5BC0DE' } };
      }

      if (seseLogoId !== null) {
        sheet.addImage(seseLogoId, { tl: { col: 0.1, row: 0.2 }, ext: { width: 120, height: 45 } });
      }
      if (nissanLogoId !== null) {
        sheet.addImage(nissanLogoId, { tl: { col: 4.3, row: 0.2 }, ext: { width: 70, height: 45 } });
      }

      sheet.columns = [
        { header: 'Codigo', key: 'codigo', width: 22 },
        { header: 'Produto', key: 'produto', width: 45 },
        { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Saldo Atual', key: 'saldoAtual', width: 15 },
      ];

      const headerRow = sheet.getRow(3);
      headerRow.values = ['Codigo', 'Produto', 'Modelo', 'Cliente', 'Saldo Atual'];
      headerRow.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Verde
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      });

      sheet.autoFilter = { from: 'A3', to: `E${Math.max(4, items.length + 3)}` };

      items.forEach((p, index) => {
        const row = sheet.addRow({
          codigo: p.codigo,
          produto: p.produto,
          modelo: p.modelo,
          cliente: p.cliente,
          saldoAtual: qtyMap.get(p.codigo) ?? 0, // Saldo atual do banco (se não existir é 0)
        });

        const isEven = index % 2 === 0;

        row.eachCell((cell) => {
          if (!isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF5BC0DE' } },
            left: { style: 'thin', color: { argb: 'FF5BC0DE' } },
            bottom: { style: 'thin', color: { argb: 'FF5BC0DE' } },
            right: { style: 'thin', color: { argb: 'FF5BC0DE' } },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });
    };

    // Usar os templates fixos e imutáveis exatamente como na imagem
    createSheet('Nissan', nissanTemplate);
    createSheet('Locadoras', locadorasTemplate);

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
