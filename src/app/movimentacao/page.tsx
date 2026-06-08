'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, Badge, Button, PageHeader, PageLoading } from '@/components/ui';
import { useMovements, useClientes } from '@/hooks';
import { reportsService } from '@/services';
import { Search, Download, Filter, ArrowDownCircle, ArrowUpCircle, Calendar } from 'lucide-react';

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
    }) + ' ' + d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col gap-5">
        <PageHeader
          title="Movimentação"
          subtitle={`${filtered.length} registros · Histórico completo`}
          actions={
            <Button
              variant="primary"
              onClick={handleExport}
              loading={loadingExport}
            >
              <Download size={14} /> Exportar Excel
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Entradas</p>
              <p className="text-lg font-black text-slate-800">{totalEntradas}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowUpCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Saídas</p>
              <p className="text-lg font-black text-slate-800">{totalSaidas}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Qtd. Entrada</p>
              <p className="text-lg font-black text-emerald-600">{totalQtdEntrada}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ArrowUpCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Qtd. Saída</p>
              <p className="text-lg font-black text-rose-600">{totalQtdSaida}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-700 w-full sm:w-48"
                  placeholder="Código ou produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-600 w-full sm:w-36"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
              <select
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-600 w-full sm:w-44"
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
              >
                <option value="">Todos os clientes</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>

              <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden md:block" />

              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <input
                  type="date"
                  className="px-2 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-600"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-400 text-xs">até</span>
                <input
                  type="date"
                  className="px-2 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-600"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap justify-between md:justify-end w-full lg:w-auto">
              <Badge variant="gray">{filtered.length} registros</Badge>
            </div>
          </CardHeader>

          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">Data e Hora</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">Tipo</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">Código</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">Produto</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">Quantidade</th>
                    <th className="hidden md:table-cell text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">Modelo</th>
                    <th className="hidden lg:table-cell text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">Cliente</th>
                    <th className="hidden sm:table-cell text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">NG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-[12px] text-slate-500 font-mono-custom whitespace-nowrap">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {m.type === 'ENTRADA' ? (
                          <Badge variant="green">Entrada</Badge>
                        ) : (
                          <Badge variant="red">Saída</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400 font-mono-custom whitespace-nowrap font-bold">
                        {m.product?.codigo}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-800">
                        {m.product?.nome}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[13px] font-black font-mono-custom ${m.type === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.type === 'ENTRADA' ? '+' : '-'}{m.quantidade}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-[12px] text-slate-500">
                        {m.product?.modelo || '-'}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        {m.product?.cliente ? (
                          <span className="text-[11px] px-2 py-0.5 rounded font-mono-custom bg-blue-50 text-blue-700 border border-blue-100">
                            {m.product.cliente.nome}
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-300">-</span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-[12px] text-slate-400 font-mono-custom">
                        {m.notaFiscal || '-'}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-[13px] text-slate-400">Nenhuma movimentação encontrada</td></tr>
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
