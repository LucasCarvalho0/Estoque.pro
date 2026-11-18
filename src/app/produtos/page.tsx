'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card, CardHeader, CardTitle, Badge, Button, PageLoading,
  Modal, ModalBody, ModalFooter, Input, Select, Textarea, PageHeader,
} from '@/components/ui';
import { useProducts, useClientes, useSuppliers, useCreateProduct, useUpdateProduct } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { Search, Plus, BoxesIcon, Filter, Layers, Package, AlertTriangle } from 'lucide-react';

const schema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  modelo: z.string().optional(),
  descricao: z.string().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  quantidade: z.coerce.number().min(0, 'Mínimo 0'),
  quantidadeNG: z.coerce.number().min(0).default(0),
  quantidadeMinima: z.coerce.number().min(0, 'Mínimo 0'),
  clienteId: z.string().optional(),
  supplierId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function ProdutosPage() {
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({ open: false });
  const { data: products = [], isLoading } = useProducts(search);
  const { data: clientes = [] } = useClientes();
  const { data: suppliers = [] } = useSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const isEdit = !!modal.product;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const filtered = products.filter((p) =>
    !clienteFilter || (p as any).clienteId === clienteFilter,
  );

  const openEdit = (p: Product) => {
    reset({
      codigo: p.codigo, nome: p.nome, modelo: (p as any).modelo ?? '-',
      descricao: p.descricao ?? '', unidade: p.unidade,
      quantidade: p.quantidade, quantidadeNG: p.quantidadeNG ?? 0, quantidadeMinima: p.quantidadeMinima,
      clienteId: p.clienteId ?? '', supplierId: p.supplierId ?? '',
    });
    setModal({ open: true, product: p });
  };

  const openCreate = () => {
    reset({ codigo: '', nome: '', modelo: '-', descricao: '', unidade: 'un', quantidade: 0, quantidadeNG: 0, quantidadeMinima: 0, clienteId: '', supplierId: '' });
    setModal({ open: true });
  };

  const onSubmit = async (data: Form) => {
    try {
      if (isEdit) await updateProduct.mutateAsync({ id: modal.product!.id, data });
      else await createProduct.mutateAsync(data);
      setModal({ open: false });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar produto');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Catálogo Geral de Produtos"
          subtitle="Especificações técnicas, saldos nominais, estoques mínimos e clientes vinculados"
          actions={
            <Button variant="primary" size="sm" onClick={openCreate} className="gap-2 font-semibold">
              <Plus size={15} /> Novo Material
            </Button>
          }
        />

        {/* Barra de Filtros */}
        <div className="enterprise-panel p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-white placeholder:text-slate-400" 
              placeholder="Buscar por código (Part Number) ou descrição do material..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-slate-200 w-full sm:w-56" 
              value={clienteFilter} 
              onChange={(e) => setClienteFilter(e.target.value)}
            >
              <option value="">Todos os Clientes</option>
              {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            
            <Badge variant="blue" className="font-semibold whitespace-nowrap hidden md:inline-flex">
              {filtered.length} SKUs
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <div className="enterprise-panel py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
              <Package size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum produto localizado</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Nenhum registro encontrado para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const status = p.quantidade === 0 ? 'critico' : p.quantidade <= p.quantidadeMinima ? 'alerta' : 'ok';
              return (
                <div key={p.id} className="enterprise-panel p-5 flex flex-col justify-between hover:border-slate-600 transition-colors">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[11px] font-mono-custom font-semibold text-blue-400">
                        {p.codigo}
                      </span>
                      <Badge variant={status === 'critico' ? 'red' : status === 'alerta' ? 'amber' : 'green'} className="text-[10px]">
                        {status === 'critico' ? 'Zerado' : status === 'alerta' ? 'Atenção' : 'Normal'}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {p.nome}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Modelo: <strong className="text-white">{(p as any).modelo || '-'}</strong>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Saldo</span>
                        <strong className="text-sm font-bold text-white font-mono-custom">{p.quantidade} {p.unidade}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mínimo</span>
                        <strong className="text-sm font-bold text-slate-300 font-mono-custom">{p.quantidadeMinima} {p.unidade}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 truncate">
                        {(p as any).cliente?.nome || 'Cliente geral'}
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(p)} className="text-xs">
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Produto */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={isEdit ? 'Editar Dados do Produto' : 'Cadastrar Novo Material'} width="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Código do Produto (Part Number)" placeholder="Ex: BRPRT 11605" error={errors.codigo?.message} {...register('codigo')} />
              <Input label="Modelo" placeholder="Ex: Kicks / Versa / Geral" error={errors.modelo?.message} {...register('modelo')} />
            </div>

            <Input label="Descrição Completa do Material" placeholder="Ex: KIT Chicote Multimidia c/ botão" error={errors.nome?.message} {...register('nome')} />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Saldo Inicial" type="number" min={0} error={errors.quantidade?.message} {...register('quantidade')} />
              <Input label="Estoque Mínimo" type="number" min={0} error={errors.quantidadeMinima?.message} {...register('quantidadeMinima')} />
              <Select label="Unidade" error={errors.unidade?.message} {...register('unidade')}>
                <option value="un">un (Unidade)</option>
                <option value="pct">pct (Pacote)</option>
                <option value="cx">cx (Caixa)</option>
                <option value="kg">kg (Quilograma)</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Cliente Proprietário" error={errors.clienteId?.message} {...register('clienteId')}>
                <option value="">Selecione um cliente...</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
              <Select label="Fornecedor Homologado" error={errors.supplierId?.message} {...register('supplierId')}>
                <option value="">Selecione um fornecedor...</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </Select>
            </div>

            <Textarea label="Observações Técnicas / Armazenamento" rows={2} placeholder="Ex: Localizado no rack B-12 pátio central..." {...register('descricao')} />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={createProduct.isPending || updateProduct.isPending}>
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
