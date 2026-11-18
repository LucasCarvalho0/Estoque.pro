'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card, CardHeader, CardTitle, Badge, Button,
  PageHeader, PageLoading, Modal, ModalBody, ModalFooter,
  Input, Select, Textarea, InfoBanner,
} from '@/components/ui';
import { useNFs, useCreateNF, useBaixarNF, useClientes, useProducts } from '@/hooks';
import { formatDateTime, cn } from '@/lib/utils';
import { Plus, Trash2, FileDown, CheckCircle, AlertCircle, Clock, Search, Filter, FileText, ArrowRight } from 'lucide-react';

const nfSchema = z.object({
  numero: z.string().min(1, 'Número obrigatório'),
  clienteId: z.string().min(1, 'Selecione um cliente'),
  observacao: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Selecione um produto'),
    quantidade: z.coerce.number().min(1, 'Mínimo 1'),
    observacao: z.string().optional(),
  })).min(1, 'Adicione ao menos um item'),
});

type NfForm = z.infer<typeof nfSchema>;

const statusConfig = {
  ABERTA: { label: 'Em Aberto', variant: 'blue' as const, icon: Clock, badgeClass: 'text-blue-300 bg-blue-500/15 border-blue-500/30' },
  PARCIAL: { label: 'Baixa Parcial', variant: 'amber' as const, icon: AlertCircle, badgeClass: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
  BAIXADA: { label: 'Concluída', variant: 'green' as const, icon: CheckCircle, badgeClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
};

export default function NfPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedNf, setSelectedNf] = useState<any>(null);
  const [baixaOpen, setBaixaOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [baixaItems, setBaixaItems] = useState<Record<string, number>>({});

  const { data: nfs = [], isLoading } = useNFs({
    status: filterStatus || undefined,
    clienteId: filterCliente || undefined,
  });
  const { data: clientes = [] } = useClientes();
  const { data: products = [] } = useProducts();
  const createNF = useCreateNF();
  const baixarNF = useBaixarNF();

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<NfForm>({
    resolver: zodResolver(nfSchema),
    defaultValues: { numero: '', clienteId: '', items: [{ productId: '', quantidade: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchClienteId = watch('clienteId');

  const productsForCliente = watchClienteId
    ? products.filter((p) => p.clienteId === watchClienteId || !p.clienteId)
    : products;

  const onSubmit = async (data: NfForm) => {
    try {
      await createNF.mutateAsync(data);
      reset();
      setCreateOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao criar NF');
    }
  };

  const openBaixa = (nf: any) => {
    setSelectedNf(nf);
    const init: Record<string, number> = {};
    nf.items.forEach((i: any) => {
      init[i.id] = i.quantidade - i.quantidadeBaixada;
    });
    setBaixaItems(init);
    setBaixaOpen(true);
  };

  const handleBaixar = async () => {
    if (!selectedNf) return;
    try {
      const items = Object.entries(baixaItems)
        .filter(([, qty]) => qty > 0)
        .map(([nfItemId, quantidadeBaixar]) => ({ nfItemId, quantidadeBaixar }));

      await baixarNF.mutateAsync({ id: selectedNf.id, items });
      setBaixaOpen(false);
      setSelectedNf(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao realizar baixa');
    }
  };

  const getProductStock = (productId: string) =>
    products.find((p) => p.id === productId)?.quantidade ?? 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Notas Fiscais de Clientes"
          subtitle="Rastreabilidade e conciliação física de documentos fiscais emitidos"
          actions={
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus size={15} /> Registrar Nova NF
            </Button>
          }
        />

        {/* Barra de Filtros Corporativos */}
        <div className="enterprise-panel p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:flex-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md w-full sm:w-auto">
              <Filter size={14} className="text-blue-400 shrink-0" />
              <select
                className="bg-transparent outline-none text-xs text-slate-200 font-medium w-full cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os Status</option>
                <option value="ABERTA">Em Aberto</option>
                <option value="PARCIAL">Baixa Parcial</option>
                <option value="BAIXADA">Concluída</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md w-full sm:flex-1">
              <Search size={14} className="text-slate-400 shrink-0" />
              <select
                className="bg-transparent outline-none text-xs text-slate-200 font-medium w-full cursor-pointer"
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
              >
                <option value="">Filtrar por Cliente...</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-300 font-mono-custom whitespace-nowrap self-end md:self-center">
            {nfs.length} DOCUMENTO(S)
          </div>
        </div>

        {/* Lista de NFs */}
        {isLoading ? (
          <PageLoading />
        ) : nfs.length === 0 ? (
          <div className="enterprise-panel py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
              <FileDown size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum documento localizado</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Nenhuma nota fiscal encontrada para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {nfs.map((nf: any) => {
              const cfg = statusConfig[nf.status as keyof typeof statusConfig] || statusConfig.ABERTA;
              const totalItens = nf.items.reduce((s: number, i: any) => s + i.quantidade, 0);
              const totalBaixado = nf.items.reduce((s: number, i: any) => s + i.quantidadeBaixada, 0);
              const pctBaixado = totalItens > 0 ? Math.round(((totalBaixado || 0) / totalItens) * 100) : 0;
              const Icon = cfg.icon;

              return (
                <div key={nf.id} className="enterprise-panel p-4 sm:p-5 hover:border-slate-600 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="p-2 rounded-md bg-blue-600/15 text-blue-400 border border-blue-500/25">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                            <span>NOTA FISCAL</span>
                            <span className="text-blue-400 font-mono-custom font-bold">{nf.numero}</span>
                          </h3>
                          <p className="text-[11px] text-slate-300 font-mono-custom mt-0.5">
                            Emissão: {formatDateTime(nf.dataEmissao)} • Responsável: <strong className="text-white">{nf.user?.nome}</strong>
                          </p>
                        </div>
                        <span className={cn(
                          'ml-auto md:ml-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5',
                          cfg.badgeClass
                        )}>
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">Cliente Destinatário</span>
                          <p className="text-xs font-semibold text-white truncate mt-0.5">{nf.cliente?.nome}</p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">Progresso da Saída</span>
                            <span className="text-[11px] font-bold text-white font-mono-custom">{pctBaixado}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${pctBaixado}%` }}
                            />
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">Volumes Baixados</span>
                          <p className="text-xs font-bold text-white font-mono-custom mt-0.5">
                            {totalBaixado} / {totalItens} un
                          </p>
                        </div>
                      </div>

                      {/* Lista resumida de itens */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {nf.items.slice(0, 6).map((item: any) => (
                          <div key={item.id} className={cn(
                            "px-2.5 py-1 rounded text-[11px] font-mono-custom border",
                            item.quantidadeBaixada >= item.quantidade 
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300 font-semibold" 
                              : "bg-slate-900 border-slate-700 text-slate-200"
                          )}>
                            {item.product.nome} ({item.quantidadeBaixada}/{item.quantidade})
                          </div>
                        ))}
                        {nf.items.length > 6 && (
                          <div className="px-2 py-1 rounded text-[11px] font-mono-custom bg-slate-800 border border-slate-700 text-slate-300">
                            +{nf.items.length - 6} outros
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                      {nf.status !== 'BAIXADA' ? (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => openBaixa(nf)}
                          className="w-full md:w-auto gap-2"
                        >
                          <span>Processar Baixa</span>
                          <ArrowRight size={14} />
                        </Button>
                      ) : (
                        <div className="px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 font-bold text-xs">
                          <CheckCircle size={15} />
                          Finalizado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criar NF */}
      <Modal open={createOpen} onClose={() => { reset(); setCreateOpen(false); }} title="Emitir Documento de Saída (NF)" width="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Identificador da NF"
                placeholder="Ex: 004812"
                error={errors.numero?.message}
                {...register('numero')}
              />
              <Select
                label="Cliente Destinatário"
                error={errors.clienteId?.message}
                {...register('clienteId')}
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </div>

            <Textarea label="Observações de Saída" rows={2} placeholder="Ex: Carga expedida via transportadora parceira..." {...register('observacao')} />

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Itens da Carga</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => append({ productId: '', quantidade: 1 })}
                  className="text-xs"
                >
                  <Plus size={13} className="mr-1" /> Adicionar Item
                </Button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {fields.map((field, index) => {
                  const watchProductId = watch(`items.${index}.productId`);
                  const stock = getProductStock(watchProductId);
                  return (
                    <div key={field.id} className="flex items-start gap-2.5 p-3 bg-slate-900 border border-slate-700 rounded-md">
                      <div className="flex-1 space-y-1">
                        <select
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white outline-none focus:border-blue-500"
                          {...register(`items.${index}.productId`)}
                        >
                          <option value="">Selecione um material...</option>
                          {productsForCliente.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              [{p.codigo}] {p.nome} — Saldo: {p.quantidade} {p.unidade}
                            </option>
                          ))}
                        </select>
                        {watchProductId && (
                          <p className="text-[10px] text-slate-300 font-mono-custom">
                            Saldo em estoque: <strong className={stock === 0 ? "text-rose-400" : "text-emerald-400"}>{stock} un</strong>
                          </p>
                        )}
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min={1}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white text-center font-mono-custom font-bold outline-none focus:border-blue-500"
                          {...register(`items.${index}.quantidade`)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        disabled={fields.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => { reset(); setCreateOpen(false); }}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={createNF.isPending}>
              Registrar NF
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Modal Baixar NF */}
      {selectedNf && (
        <Modal
          open={baixaOpen}
          onClose={() => { setBaixaOpen(false); setSelectedNf(null); }}
          title={`Processar Baixa Física — NF ${selectedNf.numero}`}
          width="max-w-xl"
        >
          <ModalBody className="flex flex-col gap-4">
            <InfoBanner type="warning">
              Confirme a contagem física das peças antes de efetivar a baixa. O saldo do inventário será atualizado imediatamente.
            </InfoBanner>

            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedNf.items.map((item: any) => {
                const pendente = item.quantidade - item.quantidadeBaixada;
                const isFullyBaixado = pendente <= 0;
                const stockAtual = products.find((p: any) => p.id === item.productId)?.quantidade ?? item.product.quantidade;
                const qtdBaixar = baixaItems[item.id] ?? 0;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-md border flex items-center justify-between gap-3",
                      isFullyBaixado ? "bg-slate-900/40 border-slate-800 opacity-60" : "bg-slate-900 border-slate-700"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.product.nome}</p>
                      <p className="text-[11px] text-slate-300 font-mono-custom mt-0.5">
                        [{item.product.codigo}] • Estoque: <strong className="text-white">{stockAtual}</strong> | Pendente: <strong className="text-blue-400">{pendente}</strong>
                      </p>
                    </div>
                    
                    {!isFullyBaixado && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={Math.min(pendente, stockAtual)}
                          value={qtdBaixar}
                          onChange={(e) =>
                            setBaixaItems((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                          }
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white text-center font-mono-custom font-bold outline-none"
                        />
                        <button
                          type="button"
                          className="px-2 py-1 bg-blue-600 text-[10px] font-bold text-white rounded hover:bg-blue-500 transition-colors"
                          onClick={() =>
                            setBaixaItems((prev) => ({
                              ...prev,
                              [item.id]: Math.min(pendente, stockAtual),
                            }))
                          }
                        >
                          MAX
                        </button>
                      </div>
                    )}

                    {isFullyBaixado && (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle size={13} /> Concluído
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => { setBaixaOpen(false); setSelectedNf(null); }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={baixarNF.isPending}
              onClick={handleBaixar}
              disabled={Object.values(baixaItems).every((v) => v === 0)}
            >
              Confirmar Baixa de Estoque
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </DashboardLayout>
  );
}
