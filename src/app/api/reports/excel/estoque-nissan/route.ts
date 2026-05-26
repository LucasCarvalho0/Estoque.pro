import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const products = await prisma.product.findMany({
      where: { ativo: true },
      include: { cliente: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });

    const now = new Date();
    const labelDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const labelTime = String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
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

    const createSheet = (sheetName: string, items: typeof products) => {
      const sheet = workbook.addWorksheet(sheetName);

      // Cabeçalho Principal (Estilo Planilha Nissan)
      sheet.mergeCells('A1:E2');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'Estoque VPC';
      titleCell.font = { bold: true, size: 18, color: { argb: 'FF000000' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5BC0DE' } }; // Azul Ciano
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.getRow(1).height = 25;
      sheet.getRow(2).height = 25;

      // Adicionar logos
      if (seseLogoId !== null) {
        sheet.addImage(seseLogoId, {
          tl: { col: 0.1, row: 0.2 },
          ext: { width: 120, height: 45 },
        });
      }
      if (nissanLogoId !== null) {
        sheet.addImage(nissanLogoId, {
          tl: { col: 4.3, row: 0.2 },
          ext: { width: 70, height: 45 },
        });
      }

      sheet.columns = [
        { header: 'Codigo', key: 'codigo', width: 22 },
        { header: 'Produto', key: 'produto', width: 45 },
        { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Saldo Atual', key: 'quantidade', width: 15 },
      ];

      // Auto-filtro na linha de cabeçalho
      sheet.autoFilter = {
        from: 'A3',
        to: `E${Math.max(4, items.length + 3)}`,
      };

      // Estilo da linha de cabeçalho
      const headerRow = sheet.getRow(3);
      headerRow.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Verde
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      items.forEach((p, index) => {
        const row = sheet.addRow({
          codigo: p.codigo,
          produto: p.nome,
          modelo: p.modelo,
          cliente: p.cliente?.nome ?? 'NISSAN',
          quantidade: p.quantidade,
        });

        const isEven = index % 2 === 0;
        
        row.eachCell((cell) => {
          // Cores alternadas: branco e azul claro
          if (!isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
          }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF5BC0DE' } },
            left: { style: 'thin', color: { argb: 'FF5BC0DE' } },
            bottom: { style: 'thin', color: { argb: 'FF5BC0DE' } },
            right: { style: 'thin', color: { argb: 'FF5BC0DE' } }
          };
          
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });
    };

    // Separar os produtos em duas listas baseado no cliente
    const nissanProducts = products.filter(p => {
      const clienteStr = (p.cliente?.nome ?? 'NISSAN').toUpperCase();
      return clienteStr.includes('NISSAN') || clienteStr.includes('FROTA');
    });

    const locadorasProducts = products.filter(p => {
      const clienteStr = (p.cliente?.nome ?? 'NISSAN').toUpperCase();
      return !(clienteStr.includes('NISSAN') || clienteStr.includes('FROTA'));
    });

    createSheet('Nissan', nissanProducts);
    createSheet('Locadoras', locadorasProducts);

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
