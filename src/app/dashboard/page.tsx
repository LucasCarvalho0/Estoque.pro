'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, Card, CardHeader, CardTitle, Badge, PageLoading, Button } from '@/components/ui';
import { 
  useProductStats, useAlertsResumo, useResumoHoje, 
  useMovements, useAlerts, useInventoryHistorico, 
  useSuppliers, useDashboardStats, useInventoryAtivo, useLogs
} from '@/hooks';
import { reportsService } from '@/services';
import { MovementsDetailModal } from '@/components/modals';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { 
  Package, AlertTriangle, 
  TrendingUp, History, FileText, FileSpreadsheet, 
  Users, ChevronRight, CheckCircle2, Clock, ShieldCheck, DatabaseBackup
} from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useProductStats();
  const { data: dashStats, isLoading: dashLoading } = useDashboardStats();
  const { data: alertsResumo } = useAlertsResumo();
  const { data: resumoHoje } = useResumoHoje();
  const { data: movements = [] } = useMovements();
  const { data: alertsAtivos = [] } = useAlerts('ATIVO');
  const { data: historico = [] } = useInventoryHistorico();
  const { data: invAtivo } = useInventoryAtivo();
  const { data: logs = [] } = useLogs();

  const getDuration = (start: string | Date, end: string | Date | null) => {
    if (!end) return '-';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = Math.floor((e - s) / 60000); 
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  const ultimoInv = historico[0];
  const isLoading = statsLoading || dashLoading;
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);

  if (isLoading) return <DashboardLayout><div className="p-8"><PageLoading /></div></DashboardLayout>;

  return (
    <>
    <DashboardLayout>
      <div className="flex flex-col gap-6 fade-in max-w-[1680px] mx-auto min-h-screen pb-12">
        
        {/* Cabeçalho Executivo */}
        <div className="enterprise-panel p-4 sm:p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Painel Geral de Estoque
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <span className="text-slate-500">•</span>
              <span>Monitoramento em tempo real</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              className="gap-2 text-xs flex-1 sm:flex-initial"
              onClick={async () => {
                try {
                  toast.loading('Gerando backup dos dados...');
                  const res = await fetch('/api/backup');
                  if (!res.ok) throw new Error('Falha ao gerar backup');
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `stockpro-backup-${new Date().toISOString().slice(0,10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.dismiss();
                  toast.success('Backup exportado com sucesso!');
                } catch (e: any) {
                  toast.dismiss();
                  toast.error(e.message ?? 'Erro ao gerar backup');
                }
              }}
            >
              <DatabaseBackup size={14} className="text-blue-400" />
              Backup
            </Button>

            <Button 
              variant="secondary" 
              size="sm"
              className="gap-2 text-xs flex-1 sm:flex-initial"
              onClick={() => reportsService.excelEstoque().then(b => reportsService.download(b, `estoque-${new Date().toISOString().slice(0,10)}.xlsx`))}
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              Planilha (XLSX)
            </Button>

            <Button 
              variant="primary"
              size="sm"
              className="gap-2 text-xs flex-1 sm:flex-initial"
              onClick={() => ultimoInv && reportsService.pdfInventario(ultimoInv.id).then(b => reportsService.download(b, `inventario-${ultimoInv.responsavel}.pdf`))}
              disabled={!ultimoInv}
            >
              <FileText size={14} />
              Auditoria
            </Button>
          </div>
        </div>

        {/* 5 KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          <StatCard 
            label="Volume em Estoque" 
            value={stats?.total ?? 0} 
            sub={`${dashStats?.health.ok ?? 0} SKUs Ativos`} 
            accent="#2563eb" 
            icon={Package}
          />
          <StatCard 
            label="Atenção Imediata" 
            value={alertsResumo?.ativos ?? 0} 
            sub="Ruptura ou Estoque Baixo" 
            accent="#ef4444" 
            icon={AlertTriangle}
            valueClass="text-rose-400"
          />
          <StatCard 
            label="Movimentação do Dia" 
            value={resumoHoje?.total ?? 0} 
            sub={`+${resumoHoje?.entradas ?? 0} Entradas / -${resumoHoje?.saidas ?? 0} Saídas`} 
            accent="#f59e0b" 
            icon={TrendingUp}
            valueClass="text-amber-400" 
          />
          <StatCard 
            label="Inventário em Campo" 
            value={invAtivo ? 'Em Andamento' : 'Ocioso'} 
            sub={invAtivo ? `Responsável: ${invAtivo.responsavel.split(' ')[0]}` : 'Nenhuma contagem ativa'} 
            accent="#10b981" 
            icon={CheckCircle2}
            valueClass={invAtivo ? 'text-emerald-400 text-xl md:text-2xl' : 'text-slate-400 text-xl md:text-2xl'}
          />
          <StatCard 
            label="Último Fechamento" 
            value={ultimoInv ? new Date(ultimoInv.finalizadoEm!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'} 
            sub={ultimoInv ? `Auditor: ${ultimoInv.responsavel.split(' ')[0]}` : 'Sem histórico registrado'} 
            accent="#8b5cf6" 
            icon={ShieldCheck}
            valueClass="text-indigo-300 text-xl md:text-2xl" 
          />
        </div>

        {/* Centro Analítico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  <TrendingUp size={16} className="text-blue-500" />
                  Giro Operacional dos Últimos 7 Dias
                </CardTitle>
                <p className="text-xs text-slate-300 mt-0.5">
                  Volume diário de entradas versus baixas de materiais
                </p>
              </div>
              <Badge variant="blue">Atualizado</Badge>
            </CardHeader>
            <div className="p-4 sm:p-5 md:p-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dashStats?.weeklyData} barGap={8}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#cbd5e1' }} 
                    axisLine={{ stroke: '#334155' }} 
                    tickLine={false} 
                    dy={8}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#cbd5e1' }} 
                    axisLine={{ stroke: '#334155' }} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '8px', 
                      border: '1px solid #475569', 
                      fontSize: '12px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="entradas" name="Entradas" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-4 justify-center items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-600" />
                  <span className="text-slate-200 font-medium">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-rose-600" />
                  <span className="text-slate-200 font-medium">Saídas</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <div>
                <CardTitle>
                  <Users size={16} className="text-amber-500" />
                  Ocupação por Cliente
                </CardTitle>
                <p className="text-xs text-slate-300 mt-0.5">
                  Distribuição de saldo em estoque
                </p>
              </div>
            </CardHeader>
            <div className="p-4 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dashStats?.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dashStats?.distribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '8px', 
                      border: '1px solid #475569', 
                      fontSize: '12px',
                      color: '#ffffff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 gap-2 w-full mt-3">
                {dashStats?.distribution?.slice(0, 4).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-200 font-medium truncate">{d.name}</span>
                    </div>
                    <span className="text-slate-200 font-mono-custom font-semibold tabular-nums ml-2">{d.value} un</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Tabelas de Movimentação e Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  <History size={16} className="text-blue-500" />
                  Últimas Movimentações Registradas
                </CardTitle>
                <p className="text-xs text-slate-300 mt-0.5">
                  Registro recente de entradas e baixas com operador
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-400 hover:text-blue-300 text-xs gap-1" 
                onClick={() => setIsMovementsModalOpen(true)}
              >
                Ver Todas <ChevronRight size={14} />
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="px-5 py-3">Material / Código</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Quantidade</th>
                    <th className="px-4 py-3">Data e Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {movements.slice(0, 6).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{m.product.nome}</p>
                        <p className="text-[11px] text-slate-300 font-mono-custom">{m.product.codigo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={m.type === 'ENTRADA' ? 'green' : 'red'}>
                          {m.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono-custom font-semibold">
                        <span className={m.type === 'ENTRADA' ? 'text-emerald-400' : 'text-rose-400'}>
                          {m.type === 'ENTRADA' ? '+' : '-'}{m.quantidade} {m.product.unidade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {new Date(m.createdAt).toLocaleDateString('pt-BR')} às {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <div>
                <CardTitle>
                  <AlertTriangle size={16} className="text-rose-500" />
                  Painel de Ruptura
                </CardTitle>
                <p className="text-xs text-slate-300 mt-0.5">
                  Itens com estoque igual ou abaixo do mínimo
                </p>
              </div>
            </CardHeader>
            <div className="p-3.5 space-y-2">
              {alertsAtivos.slice(0, 5).map((a) => (
                <div key={a.id} className="p-3 rounded bg-slate-900/80 border border-rose-500/25 hover:border-rose-500/40 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {a.product.nome}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Atual: <strong className="text-rose-400 font-bold">{a.quantidadeAtual}</strong> | Mínimo: <span className="text-white font-medium">{a.quantidadeMinima}</span>
                    </p>
                  </div>
                  <Badge variant="red">
                    {a.quantidadeMinima > 0 ? Math.round(((a.quantidadeAtual || 0) / a.quantidadeMinima) * 100) : 0}%
                  </Badge>
                </div>
              ))}
              {alertsAtivos.length === 0 && (
                <div className="py-12 text-center text-slate-300">
                  <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-white">Estoque Regularizado</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Nenhum SKU abaixo do nível de segurança</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Registro de Auditoria e Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                <Clock size={16} className="text-blue-500" />
                Auditoria de Atividades Recentes
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Logs de operações e alterações no sistema em tempo real
              </p>
            </div>
            <a 
              href="/auditoria" 
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Ver Todos os Logs <ChevronRight size={14} />
            </a>
          </CardHeader>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {logs.slice(0, 8).map((log: any) => (
                <div key={log.id} className="p-3 rounded bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono-custom">
                      {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">
                      <strong className="text-white">{log.user?.nome?.split(' ')[0]}:</strong> {log.descricao}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>
    </DashboardLayout>

    <MovementsDetailModal
      open={isMovementsModalOpen}
      onClose={() => setIsMovementsModalOpen(false)}
      movements={movements}
    />
    </>
  );
}