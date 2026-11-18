'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageHeader, QtyBar, PageLoading } from '@/components/ui';
import { MovementModal, ProductModal, NgTransferModal } from '@/components/modals';
import { useProducts, useClientes } from '@/hooks';
import { reportsService } from '@/services';
import type { Product, MovementType } from '@/types';
import { Search, Plus, Filter, Download, Flame, Package } from 'lucide-react';

export default function EstoquePage() {
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showOnlyNG, setShowOnlyNG] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [movModal, setMovModal] = useState<{ open: boolean; type: MovementType; productId?: string }>({ open: false, type: 'ENTRADA' });
  const [prodModal, setProdModal] = useState<{ open: boolean; product?: Product }>({ open: false });
  const [ngModal, setNgModal] = useState<{ open: boolean; product?: Product }>({ open: false });

  const { data: products = [], isLoading } = useProducts(search);
  const { data: clientes = [] } = useClientes();

  const filtered = products.filter((p) => {
    if (showOnlyNG && (!p.quantidadeNG || p.quantidadeNG <= 0)) return false;
    if (clienteFilter && p.clienteId !== clienteFilter) return false;
    if (!statusFilter) return true;
    if (statusFilter === 'critical') return p.quantidade <= p.quantidadeMinima;
    if (statusFilter === 'alert') return p.quantidade <= p.quantidadeMinima * 1.5 && p.quantidade > p.quantidadeMinima;
    return p.quantidade > p.quantidadeMinima * 1.5;
  });

  const totalNG = filtered.reduce((acc, p) => acc + (p.quantidadeNG || 0), 0);

  const handleExportNG = async () => {
    setLoadingExport(true);
    try {
      const blob = await reportsService.excelEstoqueNG();
      reportsService.download(blob, `sucata_ng_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      alert('Erro ao exportar relatório');
    } finally {
      setLoadingExport(false);
    }
  };

  const getStatusBadge = (p: Product) => {
    if (p.quantidade === 0) return <Badge variant="red">Zerado</Badge>;
    if (p.quantidadeMinima > 0 && p.quantidade <= p.quantidadeMinima) return <Badge variant="red">Crítico</Badge>;
    if (p.quantidadeMinima > 0 && p.quantidade <= p.quantidadeMinima * 1.5) return <Badge variant="amber">Atenção</Badge>;
    return <Badge variant="green">Normal</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Controle de Estoque"
          subtitle={`${filtered.length} SKUs cadastrados · Unidade VPC Operações`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="success" size="sm" onClick={() => setMovModal({ open: true, type: 'ENTRADA' })}>
                <Plus size={14} /> Entrada (NF)
              </Button>
              <Button variant="danger" size="sm" onClick={() => setMovModal({ open: true, type: 'SAIDA' })}>
                − Saída
              </Button>
              <Button variant="primary" size="sm" onClick={() => setProdModal({ open: true })}>
                <Plus size={14} /> Novo Produto
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              {/* Barra de Pesquisa */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                  placeholder="Buscar por código ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filtro por Cliente */}
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

              {/* Filtro por Status */}
              <select
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-slate-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="ok">Normal</option>
                <option value="alert">Atenção</option>
                <option value="critical">Crítico / Zerado</option>
              </select>

              {/* Filtro Sucata NG */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200 bg-slate-900/90 px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={showOnlyNG} 
                  onChange={(e) => setShowOnlyNG(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500 bg-slate-800 border-slate-600"
                />
                <span>Apenas Sucata (NG)</span>
              </label>

              {showOnlyNG && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleExportNG} 
                  loading={loadingExport}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs font-semibold"
                >
                  <Download size={14} className="mr-1.5" /> Exportar Sucata
                </Button>
              )}
            </div>

            <div className="flex gap-2 items-center flex-wrap justify-between lg:justify-end">
              {showOnlyNG && (
                <Badge variant="red" className="font-semibold">Total Sucata: {totalNG} un</Badge>
              )}
              <Badge variant="blue" className="font-semibold">{filtered.length} SKUs encontrados</Badge>
            </div>
          </CardHeader>

          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="px-4 py-3 font-mono-custom whitespace-nowrap">Código</th>
                    <th className="px-4 py-3 whitespace-nowrap">Produto / Descrição</th>
                    <th className="hidden md:table-cell px-4 py-3 whitespace-nowrap">Modelo</th>
                    <th className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">Cliente</th>
                    <th className="px-4 py-3 whitespace-nowrap">Saldo em Estoque</th>
                    <th className="hidden sm:table-cell px-4 py-3 font-mono-custom whitespace-nowrap">Qtd. NG</th>
                    <th className="hidden xl:table-cell px-4 py-3 font-mono-custom whitespace-nowrap">Mín.</th>
                    <th className="hidden md:table-cell px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono-custom font-semibold whitespace-nowrap">
                        {p.codigo}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {p.nome}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-slate-300">
                        {(p as any).modelo || '-'}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        {(p as any).cliente && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-mono-custom bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                            {(p as any).cliente.nome}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        <QtyBar value={p.quantidade} min={p.quantidadeMinima} max={Math.max(p.quantidade, p.quantidadeMinima || 1) * 2} />
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 font-mono-custom text-rose-400 font-bold">
                        {p.quantidadeNG > 0 ? p.quantidadeNG : '-'}
                      </td>
                      <td className="hidden xl:table-cell px-4 py-3 text-slate-300 font-mono-custom font-medium">
                        {p.quantidadeMinima}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        {getStatusBadge(p)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="success" className="px-2 py-1 text-xs" onClick={() => setMovModal({ open: true, type: 'ENTRADA', productId: p.id })} title="Registrar Entrada">+</Button>
                          <Button size="sm" variant="danger" className="px-2 py-1 text-xs" onClick={() => setMovModal({ open: true, type: 'SAIDA', productId: p.id })} title="Registrar Saída">−</Button>
                          <Button size="sm" variant="secondary" className="px-2 py-1 text-xs text-rose-300 border-rose-500/30 hover:bg-rose-500/10 font-bold" onClick={() => setNgModal({ open: true, product: p })} title="Segregar Sucata (NG)">NG</Button>
                          <Button size="sm" variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => setProdModal({ open: true, product: p })}>Editar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center text-slate-300">
                        <Package size={36} className="mx-auto text-slate-500 mb-2" />
                        <p className="font-semibold text-white">Nenhum produto localizado</p>
                        <p className="text-xs text-slate-400 mt-1">Verifique os filtros selecionados ou digite outro termo de busca.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <MovementModal
        open={movModal.open}
        onClose={() => setMovModal({ open: false, type: 'ENTRADA' })}
        type={movModal.type}
        preSelectedProductId={movModal.productId}
      />
      <NgTransferModal
        open={ngModal.open}
        onClose={() => setNgModal({ open: false })}
        product={ngModal.product}
      />
      <ProductModal
        open={prodModal.open}
        onClose={() => setProdModal({ open: false })}
        product={prodModal.product}
      />
    </DashboardLayout>
  );
}
