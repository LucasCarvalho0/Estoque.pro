'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal, ModalBody, ModalFooter, Button, Input, Select, Textarea, InfoBanner, Badge } from '@/components/ui';
import { useCreateMovement, useProducts, useCreateProduct, useUpdateProduct, useSuppliers, useIniciarInventario, useCreateSupplier, useTransferToNG } from '@/hooks';
import { suppliersService, usersService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import * as Lucide from 'lucide-react';
import type { Product, MovementType, Supplier } from '@/types';

// ─── Movement Modal ────────────────────────────────────────────────────────────
const movSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  quantidade: z.coerce.number().min(1, 'Mínimo 1'),
  notaFiscal: z.string().optional(),
  observacao: z.string().optional(),
});
type MovForm = z.infer<typeof movSchema>;

export function MovementModal({ 
  open, 
  onClose, 
  type, 
  preSelectedProductId,
  preFilledQuantity 
}: { 
  open: boolean; 
  onClose: () => void; 
  type: MovementType; 
  preSelectedProductId?: string;
  preFilledQuantity?: number;
}) {
  const { data: products = [] } = useProducts();
  const createMovement = useCreateMovement();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MovForm>({ 
    resolver: zodResolver(movSchema), 
    defaultValues: { 
      productId: preSelectedProductId ?? '',
      quantidade: preFilledQuantity ?? 0
    } 
  });

  useEffect(() => {
    if (open) {
      reset({ 
        productId: preSelectedProductId ?? '', 
        quantidade: preFilledQuantity ?? 0 
      });
    }
  }, [open, preSelectedProductId, preFilledQuantity, reset]);

  const onSubmit = async (data: MovForm) => {
    try { 
      await createMovement.mutateAsync({ ...data, type }); 
      toast.success(type === 'ENTRADA' ? 'Entrada registrada com sucesso!' : 'Saída registrada com sucesso!');
      reset(); 
      onClose(); 
    }
    catch (err: any) { 
      toast.error(err?.response?.data?.message ?? 'Erro ao registrar movimentação'); 
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={type === 'ENTRADA' ? 'Registrar Entrada (NF)' : 'Registrar Saída'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <Select label="Produto" error={errors.productId?.message} {...register('productId')}>
            <option value="">Selecione...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.codigo} — {p.nome} (Estoque: {p.quantidade} {p.unidade})</option>)}
          </Select>
          <Input label="Quantidade" type="number" min={1} error={errors.quantidade?.message} {...register('quantidade')} />
          {type === 'ENTRADA' && <Input label="Nota Fiscal" placeholder="NF-XXXXX" {...register('notaFiscal')} />}
          <Textarea label="Observações (opcional)" rows={2} {...register('observacao')} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={createMovement.isPending}>Confirmar {type === 'ENTRADA' ? 'Entrada' : 'Saída'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Product Modal ─────────────────────────────────────────────────────────────
const prodSchema = z.object({
  codigo: z.string().min(1), nome: z.string().min(1), descricao: z.string().optional(),
  unidade: z.string().min(1), quantidade: z.coerce.number().min(0), quantidadeNG: z.coerce.number().min(0).default(0),
  quantidadeMinima: z.coerce.number().min(0), supplierId: z.string().min(1, 'Selecione fornecedor'),
});
type ProdForm = z.infer<typeof prodSchema>;

export function ProductModal({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product }) {
  const { data: suppliers = [] } = useSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = !!product;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProdForm>({ resolver: zodResolver(prodSchema) });

  useEffect(() => {
    if (product) reset({ codigo: product.codigo, nome: product.nome, descricao: product.descricao ?? '', unidade: product.unidade, quantidade: product.quantidade, quantidadeNG: product.quantidadeNG ?? 0, quantidadeMinima: product.quantidadeMinima, supplierId: product.supplierId });
    else reset({ codigo: '', nome: '', descricao: '', unidade: 'un', quantidade: 0, quantidadeNG: 0, quantidadeMinima: 0, supplierId: '' });
  }, [product, open]);

  const onSubmit = async (data: ProdForm) => {
    try {
      if (isEdit) await updateProduct.mutateAsync({ id: product!.id, data });
      else await createProduct.mutateAsync(data);
      toast.success(isEdit ? 'Produto atualizado!' : 'Produto cadastrado!');
      onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Erro ao salvar'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Produto' : 'Novo Produto'} width="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Código" placeholder="EST-001" error={errors.codigo?.message} {...register('codigo')} disabled={isEdit} />
            <Input label="Unidade" placeholder="un / kg / l" error={errors.unidade?.message} {...register('unidade')} />
          </div>
          <Input label="Nome do Produto" error={errors.nome?.message} {...register('nome')} />
          <Textarea label="Descrição (opcional)" rows={2} {...register('descricao')} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Quantidade" type="number" min={0} error={errors.quantidade?.message} {...register('quantidade')} />
            <Input label="Qtd NG (Sucata)" type="number" min={0} error={errors.quantidadeNG?.message} {...register('quantidadeNG')} />
            <Input label="Qtd Mínima" type="number" min={0} error={errors.quantidadeMinima?.message} {...register('quantidadeMinima')} />
          </div>
          <Select label="Fornecedor" error={errors.supplierId?.message} {...register('supplierId')}>
            <option value="">Selecione...</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={createProduct.isPending || updateProduct.isPending}>{isEdit ? 'Salvar' : 'Cadastrar'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── NG Transfer Modal ─────────────────────────────────────────────────────────
const ngSchema = z.object({
  quantidade: z.coerce.number().min(1, 'Mínimo de 1 peça'),
  observacao: z.string().optional(),
});
type NgForm = z.infer<typeof ngSchema>;

export function NgTransferModal({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product }) {
  const transferToNG = useTransferToNG();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NgForm>({ resolver: zodResolver(ngSchema) });

  useEffect(() => { if (open) reset({ quantidade: 0, observacao: '' }); }, [open, reset]);

  const onSubmit = async (data: NgForm) => {
    try {
      if (!product) return;
      await transferToNG.mutateAsync({ id: product.id, ...data });
      toast.success('Sucata (NG) registrada com sucesso!');
      onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Erro ao transferir para sucata'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Baixa para Sucata (NG)">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <InfoBanner type="warning">Você está movendo estoque Bom de {product?.nome} para o estoque de Sucata (Avarias).</InfoBanner>
          <Input label="Quantidade Avariada" type="number" min={1} max={product?.quantidade} error={errors.quantidade?.message} {...register('quantidade')} />
          <Textarea label="Motivo / Observação (Recomendado)" rows={2} {...register('observacao')} placeholder="Descreva o motivo da baixa..." />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="submit" variant="danger" loading={transferToNG.isPending} className="font-semibold px-6">Confirmar Baixa para Sucata</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Inventario Modal ──────────────────────────────────────────────────────────
const invSchema = z.object({ responsavel: z.string().min(2), matricula: z.string().min(1) });
type InvForm = z.infer<typeof invSchema>;

export function InventarioModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const iniciar = useIniciarInventario();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvForm>({ resolver: zodResolver(invSchema) });

  const onSubmit = async (data: InvForm) => {
    try { await iniciar.mutateAsync(data); toast.success('Inventário iniciado com sucesso!'); reset(); onSuccess(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Erro ao iniciar inventário'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Iniciar Inventário Semanal">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <InfoBanner type="info">Apenas um inventário pode estar ativo por vez. O registro é permanente e imutável.</InfoBanner>
          <Input label="Nome do Responsável" placeholder="Nome completo" error={errors.responsavel?.message} {...register('responsavel')} />
          <Input label="Matrícula" placeholder="Ex: 4821" error={errors.matricula?.message} {...register('matricula')} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={iniciar.isPending}>Iniciar Inventário</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Supplier Modal ────────────────────────────────────────────────────────────
const supSchema = z.object({
  nome: z.string().min(1), cnpj: z.string().optional(),
  email: z.string().email('Inválido').optional().or(z.literal('')),
  telefone: z.string().optional(), contato: z.string().optional(),
});
type SupForm = z.infer<typeof supSchema>;

export function SupplierModal({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier?: Supplier }) {
  const qc = useQueryClient();
  const createSupplier = useCreateSupplier();
  const isEdit = !!supplier;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupForm>({ resolver: zodResolver(supSchema) });

  useEffect(() => {
    if (supplier) reset({ nome: supplier.nome, cnpj: supplier.cnpj ?? '', email: supplier.email ?? '', telefone: supplier.telefone ?? '', contato: supplier.contato ?? '' });
    else reset({ nome: '', cnpj: '', email: '', telefone: '', contato: '' });
  }, [supplier, open]);

  const onSubmit = async (data: SupForm) => {
    try {
      if (isEdit) { await suppliersService.update(supplier!.id, data); qc.invalidateQueries({ queryKey: ['suppliers'] }); }
      else await createSupplier.mutateAsync(data);
      toast.success(isEdit ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!');
      onClose();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Erro ao salvar fornecedor'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'} width="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <Input label="Razão Social / Nome" error={errors.nome?.message} {...register('nome')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="CNPJ" placeholder="00.000.000/0001-00" {...register('cnpj')} />
            <Input label="Telefone" {...register('telefone')} />
          </div>
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Nome do Contato" {...register('contato')} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={createSupplier.isPending}>{isEdit ? 'Salvar' : 'Cadastrar'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── User Modal ────────────────────────────────────────────────────────────────
const userSchema = z.object({
  matricula: z.string().min(1), nome: z.string().min(2),
  email: z.string().email(), senha: z.string().min(6),
  role: z.enum(['ESTOQUISTA', 'LIDER', 'ADMINISTRADOR']),
});
type UserForm = z.infer<typeof userSchema>;

export function UserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { role: 'ESTOQUISTA' } });

  const onSubmit = async (data: UserForm) => {
    try { await usersService.create(data); qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuário criado com sucesso!'); reset(); onClose(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Erro ao criar usuário'); }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Novo Usuário">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Matrícula" error={errors.matricula?.message} {...register('matricula')} />
            <Select label="Perfil" error={errors.role?.message} {...register('role')}>
              <option value="ESTOQUISTA">Estoquista</option>
              <option value="LIDER">Líder</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </Select>
          </div>
          <Input label="Nome Completo" error={errors.nome?.message} {...register('nome')} />
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          
          <div className="relative">
            <Input 
              label="Senha inicial" 
              type={showPassword ? 'text' : 'password'} 
              error={errors.senha?.message} 
              {...register('senha')} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <Lucide.EyeOff size={16} /> : <Lucide.Eye size={16} />}
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>Criar Usuário</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Movements Detail Modal ───────────────────────────────────────────────────
export function MovementsDetailModal({ open, onClose, movements }: { 
  open: boolean; 
  onClose: () => void; 
  movements: any[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Auditoria Completa de Movimentações" width="max-w-5xl">
      <ModalBody className="p-0 overflow-hidden">
        {/* Header de resumo */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Lucide.History size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-tight">Registro Consolidado de Transações</p>
              <p className="text-[11px] text-slate-300 font-mono-custom">{movements.length} eventos registrados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {movements.filter((m: any) => m.type === 'ENTRADA').length} Entradas
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300 bg-rose-500/15 px-2.5 py-1 rounded-md border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {movements.filter((m: any) => m.type === 'SAIDA').length} Saídas
            </span>
          </div>
        </div>

        {/* Lista de movimentações */}
        <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-800/80">
          {movements.length === 0 ? (
            <div className="py-16 text-center text-slate-300">
              <Lucide.PackageOpen size={36} className="mx-auto text-slate-500 mb-2" />
              <p className="font-semibold text-white">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            movements.map((m: any) => (
              <div key={m.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1.5fr] hover:bg-slate-800/40 transition-colors p-4 sm:px-6 sm:py-3.5 gap-3 items-center">
                {/* Material */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${
                    m.type === 'ENTRADA' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}>
                    {m.type === 'ENTRADA' ? <Lucide.PackagePlus size={15} /> : <Lucide.PackageMinus size={15} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{m.product?.nome}</p>
                    <p className="text-[11px] text-slate-300 font-mono-custom mt-0.5">{m.product?.codigo}</p>
                    {m.observacao && (
                      <p className="text-[11px] text-amber-300 mt-0.5 italic">{m.observacao}</p>
                    )}
                  </div>
                </div>

                {/* Operação */}
                <div className="flex flex-col gap-1">
                  <Badge variant={m.type === 'ENTRADA' ? 'green' : 'red'}>
                    {m.type}
                  </Badge>
                  {m.user && (
                    <span className="text-[11px] text-slate-300 font-medium">
                      Op: {m.user.nome?.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Quantidade */}
                <div>
                  <span className={`text-base font-bold font-mono-custom ${m.type === 'ENTRADA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.type === 'ENTRADA' ? '+' : '-'}{m.quantidade} {m.product?.unidade}
                  </span>
                </div>

                {/* Data/Hora */}
                <div className="text-right sm:text-left">
                  <p className="text-xs font-semibold text-slate-200">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p className="text-[11px] text-slate-400 font-mono-custom">
                    {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {m.notaFiscal && ` · NF: ${m.notaFiscal}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
