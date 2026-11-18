'use client';
import { useEffect, useState } from 'react';
import * as Lucide from 'lucide-react';
import { useAlertsResumo } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

export function Topbar() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useUIStore();
  const { data: resumo } = useAlertsResumo();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 lg:px-6 flex-shrink-0 z-30 select-none">
      {/* Lado Esquerdo: Mobile Menu + Status Operacional */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-md bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 press-effect"
          title="Abrir menu de navegação"
        >
          <Lucide.Menu size={18} />
        </button>

        {/* Indicador de Status Corporativo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Sistema Operacional</span>
            <span className="sm:hidden text-[11px]">Online</span>
          </div>

          <span className="hidden xl:inline text-xs text-slate-500">|</span>
          <span className="hidden xl:inline text-xs text-slate-300">
            Unidade: <strong className="text-white font-medium">VPC São Paulo</strong>
          </span>
        </div>
      </div>

      {/* Lado Direito: Horário, Alertas e Usuário */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Relógio do Sistema */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700/80 text-xs text-slate-200">
          <Lucide.Clock size={13} className="text-blue-400" />
          <span className="font-mono-custom tabular-nums font-medium">{timeStr || '--:--:--'}</span>
          <span className="text-[10px] text-slate-400 font-semibold">BRT</span>
        </div>

        {/* Notificações / Alertas */}
        <a
          href="/alertas"
          className="relative p-2 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 press-effect"
          title="Central de alertas"
        >
          <Lucide.Bell size={16} />
          {resumo && resumo.ativos > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {resumo.ativos}
            </span>
          )}
        </a>

        {/* Perfil do Usuário */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-md bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs font-mono-custom">
            {user?.nome?.substring(0, 2).toUpperCase() || 'US'}
          </div>

          <div className="hidden md:flex flex-col text-left leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {user?.nome}
              </span>
              {user?.matricula === '116221' && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Responsável
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-300 font-mono-custom">
              Mat. <strong className="text-white font-medium">{user?.matricula}</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
