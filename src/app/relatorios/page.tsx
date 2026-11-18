'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageHeader } from '@/components/ui';
import { reportsService } from '@/services';
import { useInventoryHistorico } from '@/hooks';
import { FileText, Table, Download, Calendar, FileSpreadsheet } from 'lucide-react';

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
      key: 'movimentacoes', 
      icon: <FileText size={20} className="text-blue-400" />,
      label: 'Relatório de Movimentações', 
      desc: 'Entradas e saídas de materiais com operadores e datas por período customizado.',
      actions: [
        { key: 'mov-pdf', label: 'PDF', icon: <Download size={13} />, variant: 'secondary' as const, onClick: () => handle('mov-pdf', () => reportsService.pdfMovimentos(startDate, endDate), `movimentacoes-${startDate}-${endDate}.pdf`) },
        { key: 'mov-xlsx', label: 'Excel (XLSX)', icon: <Download size={13} />, variant: 'primary' as const, onClick: () => handle('mov-xlsx', () => reportsService.excelMovimentacao({ startDate, endDate }), `movimentacoes-${startDate}-${endDate}.xlsx`) },
      ]
    },
    {
      key: 'estoque', 
      icon: <Table size={20} className="text-emerald-400" />,
      label: 'Posição Geral de Estoque', 
      desc: 'Snapshot em tempo real com saldos, pontos de pedido e status de segurança de todos os SKUs.',
      actions: [
        { key: 'est-xlsx', label: 'Exportar Planilha Completa', icon: <Download size={13} />, variant: 'primary' as const, onClick: () => handle('est-xlsx', reportsService.excelEstoque, 'posicao-estoque.xlsx') },
      ]
    },
    {
      key: 'nissan', 
      icon: <FileSpreadsheet size={20} className="text-blue-400" />,
      label: 'Planilha Padrão Nissan', 
      desc: 'Relação de componentes automotivos e chicotes no formato e layout padronizado Nissan.',
      actions: [
        { key: 'nissan-xlsx', label: 'Exportar Formato Nissan', icon: <Download size={13} />, variant: 'primary' as const, onClick: () => handle('nissan-xlsx', reportsService.excelEstoqueNissan, 'planilha-nissan.xlsx') },
      ]
    },
    {
      key: 'inv-semanais', 
      icon: <Table size={20} className="text-amber-400" />,
      label: 'Inventários Semanais Consolidados', 
      desc: 'Consolidação de auditorias com abas organizadas por ciclos semanais.',
      actions: [
        { key: 'inv-xlsx', label: 'Exportar Consolidado Semanal', icon: <Download size={13} />, variant: 'primary' as const, onClick: () => handle('inv-xlsx', reportsService.excelInventarios, 'inventarios-semanais.xlsx') },
      ]
    },
    {
      key: 'inv-atual', 
      icon: <FileText size={20} className="text-rose-400" />,
      label: 'Último Fechamento de Inventário', 
      desc: 'Ata completa com auditor responsável, divergências identificadas e saldos apurados.',
      actions: [
        { key: 'inv-pdf', label: 'Emitir Laudo em PDF', icon: <Download size={13} />, variant: 'secondary' as const, onClick: () => historico[0] ? handle('inv-pdf', () => reportsService.pdfInventario(historico[0].id), `inventario-${historico[0].id}.pdf`) : alert('Nenhum inventário concluído encontrado') },
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader 
          title="Central de Relatórios Corporativos" 
          subtitle="Exportação analítica de dados operacionais, inventários e documentação fiscal" 
        />

        {/* Filtro de Período */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Calendar size={16} className="text-blue-400" />
              Parâmetro de Data para Relatórios Periódicos
            </CardTitle>
          </CardHeader>
          <div className="p-4 sm:p-5 flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Data Inicial</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none text-white focus:border-blue-500" 
              />
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Data Final</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none text-white focus:border-blue-500" 
              />
            </div>
            <p className="text-xs text-slate-400 self-end pb-1.5">
              Aplicado automaticamente na exportação de movimentações e conciliações.
            </p>
          </div>
        </Card>

        {/* Grade de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generalReports.map((report) => (
            <Card key={report.key} className="flex flex-col justify-between">
              <div className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                  {report.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{report.label}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{report.desc}</p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-wrap gap-2">
                {report.actions.map((act) => (
                  <Button 
                    key={act.key} 
                    size="sm" 
                    variant={act.variant} 
                    onClick={act.onClick} 
                    loading={loading === act.key} 
                    className="flex-1 text-xs gap-1.5"
                  >
                    {loading !== act.key && act.icon}
                    {act.label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Fechamentos de Inventário */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Documentos de Inventário</CardTitle>
            <Badge variant="blue">{historico.length} auditorias concluídas</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="px-5 py-3">Data e Hora</th>
                  <th className="px-4 py-3">Auditor Responsável</th>
                  <th className="px-4 py-3">Itens Verificados</th>
                  <th className="px-4 py-3 text-right">Documentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historico.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{new Date(inv.iniciadoEm).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[11px] text-slate-400 font-mono-custom">
                        {new Date(inv.iniciadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">
                      <p className="font-semibold text-white">{inv.responsavel}</p>
                      <p className="text-[11px] text-slate-400 font-mono-custom">Mat. {inv.matricula}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono-custom text-slate-200 font-semibold">{inv._count?.items ?? '0'} SKUs</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs gap-1"
                          loading={loading === `inv-pdf-${inv.id}`}
                          onClick={() => handle(
                            `inv-pdf-${inv.id}`,
                            () => reportsService.pdfInventario(inv.id),
                            `inventario-${new Date(inv.iniciadoEm).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
                          )}
                        >
                          <Download size={13} className="text-rose-400" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs gap-1"
                          loading={loading === `inv-xls-${inv.id}`}
                          onClick={() => handle(
                            `inv-xls-${inv.id}`,
                            () => reportsService.excelInventario(inv.id),
                            `inventario-${new Date(inv.iniciadoEm).toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`,
                          )}
                        >
                          <Download size={13} className="text-emerald-400" /> Excel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {historico.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-300">
                      Nenhum inventário concluído registrado.
                    </td>
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
