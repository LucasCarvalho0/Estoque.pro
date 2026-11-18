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
import { useClientes, useCreateCliente, useUpdateCliente } from '@/hooks';
import type { Cliente } from '@/types';
import { Building2, Plus, Search, Mail, Phone, UserCheck, Package, FileText } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  contato: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; cliente?: Cliente }>({ open: false });
  const { data: clientes = [], isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  const isEdit = !!modal.cliente;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const filtered = clientes.filter((c: any) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.includes(search)
  );

  const openEdit = (c: Cliente) => {
    reset({
      nome: c.nome, cnpj: c.cnpj ?? '',
      email: c.email ?? '', telefone: c.telefone ?? '',
      contato: c.contato ?? '',
    });
    setModal({ open: true, cliente: c });
  };

  const openCreate = () => {
    reset({ nome: '', cnpj: '', email: '', telefone: '', contato: '' });
    setModal({ open: true });
  };

  const onSubmit = async (data: Form) => {
    try {
      if (isEdit) await updateCliente.mutateAsync({ id: modal.cliente!.id, data });
      else await createCliente.mutateAsync(data);
      setModal({ open: false });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar cliente');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Gestão de Clientes e Contas"
          subtitle="Empresas parceiras vinculadas aos produtos e expedições de notas fiscais"
          actions={
            <Button variant="primary" size="sm" onClick={openCreate} className="gap-2">
              <Plus size={15} /> Novo Cliente
            </Button>
          }
        />

        {/* Barra de Pesquisa */}
        <div className="enterprise-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
              placeholder="Buscar por razão social ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="blue" className="self-end sm:self-auto font-semibold">
            {filtered.length} Clientes Cadastrados
          </Badge>
        </div>

        {/* Grade de Clientes */}
        {isLoading ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <div className="enterprise-panel py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
              <Building2 size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum cliente localizado</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Verifique o termo pesquisado ou cadastre uma nova empresa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c: any) => (
              <div key={c.id} className="enterprise-panel p-5 flex flex-col justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                        {c.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{c.nome}</h3>
                        <p className="text-[11px] text-slate-300 font-mono-custom mt-0.5">{c.cnpj || 'Sem CNPJ informado'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(c)} className="text-xs shrink-0">
                      Editar
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">SKUs Vinculados</span>
                      <strong className="text-sm font-bold text-white font-mono-custom mt-0.5 block">{c._count?.products ?? 0} itens</strong>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Notas Emitidas</span>
                      <strong className="text-sm font-bold text-blue-400 font-mono-custom mt-0.5 block">{c._count?.nfs ?? 0} NFs</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[11px] text-slate-300">
                  {c.contato && (
                    <p className="truncate flex items-center gap-1.5">
                      <UserCheck size={12} className="text-blue-400 shrink-0" />
                      <span>{c.contato}</span>
                    </p>
                  )}
                  {c.email && (
                    <p className="truncate flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span>{c.email}</span>
                    </p>
                  )}
                  {c.telefone && (
                    <p className="truncate flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span>{c.telefone}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Cliente */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={isEdit ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-4">
            <Input label="Razão Social / Nome da Empresa" placeholder="Ex: Nissan do Brasil Automóveis Ltda" error={errors.nome?.message} {...register('nome')} />
            <Input label="CNPJ" placeholder="00.000.000/0000-00" error={errors.cnpj?.message} {...register('cnpj')} />
            <Input label="Responsável / Ponto de Contato" placeholder="Ex: João Silva - Logística" {...register('contato')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="E-mail de Contato" type="email" placeholder="contato@empresa.com" error={errors.email?.message} {...register('email')} />
              <Input label="Telefone" placeholder="(11) 99999-9999" {...register('telefone')} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={createCliente.isPending || updateCliente.isPending}>
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
