'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageLoading, InfoBanner, PageHeader } from '@/components/ui';
import { MovementModal } from '@/components/modals';
import { useAlerts, useAlertsResumo } from '@/hooks';
import { formatDateTime } from '@/lib/utils';
import * as Lucide from 'lucide-react';

export default function AlertasPage() {
  const { data: alertsAtivos = [], isLoading } = useAlerts('ATIVO');
  const { data: alertsResolvidos = [] } = useAlerts('RESOLVIDO');
  const { data: resumo } = useAlertsResumo();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [movModal, setMovModal] = useState<{ 
    open: boolean; 
    productId?: string; 
    type: 'ENTRADA' | 'SAIDA';
    quantity?: number;
  }>({ open: false, type: 'ENTRADA' });
  const [tab, setTab] = useState<'ativos' | 'resolvidos'>('ativos');

  const lista = tab === 'ativos' ? alertsAtivos : alertsResolvidos;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Central de Alertas e Rupturas"
          subtitle="Monitoramento em tempo real de itens críticos e divergências de contagem"
          actions={
            <Badge variant="red" className="px-3 py-1 text-xs font-bold">
              {resumo?.ativos ?? 0} Alertas Críticos Ativos
            </Badge>
          }
        />

        <InfoBanner type="info">
          Selecione <strong>"Ver Diagnóstico"</strong> para analisar discrepâncias entre saldo do sistema e estoque físico, realizando o ajuste de estoque correspondente.
        </InfoBanner>

        {/* Abas Corporativas */}
        <div className="flex gap-1.5 p-1 bg-slate-900/90 rounded-lg w-fit border border-slate-700">
          <button
            onClick={() => setTab('ativos')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'ativos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Lucide.AlertCircle size={14} /> Alertas Ativos ({alertsAtivos.length})
          </button>
          <button
            onClick={() => setTab('resolvidos')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              tab === 'resolvidos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Lucide.CheckCircle2 size={14} /> Histórico Resolvido ({alertsResolvidos.length})
          </button>
        </div>

        {isLoading ? (
          <PageLoading />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {lista.map((alert) => {
              const isDivergencia = (alert as any).tipo === 'DIVERGENCIA_INVENTARIO';
              const isZerado = alert.quantidadeAtual === 0;
              const isExpanded = expandedId === alert.id;
              const diff = alert.quantidadeMinima - alert.quantidadeAtual;

              return (
                <div
                  key={alert.id}
                  className="enterprise-panel overflow-hidden transition-all duration-150 border-slate-700/80 hover:border-slate-600"
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${
                        tab === 'resolvidos' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        isDivergencia ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                        isZerado ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {isDivergencia ? <Lucide.PackageSearch size={20} /> : <Lucide.AlertCircle size={20} />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                            {alert.product.nome}
                          </h3>
                          <Badge variant={isDivergencia ? 'blue' : isZerado ? 'red' : 'amber'} className="text-[10px] uppercase font-bold">
                            {isDivergencia ? 'Divergência de Inventário' : isZerado ? 'Estoque Zerado' : 'Estoque Baixo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-300 font-mono-custom font-medium">
                          Código: <strong className="text-white">{alert.product.codigo}</strong> {alert.product.modelo ? `· Modelo: ${alert.product.modelo}` : ''}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>Registrado em {formatDateTime(alert.createdAt)}</span>
                          {alert.resolvidoEm && (
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                              <Lucide.CheckCircle2 size={12} /> Resolvido
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <div className="flex flex-col md:items-end">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Saldo Atual</span>
                        <span className={`text-xl font-bold font-mono-custom ${
                          tab === 'resolvidos' ? 'text-emerald-400' :
                          isZerado ? 'text-rose-400 font-black' : 'text-amber-400'
                        }`}>
                          {alert.quantidadeAtual} <span className="text-xs font-normal text-slate-300">{alert.product.unidade}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="text-xs font-semibold"
                          onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        >
                          {isExpanded ? 'Ocultar' : 'Ver Diagnóstico'}
                        </Button>
                        
                        {tab === 'ativos' && !isExpanded && (
                          <Button 
                            variant="primary"
                            size="sm"
                            onClick={() => setMovModal({ 
                              open: true, 
                              productId: alert.productId, 
                              type: 'ENTRADA',
                              quantity: isDivergencia ? Math.abs(diff) : undefined
                            })} 
                            className="text-xs font-semibold"
                          >
                            Ajustar Estoque
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Relatório Detalhado se Expandido */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-800 bg-slate-900/60">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
                        {/* Caixa 1: Sistema */}
                        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-700/80">
                          <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Mínimo / Esperado</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-white font-mono-custom">{alert.quantidadeMinima}</span>
                            <span className="text-xs text-slate-400">{alert.product.unidade}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">Parâmetro de segurança registrado</p>
                        </div>

                        {/* Caixa 2: Físico */}
                        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-700/80">
                          <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Saldo em Pátio</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-blue-400 font-mono-custom">{alert.quantidadeAtual}</span>
                            <span className="text-xs text-slate-400">{alert.product.unidade}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">Quantidade registrada em sistema</p>
                        </div>

                        {/* Caixa 3: Diferença */}
                        <div className={`p-3.5 rounded-lg border ${
                          diff > 0 
                            ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' 
                            : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        }`}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                            {diff > 0 ? 'Déficit Identificado' : 'Excedente em Estoque'}
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-mono-custom">{Math.abs(diff)}</span>
                            <span className="text-xs uppercase font-medium">{alert.product.unidade}</span>
                          </div>
                          <p className="text-[11px] mt-1 opacity-90">
                            {diff > 0 ? 'Requer Entrada de ajuste' : 'Requer Saída ou Baixa'}
                          </p>
                        </div>
                      </div>

                      {tab === 'ativos' && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Button 
                            variant="primary"
                            size="sm"
                            className="gap-2 text-xs font-semibold"
                            onClick={() => setMovModal({ 
                              open: true, 
                              productId: alert.productId, 
                              type: diff > 0 ? 'ENTRADA' : 'SAIDA',
                              quantity: Math.abs(diff)
                            })}
                          >
                            <Lucide.ArrowRightCircle size={15} />
                            Efetuar Ajuste Corretivo de {Math.abs(diff)} {alert.product.unidade}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setExpandedId(null)} className="text-xs">
                            Recolher
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {lista.length === 0 && (
              <div className="enterprise-panel py-16 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Lucide.CheckCircle2 size={28} />
                </div>
                <div>
                  <p className="text-base font-bold text-white">
                    {tab === 'ativos' ? 'Nenhum alerta ativo no momento' : 'Nenhum alerta resolvido no histórico'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 max-w-[360px] mx-auto">
                    {tab === 'ativos' ? 'Todos os materiais estão acima do nível de estoque mínimo de segurança.' : 'O histórico de resoluções está limpo.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <MovementModal
        open={movModal.open}
        onClose={() => setMovModal({ ...movModal, open: false })}
        type={movModal.type}
        preSelectedProductId={movModal.productId}
        preFilledQuantity={movModal.quantity}
      />
    </DashboardLayout>
  );
}
