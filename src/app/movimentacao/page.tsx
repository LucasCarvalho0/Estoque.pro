'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, Badge, Button, PageHeader, PageLoading } from '@/components/ui';
import { useMovements, useClientes } from '@/hooks';
import { reportsService } from '@/services';
import { Search, Download, ArrowDownCircle, ArrowUpCircle, Calendar, History } from 'lucide-react';

export default function MovimentacaoPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingExport, setLoadingExport] = useState(false);

  const params: any = {};
  if (typeFilter) params.type = typeFilter;
  if (clienteFilter) params.clienteId = clienteFilter;
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }

  const { data: movements = [], isLoading } = useMovements(params);
  const { data: clientes = [] } = useClientes();

  // Filtro local por texto (código ou produto)
  const filtered = useMemo(() => {
    if (!search) return movements;
    const q = search.toLowerCase();
    return movements.filter((m: any) =>
      m.product?.codigo?.toLowerCase().includes(q) ||
      m.product?.nome?.toLowerCase().includes(q) ||
      m.product?.modelo?.toLowerCase().includes(q) ||
      m.product?.cliente?.nome?.toLowerCase().includes(q)
    );
  }, [movements, search]);

  // Contadores
  const totalEntradas = filtered.filter((m: any) => m.type === 'ENTRADA').length;
  const totalSaidas = filtered.filter((m: any) => m.type === 'SAIDA').length;
  const totalQtdEntrada = filtered.filter((m: any) => m.type === 'ENTRADA').reduce((acc: number, m: any) => acc + m.quantidade, 0);
  const totalQtdSaida = filtered.filter((m: any) => m.type === 'SAIDA').reduce((acc: number, m: any) => acc + m.quantidade, 0);

  const handleExport = async () => {
    setLoadingExport(true);
    try {
      const exportParams: any = {};
      if (startDate && endDate) {
        exportParams.startDate = startDate;
        exportParams.endDate = endDate;
      }
      if (typeFilter) exportParams.type = typeFilter;
      if (clienteFilter) exportParams.clienteId = clienteFilter;
      
      const blob = await reportsService.excelMovimentacao(exportParams);
      reportsService.download(blob, `movimentacao_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      alert('Erro ao exportar relatório');
    } finally {
      setLoadingExport(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' às ' + d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Histórico de Movimentações"
          subtitle={`${filtered.length} registros no período · Rastreabilidade operacional`}
          actions={
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              loading={loadingExport}
              className="gap-2 text-xs"
            >
              <Download size={14} /> Exportar Excel
            </Button>
          }
        />

        {/* 4 Cards de Resumo Executivo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="enterprise-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/25">
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Entradas</p>
              <p className="text-xl font-bold text-white font-mono-custom tabular-nums">{totalEntradas}</p>
            </div>
          </div>
          <div className="enterprise-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400 shrink-0 border border-rose-500/25">
              <ArrowUpCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Saídas</p>
              <p className="text-xl font-bold text-white font-mono-custom tabular-nums">{totalSaidas}</p>
            </div>
          </div>
          <div className="enterprise-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/25">
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Volume Entrada</p>
              <p className="text-xl font-bold text-emerald-400 font-mono-custom tabular-nums">+{totalQtdEntrada}</p>
            </div>
          </div>
          <div className="enterprise-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/25">
              <ArrowUpCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Volume Saída</p>
              <p className="text-xl font-bold text-rose-400 font-mono-custom tabular-nums">-{totalQtdSaida}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              {/* Pesquisa */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                  placeholder="Buscar por código ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Tipo */}
              <select
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-slate-200"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>

              {/* Cliente */}
              <select
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-slate-200"
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
              >
                <option value="">Todos os clientes</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>

              {/* Intervalo de Datas */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-md">
                <Calendar size={14} className="text-blue-400 shrink-0" />
                <input
                  type="date"
                  className="bg-transparent text-xs text-white outline-none cursor-pointer"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-400 text-xs font-medium">até</span>
                <input
                  type="date"
                  className="bg-transparent text-xs text-white outline-none cursor-pointer"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap justify-between lg:justify-end">
              <Badge variant="blue" className="font-semibold">{filtered.length} movimentações</Badge>
            </div>
          </CardHeader>

          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="px-4 py-3 font-mono-custom whitespace-nowrap">Data e Hora</th>
                    <th className="px-4 py-3 whitespace-nowrap">Operação</th>
                    <th className="px-4 py-3 font-mono-custom whitespace-nowrap">Código</th>
                    <th className="px-4 py-3 whitespace-nowrap">Produto / Material</th>
                    <th className="px-4 py-3 whitespace-nowrap">Quantidade</th>
                    <th className="hidden md:table-cell px-4 py-3 whitespace-nowrap">Modelo</th>
                    <th className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">Cliente</th>
                    <th className="hidden sm:table-cell px-4 py-3 font-mono-custom whitespace-nowrap">NF / Ref.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono-custom whitespace-nowrap">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={m.type === 'ENTRADA' ? 'green' : 'red'}>
                          {m.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono-custom font-semibold whitespace-nowrap">
                        {m.product?.codigo}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {m.product?.nome}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold font-mono-custom ${m.type === 'ENTRADA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.type === 'ENTRADA' ? '+' : '-'}{m.quantidade} {m.product?.unidade || ''}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-slate-300">
                        {m.product?.modelo || '-'}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        {m.product?.cliente ? (
                          <span className="text-[11px] px-2 py-0.5 rounded font-mono-custom bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                            {m.product.cliente.nome}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-slate-300 font-mono-custom">
                        {m.notaFiscal || '-'}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-slate-300">
                        <History size={36} className="mx-auto text-slate-500 mb-2" />
                        <p className="font-semibold text-white">Nenhuma movimentação localizada</p>
                        <p className="text-xs text-slate-400 mt-1">Nenhum registro encontrado para os filtros selecionados.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
