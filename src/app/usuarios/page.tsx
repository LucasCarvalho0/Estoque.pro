'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageHeader, PageLoading, Modal, ModalBody, ModalFooter, Input, Select, InfoBanner } from '@/components/ui';
import { useUsers } from '@/hooks';
import { usersService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import * as Lucide from 'lucide-react';
import type { User } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { UserModal } from '@/components/modals';

const roleLabels: Record<string, string> = {
  ESTOQUISTA: 'Estoquista',
  LIDER: 'Líder de Turno',
  ADMINISTRADOR: 'Administrador',
};

const roleBadge: Record<string, 'gray' | 'blue' | 'red'> = {
  ESTOQUISTA: 'gray',
  LIDER: 'blue',
  ADMINISTRADOR: 'red',
};

export default function UsuariosPage() {
  const { user: currentUser } = useAuthStore();
  const isMaster = currentUser?.matricula === '116221';

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: users = [], isLoading } = useUsers();
  const qc = useQueryClient();

  const handleNovoUsuario = () => {
    if (!isMaster) {
      alert('Ação restrita: Apenas o gestor responsável tem permissão para cadastrar novos usuários.');
      return;
    }
    setCreateModalOpen(true);
  };

  const [showEditPassword, setShowEditPassword] = useState(false);
  const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { isSubmitting: isEditing } } = useForm<{ email: string; senha?: string }>();

  const onEditSubmit = async (data: { email: string; senha?: string }) => {
    if (!selectedUser) return;
    try {
      const payload = { ...data };
      if (!payload.senha) delete payload.senha;
      
      await usersService.update(selectedUser.id, payload);
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditModalOpen(false);
      resetEdit();
      setShowEditPassword(false);
    } catch {
      alert('Erro ao atualizar usuário');
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    resetEdit({ email: user.email, senha: '' });
    setShowEditPassword(false);
    setEditModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Gestão de Usuários e Permissões"
          subtitle="Equipe administrativa, líderes operacionais e estoquistas"
          actions={
            isMaster && (
              <Button variant="primary" size="sm" onClick={handleNovoUsuario} className="gap-2">
                <Lucide.Plus size={14} /> Novo Colaborador
              </Button>
            )
          }
        />

        {!isMaster && (
          <InfoBanner type="info">
            Perfil de visualização. Permissões de alteração de usuários são restritas ao Gestor de Unidade.
          </InfoBanner>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5">
            <CardTitle>Colaboradores Credenciados</CardTitle>
            <Badge variant="blue">{users.length} usuários ativos</Badge>
          </CardHeader>

          {isLoading ? <PageLoading /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="px-5 py-3 font-mono-custom">Matrícula</th>
                    <th className="px-5 py-3">Nome do Colaborador</th>
                    <th className="px-5 py-3">E-mail Corporativo</th>
                    <th className="px-5 py-3">Função / Cargo</th>
                    <th className="px-5 py-3">Status</th>
                    {isMaster && <th className="px-5 py-3 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-300 font-mono-custom font-semibold">
                        {u.matricula}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white">
                        {u.nome}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {u.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={roleBadge[u.role]}>{roleLabels[u.role]}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={u.ativo ? 'green' : 'gray'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                      </td>
                      {isMaster && (
                        <td className="px-5 py-3.5 text-right">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(u)} className="text-xs">
                            Editar
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Edição de Usuário */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Atualizar Cadastro do Usuário">
        <form onSubmit={handleEdit(onEditSubmit)}>
          <ModalBody className="flex flex-col gap-4">
            <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Colaborador</span>
              <p className="text-sm font-bold text-white mt-0.5">{selectedUser?.nome}</p>
              <p className="text-xs text-slate-300 font-mono-custom mt-0.5">
                Matrícula: {selectedUser?.matricula} · Função: {selectedUser && roleLabels[selectedUser.role]}
              </p>
            </div>
            
            <Input label="E-mail Corporativo" type="email" placeholder="email@empresa.com" {...regEdit('email', { required: true })} />
            
            <div className="relative">
              <Input 
                label="Nova Senha (deixe em branco para manter a atual)" 
                type={showEditPassword ? 'text' : 'password'} 
                placeholder="Mínimo 6 caracteres"
                {...regEdit('senha')} 
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-3 top-[32px] text-slate-400 hover:text-white transition-colors"
                title={showEditPassword ? 'Ocultar Senha' : 'Ver Senha'}
              >
                {showEditPassword ? <Lucide.EyeOff size={16} /> : <Lucide.Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 italic">Caso nenhuma senha seja informada, a credencial atual será preservada.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={isEditing}>Salvar Alterações</Button>
          </ModalFooter>
        </form>
      </Modal>
      <UserModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </DashboardLayout>
  );
}
