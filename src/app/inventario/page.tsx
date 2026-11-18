'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageLoading, PageHeader } from '@/components/ui';
import { InventarioModal } from '@/components/modals';
import { useInventoryAtivo, useInventoryHistorico, useAtualizarItemInventario, useFinalizarInventario, useSyncInventory } from '@/hooks';
import { reportsService } from '@/services';
import { formatDateTime, cn } from '@/lib/utils';
import { CheckSquare, Square, ClipboardCheck, History, FileDown, Calendar, RefreshCw, Activity, ShieldCheck, Clock, Layers, ArrowLeft, ArrowRight } from 'lucide-react';

const isDisplayItem = (code: string, name: string) => {
  const c = code.toUpperCase().trim();
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (c.includes("NG") || n.includes(" ng") || n.endsWith("ng")) {
    return false;
  }

  if (
    c.startsWith("BRPRT 11605") ||
    c.startsWith("BRPRT 11604") ||
    c.startsWith("BRPRT 11607") ||
    c.startsWith("BRPRT 11608") ||
    c.startsWith("BRPRT 3110100001") ||
    c.startsWith("BRPRT 11603") ||
    c.startsWith("BRPRT11609") ||
    c.startsWith("99098XA0A") ||
    c.startsWith("99096XA0A") ||
    c.startsWith("99099XA0A")
  ) {
    return true;
  }
  
  if (n.includes("chicote") && (n.includes("botao") || n.includes("multimidia"))) return true;
  if (n.includes("moldura multimidia")) return true;
  if (n.includes("moldura traseira")) return true;
  if (n.includes("multimidia pionner") || n.includes("multimidia pioneer")) return true;
  if (n.includes("adesivo") && (n.includes("c pillar") || n.includes("cepila") || n.includes("c-pillar"))) return true;
  if (n.includes("tampa usb")) return true;
  
  return false;
};

