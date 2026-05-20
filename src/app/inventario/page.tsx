'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageLoading } from '@/components/ui';
import { InventarioModal } from '@/components/modals';
import { useInventoryAtivo, useInventoryHistorico, useAtualizarItemInventario, useFinalizarInventario, useSyncInventory } from '@/hooks';
import { reportsService } from '@/services';
import { formatDateTime, cn } from '@/lib/utils';
import { CheckSquare, Square, ClipboardCheck, History, FileDown, Calendar, RefreshCw, Activity, ShieldCheck, Clock, Layers, ArrowLeft, ArrowRight } from 'lucide-react';

const isDisplayItem = (code: string, name: string) => {
  const c = code.toUpperCase().trim();
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Excluir itens avariados (NG) da sessão display
  if (c.includes("NG") || n.includes(" ng") || n.endsWith("ng")) {
    return false;
  }

  if (
    c.startsWith("BRPRT 11605") || // KIT Chicote Multimidia c/ botao / NG
    c.startsWith("BRPRT 11604") || // KIT Chicote Multimidia s/ botao / NG
    c.startsWith("BRPRT 11607") || // Moldura Multimidia c/ botao / NG
    c.startsWith("BRPRT 11608") || // Moldura Multimidia s/ botao / NG
    c.startsWith("BRPRT 3110100001") || // Moldura Traseira Kait / NG
    c.startsWith("BRPRT 11603") || // Multimidia Pionner / NG
    c.startsWith("BRPRT11609") || // Tampa USB / NG
    c.startsWith("99098XA0A") || // Adesivo L/D C PILLAR
    c.startsWith("99096XA0A") || // Adesivo L/D C PILLAR NG
    c.startsWith("99099XA0A")    // Adesivo L/E C PILLAR / NG
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

    toast(`Confirmar finalização com ${itemsConferidos.length} de ${inventarioAtivo.items.length} itens verificados?`, {
      action: {
        label: 'Confirmar',
        onClick: async () => {
          try {
            await finalizar.mutateAsync({
              id: inventarioAtivo.id,
              items: itemsConferidos.map((i) => ({
                productId: i.productId,
                quantidadeContada: i.quantidadeContada,
                quantidadeSistema: i.quantidadeSistema,
                observacao: i.observacao,
              })),
            });
            toast.success('Inventário finalizado com sucesso!');
          } catch (err: any) {
            const detail = err.response?.data?.detail || err.message;
            toast.error(`Erro ao finalizar: ${detail}`);
          }
        },
      },
      cancel: { label: 'Cancelar', onClick: () => {} },
    });
  };

  const handlePdfInventario = async (id: string) => {
    try {
      const blob = await reportsService.pdfInventario(id);
      reportsService.download(blob, `inventario-${id}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch { toast.error('Erro ao gerar PDF'); }
  };

  const handleExcelInventario = async (id: string) => {
    try {
      const blob = await reportsService.excelInventario(id);
      reportsService.download(blob, `inventario-${id}.xlsx`);
      toast.success('Excel gerado com sucesso!');
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
      <div className="flex flex-col gap-10 p-2 md:p-6 max-w-[1600px] mx-auto">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group transition-all duration-500 hover:shadow-indigo-200/30">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
          <div className="relative z-10 flex items-start gap-5">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.25rem] md:rounded-[1.75rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform duration-500">
               <Layers className="w-7 h-7 md:w-8 md:h-8" strokeWidth={2.5} />
            </div>
            <div>
               <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter font-display">Controle de Inventário</h1>
               <p className="text-slate-400 font-bold text-[11px] md:text-sm mt-1 flex items-center gap-2 italic">
                 <ShieldCheck size={16} className="text-indigo-500" />
                 Auditoria de Precisão e Integridade Geral
               </p>
            </div>
          </div>
          
          {!inventarioAtivo && (
            <Button 
               variant="premium" 
               size="lg" 
               onClick={() => setModalOpen(true)} 
               className="relative z-10 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-2xl"
            >
              <ClipboardCheck size={18} className="mr-2" /> Iniciar Nova Auditoria
            </Button>
          )}
        </div>

        {isLoading && <PageLoading />}

        {/* Painel de Inventário Ativo - Visual "Centro de Comando" */}
        {inventarioAtivo && (
          <div className="flex flex-col gap-8 fade-in animate-in slide-in-from-bottom duration-700">
            <div className="relative group overflow-hidden bg-slate-900 p-8 md:p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-500/20 border border-slate-800">
               {/* Efeitos de Fundo Dinâmicos */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-[100px] transition-all duration-1000 group-hover:bg-indigo-500/20" />
               <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-[100px]" />
               
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
                  <div className="flex items-start gap-6 flex-1">
                     <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] animate-pulse ring-4 ring-indigo-500/20">
                        <Activity size={32} strokeWidth={2.5} />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-3xl font-black text-white font-display tracking-tight">Painel de Auditoria Ativa</h2>
                           <Badge variant="glass" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black px-4 animate-pulse">LIVE</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-12 mt-4">
                           <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Responsável</span>
                              <span className="text-white font-bold text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" />{inventarioAtivo.responsavel}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Registro (Mat)</span>
                              <span className="text-white font-bold text-sm italic">{inventarioAtivo.matricula}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Cronômetro</span>
                              <span className="text-white font-bold text-sm flex items-center gap-2"><Clock size={14} className="text-emerald-500" /> {formatDateTime(inventarioAtivo.iniciadoEm)}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col items-end gap-6 lg:min-w-[320px] w-full lg:w-auto bg-white/5 p-8 rounded-[2.5rem] backdrop-blur-md border border-white/5">
                     <div className="w-full">
                        <div className="flex justify-between items-end mb-3">
                           <div>
                              <p className="text-4xl font-black text-white font-display tracking-tighter">{pct}%</p>
                              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Conclusão de Auditoria</p>
                           </div>
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black text-right border-b border-white/10 pb-1">{conferidos} DE {total} ITENS CHECADOS</p>
                        </div>
                        <div className="h-4 w-full rounded-full bg-white/10 overflow-hidden border border-white/10 p-[2px]">
                           <div className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 bg-[length:200%_auto] animate-gradient-shimmer rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(96,165,250,0.4)]" style={{ width: `${pct}%` }} />
                        </div>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <Button variant="secondary" onClick={handleSync} loading={sync.isPending} className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white border-white/10 shadow-xl backdrop-blur-md font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02]">
                           <RefreshCw size={18} className={cn("mr-2", sync.isPending && "animate-spin")} /> Sincronizar
                        </Button>
                        <Button variant="premium" onClick={handleFinalizar} loading={finalizar.isPending} className="flex-1 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 font-black uppercase text-[10px] tracking-widest">
                           <CheckSquare size={20} className="mr-2" /> Encerrar Ciclo
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            <Card className="group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/20 rounded-full -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-150" />
              
              <CardHeader className="relative z-10 border-b border-slate-100 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <Calendar size={22} strokeWidth={2.5} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Lista de Conferência por Etapas</CardTitle>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Navegue pelas abas para conferir os produtos</p>
                      </div>
                   </div>
                   <Badge variant="blue" className="rounded-2xl px-6 py-2.5 bg-indigo-600 text-white border-none shadow-xl">
                     {conferidos} / {total} TOTAL VERIFICADO
                   </Badge>
                </div>

                {/* Abas Premium */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => setCurrentSection('display')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 py-3 px-5 rounded-xl font-black uppercase text-xs tracking-wider transition-all duration-300",
                      currentSection === 'display'
                        ? "bg-white text-indigo-600 shadow-md border border-slate-100"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                    )}
                  >
                    <Layers size={16} />
                    Controle de Estoque Display
                    <Badge variant={currentSection === 'display' ? "blue" : "gray"} className="ml-1 px-2.5 py-0.5 rounded-full font-black text-[10px]">
                      {displayConferidos}/{displayTotal}
                    </Badge>
                  </button>

                  <button
                    onClick={() => setCurrentSection('restante')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 py-3 px-5 rounded-xl font-black uppercase text-xs tracking-wider transition-all duration-300",
                      currentSection === 'restante'
                        ? "bg-white text-indigo-600 shadow-md border border-slate-100"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                    )}
                  >
                    <ClipboardCheck size={16} />
                    Restante do Estoque
                    <Badge variant={currentSection === 'restante' ? "blue" : "gray"} className="ml-1 px-2.5 py-0.5 rounded-full font-black text-[10px]">
                      {restanteConferidos}/{restanteTotal}
                    </Badge>
                  </button>
                </div>
              </CardHeader>

              <div className="relative z-10 grid grid-cols-1 gap-4 p-4 md:p-8 border-b border-slate-100">
                {currentItems.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-slate-400 font-bold italic">Nenhum item nesta sessão.</p>
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
                          "group/item flex flex-col lg:flex-row lg:items-center gap-8 p-5 lg:p-6 rounded-2xl md:rounded-[2.5rem] transition-all duration-500 border-2",
                          item.conferido 
                            ? 'bg-indigo-50/50 border-indigo-200/50 shadow-inner' 
                            : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50'
                        )}
                      >
                        <div className="flex items-center gap-4 lg:gap-6">
                          <button
                            onClick={() => handleToggleItem(item.id, !item.conferido, item.quantidadeSistema)}
                            className={cn(
                              "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 border-2 shrink-0",
                              item.conferido 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 rotate-[360deg] scale-110' 
                                : 'border-slate-200 text-transparent hover:border-indigo-500 bg-white hover:rotate-12'
                            )}
                          >
                            <CheckSquare strokeWidth={3} className={cn("transition-all duration-700 w-5 h-5 md:w-6 md:h-6", item.conferido ? 'scale-100' : 'scale-0')} />
                          </button>
                          <div className="min-w-0 relative">
                            <p className={cn("text-lg md:text-xl font-black transition-all truncate tracking-tight mb-1", item.conferido ? 'text-indigo-900' : 'text-slate-900')}>
                              {item.product.nome}
                            </p>
                            <div className="flex items-center gap-3">
                               <span className={cn("text-[10px] font-black tracking-[0.2em] uppercase font-mono-custom", item.conferido ? 'text-indigo-500' : 'text-slate-400')}>
                                 {item.product.codigo}
                               </span>
                               {item.conferido && <Badge variant="green" className="py-0 px-2 text-[8px] border-emerald-300">VALIDADO</Badge>}
                            </div>

                            {lastSelected[item.id] && (
                              <span className="absolute left-0 -top-8 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full animate-bounce shadow-2xl z-50">
                                REGISTRADO!
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-4 md:gap-6">
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Contagem Real</label>
                              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-slate-100 group-focus-within/item:border-indigo-500 transition-colors shadow-sm">
                                 <input
                                   type="number"
                                   min="0"
                                   defaultValue={item.quantidadeContada}
                                   onBlur={(e) => handleUpdateQuantity(item.id, e.target.value)}
                                   className="w-full h-10 bg-transparent text-center text-lg font-black font-mono-custom outline-none text-slate-800"
                                 />
                                 <Badge variant="glass" className="font-bold shrink-0">{item.product.unidade}</Badge>
                              </div>
                           </div>

                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Notas / Observações</label>
                              <input
                                type="text"
                                placeholder="Adicionar nota fiscal ou observação..."
                                defaultValue={item.observacao ?? ''}
                                onBlur={(e) => handleUpdateObservacao(item.id, e.target.value)}
                                className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-white text-sm font-semibold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                              />
                           </div>

                           <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner">
                              <label className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-2 whitespace-nowrap">Status Delta</label>
                              {item.conferido ? (
                                <div className={cn(
                                  "text-2xl font-black font-mono-custom underline decoration-4 underline-offset-4",
                                  item.divergencia < 0 ? 'text-rose-600 decoration-rose-200' : item.divergencia > 0 ? 'text-amber-600 decoration-amber-200' : 'text-emerald-600 decoration-emerald-200'
                                )}>
                                  {item.divergencia === 0 ? 'OK' : `${item.divergencia > 0 ? '+' : ''}${item.divergencia}`}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 italic">Pendente</span>
                              )}
                           </div>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Rodapé Dinâmico com Ações */}
              <div className="relative z-10 bg-slate-50/50 p-6 md:p-8 rounded-b-[2rem] flex flex-col sm:flex-row justify-between items-center gap-4">
                {currentSection === 'display' ? (
                  <>
                    <p className="text-xs font-bold text-slate-400 italic">
                      💡 Os dados de contagem são salvos automaticamente. Avance para o restante do estoque ao concluir.
                    </p>
                    <Button
                      variant="premium"
                      onClick={() => {
                        setCurrentSection('restante');
                        toast.success("Sessão 'Display' salva! Avançando para o restante do estoque.");
                      }}
                      className="w-full sm:w-auto h-12 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest px-8 shadow-xl animate-bounce"
                    >
                      Avançar para Restante <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setCurrentSection('display')}
                      className="w-full sm:w-auto h-12 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-black uppercase text-xs tracking-widest px-8"
                    >
                      <ArrowLeft size={16} className="mr-2" /> Voltar para Display
                    </Button>
                    <p className="text-xs font-bold text-slate-400 italic hidden md:block">
                      Dica: Você pode retornar à aba Display a qualquer momento antes de encerrar o ciclo.
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Histórico Premium */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 ml-2">
             <div className="p-3 rounded-2xl bg-white shadow-xl border border-slate-50">
                <History size={24} className="text-indigo-600" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight uppercase">Histórico de Auditorias</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registros Consolidados e Fechamentos</p>
             </div>
          </div>
          <Card className="overflow-hidden border-none shadow-2xl shadow-slate-200/50 rounded-[3rem]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {['Sessão Logística', 'Duração', 'Auditor Responsável', 'Carga Lab.', 'Download'].map((h) => (
                      <th key={h} className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historico.map((inv) => (
                    <tr key={inv.id} className="hover:bg-indigo-50/5 transition-all duration-300 group">
                      <td className="px-10 py-7">
                        <div className="flex flex-col min-w-[160px]">
                           <span className="text-lg font-black text-slate-900 tracking-tighter flex items-center gap-2">
                              {new Date(inv.iniciadoEm).toLocaleDateString('pt-BR')} 
                              <Badge variant="glass" className="text-[8px]">{new Date(inv.iniciadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Badge>
                           </span>
                           {inv.finalizadoEm && (
                             <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">
                                <div className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                Concluído às {new Date(inv.finalizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <Badge variant="blue" className="rounded-xl px-4 py-2 text-[10px] font-black shadow-sm group-hover:scale-110 transition-transform">
                          {getDuration(inv.iniciadoEm || new Date(), inv.finalizadoEm ?? null)}
                        </Badge>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-indigo-100 shadow-inner flex items-center justify-center text-indigo-700 font-black text-xs border-2 border-white">
                              {inv.responsavel.charAt(0)}
                           </div>
                           <span className="text-[15px] font-black text-slate-800 tracking-tight">{inv.responsavel}</span>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                         <div className="flex flex-col">
                            <span className="text-[14px] font-black text-slate-400 font-mono-custom tracking-tighter">
                               {inv._count?.items ?? 0} ITENS
                            </span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                               <div className="h-full bg-indigo-500 w-[100%]" />
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-3">
                           <Button size="sm" variant="secondary" onClick={() => handlePdfInventario(inv.id)} className="rounded-[1rem] hover:bg-rose-50 hover:text-rose-600 border-none bg-slate-100/50 shadow-sm font-black text-[10px] group-hover:-translate-y-1">
                             <FileDown size={16} className="mr-2" /> PDF
                           </Button>
                           <Button size="sm" variant="secondary" onClick={() => handleExcelInventario(inv.id)} className="rounded-[1rem] hover:bg-emerald-50 hover:text-emerald-600 border-none bg-slate-100/50 shadow-sm font-black text-[10px] group-hover:-translate-y-1">
                             <FileDown size={16} className="mr-2" /> EXCEL
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
                           <History size={48} className="text-slate-200" />
                        </div>
                        <p className="text-xl font-black text-slate-900 tracking-tight">Cofre de Registros Vazio</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Os inventários finalizados serão arquivados aqui.</p>
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
