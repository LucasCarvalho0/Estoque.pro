import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest) {
  headers();
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const gte = startDateStr ? new Date(`${startDateStr}T00:00:00.000Z`) : new Date(new Date().setDate(1));
    const lte = endDateStr ? new Date(`${endDateStr}T23:59:59.999Z`) : new Date();

    const movements = await prisma.movement.findMany({
      where: {
        createdAt: { gte, lte },
        AND: [
          {
            OR: [
              { observacao: { not: { contains: 'invent' } } },
              { observacao: null },
            ],
          },
          {
            OR: [
              { notaFiscal: { not: { contains: 'invent' } } },
              { notaFiscal: null },
            ],
          },
        ],
      },
      include: {
        product: { select: { codigo: true, nome: true, unidade: true } },
        user: { select: { nome: true, matricula: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const filename = `movimentacoes_${day}-${month}-${year}_${hours}-${minutes}.pdf`;

    return new Promise<Response>((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        resolve(new Response(Buffer.concat(chunks), {
          headers: { 
            'Content-Type': 'application/pdf', 
            'Content-Disposition': `attachment; filename="${filename}"` 
          },
        }));
      });

      const colors = {
        primary: '#1e293b',
        success: '#059669',
        danger: '#dc2626',
        neutral: '#64748b',
        border: '#e2e8f0',
      };

      const drawLine = (yPos: number) => {
        doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor(colors.border).lineWidth(0.5).stroke();
      };

      // Header
      doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.primary).text('StockPRO — Relatório de Movimentações', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor(colors.neutral)
        .text(`Período analisado: ${gte.toLocaleDateString('pt-BR')} a ${lte.toLocaleDateString('pt-BR')}`, { align: 'center' })
        .text(`Total de registros: ${movements.length}`, { align: 'center' });
      
      doc.moveDown(1.5);
      drawLine(doc.y);
      doc.moveDown(0.5);

      const colWidths = [45, 50, 110, 60, 65, 110, 75];
      const colOffsets = [40, 85, 135, 245, 305, 370, 480];
      const headers = ['Operação', 'Código', 'Produto', 'Volume', 'Doc. Ref', 'Responsável', 'Timestamp'];
      
      let y = doc.y;

      const renderTableHeaders = () => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.neutral);
        headers.forEach((h, i) => {
          doc.text(h, colOffsets[i], y, { width: colWidths[i] });
        });
        y += 12;
        drawLine(y);
        y += 8;
      };

      renderTableHeaders();

      doc.font('Helvetica').fontSize(8);
      for (const mov of movements) {
        const textHeights = [
          doc.heightOfString(mov.product.nome, { width: colWidths[2] }),
          doc.heightOfString(`${mov.user.nome} (${mov.user.matricula})`, { width: colWidths[5] })
        ];
        const rowHeight = Math.max(...textHeights, 14) + 6;

        if (y + rowHeight > 780) { 
          doc.addPage(); 
          y = 40; 
          renderTableHeaders(); 
          doc.font('Helvetica').fontSize(8);
        }

        doc.fillColor(mov.type === 'ENTRADA' ? colors.success : colors.danger)
          .font('Helvetica-Bold').text(mov.type, colOffsets[0], y, { width: colWidths[0] });
        
        doc.fillColor(colors.neutral).font('Helvetica-Bold')
          .text(mov.product.codigo, colOffsets[1], y, { width: colWidths[1] });

        doc.fillColor(colors.primary).font('Helvetica')
          .text(mov.product.nome, colOffsets[2], y, { width: colWidths[2] });
        
        doc.font('Helvetica-Bold')
          .text(`${mov.type === 'ENTRADA' ? '+' : '-'}${mov.quantidade} ${mov.product.unidade}`, colOffsets[3], y, { width: colWidths[3] });
        
        doc.font('Helvetica')
          .text(mov.notaFiscal ?? 'S/ REG', colOffsets[4], y, { width: colWidths[4] });
        
        doc.text(`${mov.user.nome} (${mov.user.matricula})`, colOffsets[5], y, { width: colWidths[5] });
        
        doc.text(new Date(mov.createdAt).toLocaleString('pt-BR'), colOffsets[6], y, { width: colWidths[6] });
        
        y += rowHeight;
        drawLine(y - 3);
        y += 3;
      }

      doc.moveDown(2);
      doc.fontSize(7).fillColor(colors.neutral).text(`Relatório de tráfego de ativos gerado eletronicamente pelo StockPRO.`, { align: 'center' });
      doc.text(`Gerado em ${now.toLocaleString('pt-BR')}`, { align: 'center' });
      doc.end();
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export const dynamic = 'force-dynamic';