export default function InventarioPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: inventarioAtivo, isLoading } = useInventoryAtivo();
  const { data: historico = [] } = useInventoryHistorico();
  const atualizarItem = useAtualizarItemInventario();
  const finalizar = useFinalizarInventario();
  const sync = useSyncInventory();

  const [currentSection, setCurrentSection] = useState<'display' | 'restante'>('display');
  const [lastSelected, setLastSelected] = useState<Record<string, boolean>>({});

  const handleSync = async () => {
    if (!inventarioAtivo) return;
    try {
      const res = await sync.mutateAsync(inventarioAtivo.id);
      toast.success(res.message);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      toast.error(`Erro ao sincronizar: ${detail}`);
    }
  };

  const handleToggleItem = async (itemId: string, checked: boolean, quantidadeSistema: number) => {
    if (!inventarioAtivo) return;
    
    if (checked) {
      setLastSelected(prev => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setLastSelected(prev => ({ ...prev, [itemId]: false }));
      }, 1500);
    }

    await atualizarItem.mutateAsync({
      inventoryId: inventarioAtivo.id,
      itemId,
      data: { 
        quantidadeContada: checked ? quantidadeSistema : 0,
        conferido: checked
      },
    });
  };

  const handleUpdateQuantity = async (itemId: string, val: string) => {
    if (!inventarioAtivo) return;
    const qtd = parseInt(val) || 0;
    await atualizarItem.mutateAsync({
      inventoryId: inventarioAtivo.id,
      itemId,
      data: { quantidadeContada: qtd },
    });
  };

  const handleUpdateObservacao = async (itemId: string, observacao: string) => {
    if (!inventarioAtivo) return;
    await atualizarItem.mutateAsync({
      inventoryId: inventarioAtivo.id,
      itemId,
      data: { observacao },
    });
  };

  const handleFinalizar = async () => {
    if (!inventarioAtivo) return;
    const itemsConferidos = inventarioAtivo.items.filter((i) => i.conferido);
    
    if (itemsConferidos.length === 0) {
      toast.warning('Nenhum item foi conferido. Marque pelo menos um produto para finalizar.');
      return;
    }

    toast(`Confirmar encerramento com ${itemsConferidos.length} de ${inventarioAtivo.items.length} itens conferidos?`, {
      action: {
        label: 'Confirmar',
        onClick: async () => {
          try {
            await finalizar.mutateAsync({
              id: inventarioAtivo.id,
              items: itemsConferidos.map((i) => ({
                itemId: i.id,
                quantidadeContada: i.quantidadeContada,
                conferido: i.conferido,
                observacao: i.observacao,
              })),
            });
            toast.success('Auditoria de inventário finalizada com sucesso!');
          } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Erro ao finalizar inventário');
          }
        },
      },
    });
  };

  const handlePdfInventario = async (id: string) => {
    try {
      const blob = await reportsService.pdfInventario(id);
      reportsService.download(blob, `inventario-${id}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch { toast.error('Erro ao gerar PDF'); }
  };

  const handleExcelInventario = async (id: string) => {
    try {
      const blob = await reportsService.excelInventario(id);
      reportsService.download(blob, `inventario-${id}.xlsx`);
      toast.success('Planilha Excel gerada com sucesso!');
    } catch { toast.error('Erro ao gerar Excel'); }
  };

  const conferidos = inventarioAtivo?.items.filter((i) => i.conferido).length ?? 0;
  const total = inventarioAtivo?.items.length ?? 0;
  const pct = total > 0 ? Math.round(((conferidos || 0) / total) * 100) : 0;

  const displayItems = inventarioAtivo?.items.filter((i) => isDisplayItem(i.product.codigo, i.product.nome)) ?? [];
  const restanteItems = inventarioAtivo?.items.filter((i) => !isDisplayItem(i.product.codigo, i.product.nome)) ?? [];

  const displayConferidos = displayItems.filter((i) => i.conferido).length;
  const restanteConferidos = restanteItems.filter((i) => i.conferido).length;

  const displayTotal = displayItems.length;
  const restanteTotal = restanteItems.length;

  const currentItems = currentSection === 'display' ? displayItems : restanteItems;

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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Controle de Inventário e Auditoria"
          subtitle="Auditoria de precisão, contagem de saldo físico e conciliação sistêmica"
          actions={
            !inventarioAtivo && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setModalOpen(true)} 
                className="gap-2 font-semibold"
              >
                <ClipboardCheck size={16} /> Iniciar Nova Auditoria
              </Button>
            )
          }
        />

        {isLoading && <PageLoading />}

        {/* Painel de Inventário Ativo */}
        {inventarioAtivo && (
          <div className="flex flex-col gap-6 fade-in">
            <div className="enterprise-panel p-5 md:p-6 bg-[#0c1426] border-blue-500/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Activity size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-white tracking-tight">Auditoria em Andamento</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        EM TEMPO REAL
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-6 mt-2 text-xs">
                      <div>
                        <span className="text-slate-400">Responsável: </span>
                        <strong className="text-white">{inventarioAtivo.responsavel}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Matrícula: </span>
                        <strong className="text-slate-200 font-mono-custom">{inventarioAtivo.matricula}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Iniciado: </span>
                        <strong className="text-slate-200 font-mono-custom">{formatDateTime(inventarioAtivo.iniciadoEm)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[320px] bg-slate-900/80 p-4 rounded-lg border border-slate-700/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Progresso da Contagem</span>
                    <span className="font-mono-custom font-bold text-white">{pct}% ({conferidos}/{total})</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleSync} 
                      loading={sync.isPending} 
                      className="flex-1 text-xs"
                    >
                      <RefreshCw size={13} className={cn("mr-1.5", sync.isPending && "animate-spin")} /> Sincronizar
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleFinalizar} 
                      loading={finalizar.isPending} 
                      className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 font-semibold"
                    >
                      <CheckSquare size={14} className="mr-1.5" /> Concluir
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas e Lista de Itens */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-400" />
                  <CardTitle>Conferência Física de Itens</CardTitle>
                </div>

                {/* Abas */}
                <div className="flex gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-700 self-start sm:self-auto">
                  <button
                    onClick={() => setCurrentSection('display')}
                    className={cn(
                      "flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors",
                      currentSection === 'display'
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    <Layers size={13} />
                    Itens Display ({displayConferidos}/{displayTotal})
                  </button>

                  <button
                    onClick={() => setCurrentSection('restante')}
                    className={cn(
                      "flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors",
                      currentSection === 'restante'
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    <ClipboardCheck size={13} />
                    Restante ({restanteConferidos}/{restanteTotal})
                  </button>
                </div>
              </CardHeader>

              <div className="p-4 sm:p-5 grid grid-cols-1 gap-3">
                {currentItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-300">
                    <p className="text-xs">Nenhum item nesta seção de auditoria.</p>
                  </div>
                ) : (
                  [...currentItems]
                    .sort((a, b) => {
                      if (a.conferido && !b.conferido) return -1;
                      if (!a.conferido && b.conferido) return 1;
                      return a.product.nome.localeCompare(b.product.nome);
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-4 rounded-lg border transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4",
                          item.conferido 
                            ? 'bg-slate-900/90 border-blue-500/40' 
                            : 'bg-slate-900/50 border-slate-700/70 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            onClick={() => handleToggleItem(item.id, !item.conferido, item.quantidadeSistema)}
                            className={cn(
                              "w-8 h-8 rounded-md flex items-center justify-center transition-colors border shrink-0",
                              item.conferido 
                                ? 'bg-blue-600 border-blue-500 text-white' 
                                : 'border-slate-600 text-transparent hover:border-slate-400 bg-slate-950'
                            )}
                          >
                            <CheckSquare size={16} strokeWidth={2.5} className={cn(item.conferido ? 'opacity-100' : 'opacity-0')} />
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {item.product.nome}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-300 font-mono-custom font-medium">
                                {item.product.codigo}
                              </span>
                              {item.conferido && (
                                <Badge variant="green" className="text-[10px] py-0 px-1.5">Conferido</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 w-full lg:w-auto">
                          {/* Contagem */}
                          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-md border border-slate-700">
                            <span className="text-xs text-slate-400 whitespace-nowrap">Contagem:</span>
                            <input
                              type="number"
                              min="0"
                              defaultValue={item.quantidadeContada}
                              onBlur={(e) => handleUpdateQuantity(item.id, e.target.value)}
                              className="w-16 bg-transparent text-center text-sm font-bold font-mono-custom text-white outline-none"
                            />
                            <span className="text-xs text-slate-400">{item.product.unidade}</span>
                          </div>

                          {/* Observação */}
                          <input
                            type="text"
                            placeholder="Observação (opcional)..."
                            defaultValue={item.observacao ?? ''}
                            onBlur={(e) => handleUpdateObservacao(item.id, e.target.value)}
                            className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder:text-slate-500"
                          />

                          {/* Delta */}
                          <div className="text-center sm:text-right px-2 py-1 rounded bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Divergência</span>
                            {item.conferido ? (
                              <span className={cn(
                                "text-sm font-bold font-mono-custom",
                                item.divergencia < 0 ? 'text-rose-400' : item.divergencia > 0 ? 'text-amber-400' : 'text-emerald-400'
                              )}>
                                {item.divergencia === 0 ? 'Exato (0)' : `${item.divergencia > 0 ? '+' : ''}${item.divergencia}`}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">Pendente</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Rodapé da Conferência */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-xs text-slate-400">
                  Os valores registrados são salvos automaticamente no banco de dados.
                </span>
                {currentSection === 'display' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setCurrentSection('restante');
                      toast.success("Avançado para a seção Restante do Estoque.");
                    }}
                    className="gap-2 text-xs"
                  >
                    Avançar para Restante <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentSection('display')}
                    className="gap-2 text-xs"
                  >
                    <ArrowLeft size={14} /> Voltar para Display
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Histórico Consolidado */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Histórico de Fechamentos Anteriores</h2>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="px-5 py-3">Data e Hora</th>
                    <th className="px-4 py-3">Duração</th>
                    <th className="px-4 py-3">Auditor Responsável</th>
                    <th className="px-4 py-3">Itens Auditados</th>
                    <th className="px-4 py-3 text-right">Relatórios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historico.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{new Date(inv.iniciadoEm).toLocaleDateString('pt-BR')}</p>
                        <p className="text-[11px] text-slate-400 font-mono-custom">
                          {new Date(inv.iniciadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {inv.finalizadoEm && ` às ${new Date(inv.finalizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="blue" className="font-mono-custom">
                          {getDuration(inv.iniciadoEm || new Date(), inv.finalizadoEm ?? null)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {inv.responsavel}
                      </td>
                      <td className="px-4 py-3 font-mono-custom font-semibold text-slate-300">
                        {inv._count?.items ?? 0} SKUs
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handlePdfInventario(inv.id)} className="text-xs gap-1">
                            <FileDown size={13} className="text-rose-400" /> PDF
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleExcelInventario(inv.id)} className="text-xs gap-1">
                            <FileDown size={13} className="text-emerald-400" /> Excel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-300">
                        Nenhum inventário arquivado até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <InventarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </DashboardLayout>
  );
}
