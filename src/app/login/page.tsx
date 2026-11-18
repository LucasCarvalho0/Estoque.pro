'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { Loader2, Package, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

const schema = z.object({ 
  matricula: z.string().min(1, 'Informe sua matrícula'), 
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres') 
});
type Form = z.infer<typeof schema>;

const enterpriseFeatures = [
  { title: 'Rastreabilidade Total', desc: 'Gestão de entradas, saídas e movimentações vinculadas ao operador e nota fiscal.' },
  { title: 'Prevenção de Ruptura', desc: 'Alertas automáticos quando o saldo atinge o ponto de pedido ou nível crítico.' },
  { title: 'Auditoria de Inventário', desc: 'Sessões de conferência periódica com conciliação física e relatório de divergências.' },
  { title: 'Conformidade Fiscal', desc: 'Controle de notas fiscais de clientes com exportação automatizada em Excel e PDF.' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated } = useAuthStore();
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const onSubmit = async (data: Form) => {
    setError('');
    try {
      const res = await authService.login(data.matricula, data.senha);
      setAuth(res.user, res.access_token);
      router.push('/dashboard');
    } catch (err: any) { setError(err?.response?.data?.message ?? 'Matrícula ou senha incorretos'); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#090e17] text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Painel Institucional / Apresentação */}
      <div
        className="hidden md:flex flex-col justify-between w-full md:w-[420px] lg:w-[480px] xl:w-[520px] flex-shrink-0 p-8 lg:p-12 bg-[#0d1424] border-r border-slate-800"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <p className="font-bold text-white text-lg tracking-tight leading-tight">StockPRO</p>
              <p className="text-[11px] text-slate-400 font-medium">Controle de Estoque Corporativo</p>
            </div>
          </div>
          
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 tracking-tight leading-snug">
            Gestão profissional e rastreabilidade para o seu estoque
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-10">
            Plataforma corporativa para controle de fluxo de materiais, auditorias semanais de inventário e conformidade fiscal de clientes.
          </p>

          {/* Destaques do Sistema */}
          <div className="space-y-4">
            {enterpriseFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé Institucional */}
        <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            Ambiente Seguro
          </span>
          <span>Versão 2.4</span>
        </div>
      </div>

      {/* Header Mobile */}
      <div className="md:hidden p-5 flex items-center justify-between bg-[#0d1424] border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white">
            <Package size={18} />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">StockPRO</p>
            <p className="text-[10px] text-slate-400">Controle de Estoque</p>
          </div>
        </div>
        <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
        </span>
      </div>

      {/* Área do Formulário de Acesso */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div
          className="w-full max-w-[380px]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.3s 0.1s ease, transform 0.3s 0.1s ease',
          }}
        >
          {/* Card de Autenticação */}
          <div className="enterprise-panel p-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Acesso ao Sistema
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Informe sua matrícula e senha corporativa para prosseguir.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Matrícula
                </label>
                <input
                  {...register('matricula')}
                  placeholder="Ex: 116221"
                  autoComplete="username"
                  className="w-full h-10 bg-slate-900/90 border border-slate-700 rounded-md px-3 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors placeholder:text-slate-500"
                />
                {errors.matricula && <p className="text-xs text-rose-400">{errors.matricula.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Senha
                </label>
                <input
                  {...register('senha')}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-10 bg-slate-900/90 border border-slate-700 rounded-md px-3 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors placeholder:text-slate-500"
                />
                {errors.senha && <p className="text-xs text-rose-400">{errors.senha.message}</p>}
              </div>

              {error && (
                <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs fade-in flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium text-sm transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 press-effect mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500">
                StockPRO • VPC Logística & Distribuição
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}