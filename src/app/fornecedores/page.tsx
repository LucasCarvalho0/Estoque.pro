'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card, CardHeader, CardTitle, Badge, Button,
  PageHeader, PageLoading, Modal, ModalBody, ModalFooter,
  Input,
} from '@/components/ui';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '@/hooks';
import type { Supplier } from '@/types';
import { Truck, Plus, Search, Mail, Phone, Building2 } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function FornecedoresPage() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; supplier?: Supplier }>({ open: false });
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const isEdit = !!modal.supplier;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const filtered = suppliers.filter((s) =>
    s.nome.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (s: Supplier) => {
    reset({ nome: s.nome, email: s.email ?? '', telefone: s.telefone ?? '' });
    setModal({ open: true, supplier: s });
  };

  const openCreate = () => {
    reset({ nome: '', email: '', telefone: '' });
    setModal({ open: true });
  };

  const onSubmit = async (data: Form) => {
    try {
      if (isEdit) await updateSupplier.mutateAsync({ id: modal.supplier!.id, data });
      else await createSupplier.mutateAsync(data);
      setModal({ open: false });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar fornecedor');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Gestão de Fornecedores Homologados"
          subtitle="Cadeia de suprimentos e fornecedores vinculados ao recebimento de materiais"
          actions={
            <Button variant="primary" size="sm" onClick={openCreate} className="gap-2">
              <Plus size={15} /> Novo Fornecedor
            </Button>
          }
        />

        {/* Barra de Pesquisa */}
        <div className="enterprise-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
              placeholder="Buscar por razão social ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="blue" className="self-end sm:self-auto font-semibold">
            {filtered.length} Fornecedores Registrados
          </Badge>
        </div>

        {/* Grade de Fornecedores */}
        {isLoading ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <div className="enterprise-panel py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
              <Truck size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum fornecedor localizado</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Nenhum fornecedor registrado com os critérios digitados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="enterprise-panel p-5 flex flex-col justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                        {s.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{s.nome}</h3>
                        <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">Homologado</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(s)} className="text-xs shrink-0">
                      Editar
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                      <Mail size={14} className="text-blue-400 shrink-0" />
                      <span className="truncate">{s.email || 'E-mail não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                      <Phone size={14} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{s.telefone || 'Telefone não informado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Fornecedor */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={isEdit ? 'Editar Dados do Fornecedor' : 'Cadastrar Novo Fornecedor'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-4">
            <Input label="Razão Social / Nome Fantasia" placeholder="Ex: Fornecedor Central de Chicotes Ltda" error={errors.nome?.message} {...register('nome')} />
            <Input label="E-mail de Contato Comercial" type="email" placeholder="comercial@fornecedor.com" error={errors.email?.message} {...register('email')} />
            <Input label="Telefone / Ramal" placeholder="(11) 3333-0000" {...register('telefone')} />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={createSupplier.isPending || updateSupplier.isPending}>
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
