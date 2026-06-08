'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageHeader } from '@/components/ui';
import { reportsService } from '@/services';
import { useInventoryHistorico } from '@/hooks';
import { FileText, Table, Download } from 'lucide-react';

export default function RelatoriosPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: historico = [] } = useInventoryHistorico();

  const handle = async (key: string, fn: () => Promise<Blob>, filename: string) => {
    setLoading(key);
    try {
      const blob = await fn();
      reportsService.download(blob, filename);
    } catch { alert('Erro ao gerar relatório'); }
    finally { setLoading(null); }
  };

  const generalReports = [
    {
      key: 'movimentacoes', icon: <FileText size={20} className="text-blue-600" />, bg: '#eff6ff',
      label: 'Relatório de Movimentações', desc: 'Entradas e saídas com rastreabilidade completa por período.',
      actions: [
        { key: 'mov-pdf', label: 'Exportar PDF', icon: <Download size={14} />, variant: 'danger' as any, onClick: () => handle('mov-pdf', () => reportsService.pdfMovimentos(startDate, endDate), `movimentacoes-${startDate}-${endDate}.pdf`) },
        { key: 'mov-xlsx', label: 'Exportar Excel', icon: <Download size={14} />, variant: 'success' as any, onClick: () => handle('mov-xlsx', () => reportsService.excelMovimentacao({ startDate, endDate }), `movimentacoes-${startDate}-${endDate}.xlsx`) },
      ]
    },
    {
      key: 'estoque', icon: <Table size={20} className="text-emerald-600" />, bg: '#ecfdf5',
      label: 'Relatório de Estoque', desc: 'Snapshot atual do estoque com status e alertas destacados.',
      actions: [
        { key: 'est-xlsx', label: 'Exportar Excel', icon: <Download size={14} />, variant: 'success' as any, onClick: () => handle('est-xlsx', reportsService.excelEstoque, 'posicao-estoque.xlsx') },
      ]
    },
    {
      key: 'nissan', icon: <Table size={20} className="text-blue-700" />, bg: '#eff6ff',
      label: 'Planilha Padrão Nissan', desc: 'Relação de estoque no formato padronizado Nissan.',
      actions: [
        { key: 'nissan-xlsx', label: 'Exportar Excel', icon: <Download size={14} />, variant: 'success' as any, onClick: () => handle('nissan-xlsx', reportsService.excelEstoqueNissan, 'planilha-nissan.xlsx') },
      ]
    },
    {
      key: 'inv-semanais', icon: <Table size={20} className="text-teal-600" />, bg: '#f0fdfa',
      label: 'Inventários Semanais', desc: 'Todos os inventários em planilha consolidada com aba por semana.',
      actions: [
        { key: 'inv-xlsx', label: 'Exportar Excel', icon: <Download size={14} />, variant: 'success' as any, onClick: () => handle('inv-xlsx', reportsService.excelInventarios, 'inventarios-semanais.xlsx') },
      ]
    },
    {
      key: 'inv-atual', icon: <FileText size={20} className="text-red-500" />, bg: '#fef2f2',
      label: 'Último Inventário', desc: 'Inventário completo com responsável, data/hora e divergências.',
      actions: [
        { key: 'inv-pdf', label: 'Exportar PDF', icon: <Download size={14} />, variant: 'danger' as any, onClick: () => historico[0] ? handle('inv-pdf', () => reportsService.pdfInventario(historico[0].id), `inventario-${historico[0].id}.pdf`) : alert('Nenhum inventário concluído encontrado') },
      ]
    }
  ];

  const labelStyle = 'text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom';
  const inputStyle = 'px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-700';

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col gap-5">
        <PageHeader title="Central de Relatórios" subtitle="Exportação de dados e documentos" />

        {/* Filtro de período */}
        <Card>
          <CardHeader><CardTitle>Filtro de Período</CardTitle></CardHeader>
          <div className="flex flex-wrap items-end gap-4 p-5">
            <div className="flex flex-col gap-1">
              <label className={labelStyle}>Data Inicial</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputStyle} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelStyle}>Data Final</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputStyle} />
            </div>
            <p className="text-[12px] text-slate-400 pb-2">Aplicado automaticamente ao relatório de movimentações.</p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {generalReports.map((report) => (
            <Card key={report.key} className="flex flex-col">
              <div className="p-5 flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: report.bg }}>
                  {report.icon}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-800">{report.label}</h3>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{report.desc}</p>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex gap-2 bg-slate-50/50 rounded-b-2xl">
                {report.actions.map((act) => (
                  <Button key={act.key} size="sm" variant={act.variant} onClick={act.onClick} loading={loading === act.key} className="flex-1 shadow-sm">
                    {loading !== act.key && <span className="mr-1.5">{act.icon}</span>} {act.label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Exportação individual por inventário */}
        <Card>
          <CardHeader>
            <CardTitle>Inventários — Exportação Individual</CardTitle>
            <Badge variant="gray">{historico.length} registros</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Data / Hora', 'Responsável', 'Auditados', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono-custom">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historico.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-700">{new Date(inv.iniciadoEm).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[11px] text-slate-400 font-mono-custom">{new Date(inv.iniciadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-slate-900">{inv.responsavel}</span>
                        <span className="text-[11px] text-slate-400 font-mono-custom">Mat. {inv.matricula}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="blue" className="rounded-lg px-2.5 py-1 font-mono-custom text-[11px] bg-blue-50 text-blue-600 border-blue-100 italic">
                        {inv._count?.items ?? '0'} ITENS
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          className="h-9 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
                          loading={loading === `inv-pdf-${inv.id}`}
                          onClick={() => handle(
                            `inv-pdf-${inv.id}`,
                            () => reportsService.pdfInventario(inv.id),
                            `inventario-${new Date(inv.iniciadoEm).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
                          )}
                        >
                          <Download size={14} className="mr-1.5" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="success"
                          className="h-9 px-4 rounded-xl shadow-sm hover:shadow-md transition-all bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                          loading={loading === `inv-xls-${inv.id}`}
                          onClick={() => handle(
                            `inv-xls-${inv.id}`,
                            () => reportsService.excelInventario(inv.id),
                            `inventario-${new Date(inv.iniciadoEm).toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`,
                          )}
                        >
                          <Download size={14} className="mr-1.5" /> Excel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {historico.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-slate-400">Nenhum inventário concluído</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
