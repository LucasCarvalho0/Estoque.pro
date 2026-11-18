'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, PageHeader, PageLoading } from '@/components/ui';
import { useLogs } from '@/hooks';
import { formatDateTime } from '@/lib/utils';
import { ScrollText, Filter, ShieldCheck } from 'lucide-react';

const actionColors: Record<string, 'green' | 'red' | 'blue' | 'amber' | 'gray'> = {
  LOGIN: 'gray', LOGOUT: 'gray',
  ENTRADA_REGISTRADA: 'green', PRODUTO_CRIADO: 'green', FORNECEDOR_CRIADO: 'green', USUARIO_CRIADO: 'blue',
  SAIDA_REGISTRADA: 'red',
  INVENTARIO_INICIADO: 'blue', INVENTARIO_FINALIZADO: 'blue',
  ALERTA_GERADO: 'amber',
  PRODUTO_EDITADO: 'gray', USUARIO_EDITADO: 'gray', FORNECEDOR_EDITADO: 'gray',
};

const actionOptions = [
  { value: '', label: 'Todas as operações' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'ENTRADA_REGISTRADA', label: 'Entradas de Estoque' },
  { value: 'SAIDA_REGISTRADA', label: 'Saídas / Baixas' },
  { value: 'INVENTARIO_INICIADO', label: 'Inventário Aberto' },
  { value: 'INVENTARIO_FINALIZADO', label: 'Inventário Concluído' },
  { value: 'ALERTA_GERADO', label: 'Alertas Operacionais' },
  { value: 'PRODUTO_CRIADO', label: 'Cadastro de Produto' },
  { value: 'PRODUTO_EDITADO', label: 'Edição de Produto' },
  { value: 'USUARIO_CRIADO', label: 'Cadastro de Usuário' },
  { value: 'FORNECEDOR_CRIADO', label: 'Cadastro de Fornecedor' },
];

export default function AuditoriaPage() {
  const [actionFilter, setActionFilter] = useState('');
  const { data: logs = [], isLoading } = useLogs({ action: actionFilter || undefined });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 max-w-[1680px] mx-auto min-h-screen pb-12">
        <PageHeader
          title="Trilha de Auditoria e Logs"
          subtitle="Registro cronológico imutável de todas as transações e acessos"
          actions={<Badge variant="blue" className="font-semibold">Rastreabilidade em Tempo Real</Badge>}
        />

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-blue-400 shrink-0" />
              <select
                className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-blue-500 text-white w-full sm:w-64"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                {actionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs font-semibold text-slate-300 font-mono-custom self-end sm:self-auto">
              {logs.length} EVENTOS REGISTRADOS
            </span>
          </CardHeader>

          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
                  <span className="text-xs text-slate-300 font-mono-custom shrink-0 sm:w-36 pt-0.5">
                    {formatDateTime(log.createdAt)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-200">
                      {log.user && (
                        <strong className="text-white font-semibold">{log.user.nome}: </strong>
                      )}
                      <span>{log.descricao}</span>
                    </p>
                    {log.ipAddress && (
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono-custom">Origem IP: {log.ipAddress}</p>
                    )}
                  </div>
                  <div className="self-start sm:self-auto pt-1 sm:pt-0">
                    <Badge variant={actionColors[log.action] ?? 'gray'} className="text-[10px] uppercase font-semibold">
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-16 text-center text-slate-300 flex flex-col items-center gap-2">
                  <ScrollText size={32} className="text-slate-500" />
                  <p className="font-semibold text-white">Nenhum evento registrado</p>
                  <p className="text-xs text-slate-400">Nenhum registro encontrado para a operação selecionada.</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
