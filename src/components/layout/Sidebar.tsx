import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useAlertsResumo } from '@/hooks';
import { getDescricaoTurno } from '@/lib/shifts';
import { Modal, ModalBody, ModalFooter, Button } from '@/components/ui';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Lucide.LayoutDashboard, section: 'principal' },
  { href: '/estoque', label: 'Estoque', icon: Lucide.Package, section: 'principal' },
  { href: '/alertas', label: 'Alertas', icon: Lucide.AlertTriangle, section: 'principal', badge: true },
  { href: '/nf', label: 'NF de Clientes', icon: Lucide.FileDown, section: 'operacoes' },
  { href: '/movimentacao', label: 'Movimentação', icon: Lucide.ArrowLeftRight, section: 'operacoes' },
  { href: '/inventario', label: 'Inventário', icon: Lucide.ClipboardList, section: 'operacoes' },
  { href: '/relatorios', label: 'Relatórios', icon: Lucide.FileText, section: 'operacoes' },
  { href: '/auditoria', label: 'Auditoria', icon: Lucide.ScrollText, section: 'operacoes' },
  { href: '/produtos', label: 'Produtos', icon: Lucide.Boxes, section: 'cadastros' },
  { href: '/clientes', label: 'Clientes', icon: Lucide.Building2, section: 'cadastros' },
  { href: '/fornecedores', label: 'Fornecedores', icon: Lucide.Truck, section: 'cadastros' },
  { href: '/usuarios', label: 'Usuários', icon: Lucide.Users, section: 'cadastros', roles: ['ADMINISTRADOR'] },
];

const sections: Record<string, string> = { principal: 'Principal', operacoes: 'Operações', cadastros: 'Cadastros' };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { data: resumo } = useAlertsResumo();

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Gerencia colapso automático inteligente (apenas no threshold)
  useEffect(() => {
    let lastWidth = window.innerWidth;
    
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      
      // Se cruzou o threshold de 1280px vindo de cima
      if (currentWidth < 1280 && lastWidth >= 1280) {
        setSidebarCollapsed(true);
      } 
      // Se cruzou o threshold de 1280px vindo de baixo
      else if (currentWidth >= 1280 && lastWidth < 1280) {
        setSidebarCollapsed(false);
      }
      
      lastWidth = currentWidth;
    };

    // Estado inicial baseado na largura atual
    if (window.innerWidth < 1280) setSidebarCollapsed(true);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    clearAuth();
    router.push('/login');
    setShowLogoutModal(false);
  };

  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (item.roles && !item.roles.includes(user?.role ?? '')) return acc;
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const roleColors: Record<string, string> = {
    ADMINISTRADOR: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    LIDER: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    ESTOQUISTA: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  };

  const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

  return (
    <>
      {/* Overlay para mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={cn(
          'fixed inset-y-0 left-0 lg:static h-screen flex flex-col transition-all duration-300 ease-in-out z-50',
          isCollapsed ? 'w-[70px]' : 'w-[260px]',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )} 
        style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
      {/* Brand & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Lucide.Package className="text-white" size={18} />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">StockPRO</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto">
            <Lucide.Package className="text-white" size={20} />
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-indigo-600 text-white items-center justify-center shadow-lg hover:bg-indigo-500 transition-colors z-50 lg:flex hidden"
        >
          {isCollapsed ? <Lucide.ChevronRight size={14} /> : <Lucide.ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto scrollbar-hide px-3 space-y-8">
        {Object.entries(sections).map(([key, label]) => {
          if (!grouped[key]?.length) return null;
          return (
            <div key={key} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 font-display">
                  {label}
                </p>
              )}
              {grouped[key].map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    title={isCollapsed ? item.label : ''}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive 
                        ? 'bg-indigo-600/10 text-indigo-400 font-medium' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    )}
                  >
                    <Icon size={isCollapsed ? 20 : 18} className={cn('flex-shrink-0 transition-transform duration-200', isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100')} />
                    {!isCollapsed && <span className="text-[13.5px] truncate">{item.label}</span>}
                    
                    {item.badge && resumo && resumo.ativos > 0 && (
                      <span className={cn(
                        'bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full',
                        isCollapsed ? 'absolute top-1 right-1 w-4 h-4' : 'ml-auto px-1.5 py-0.5'
                      )}>
                        {resumo.ativos}
                      </span>
                    )}
                    
                    {isActive && !isCollapsed && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-l-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Profile Card */}
      <div className={cn('p-4 border-t border-white/5 bg-slate-900/40 mt-auto', isCollapsed ? 'items-center flex flex-col justify-center' : '')}>
        {!isCollapsed ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className={cn(
                'px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase border w-fit font-display',
                roleColors[user?.role ?? 'ESTOQUISTA'] || roleColors.ESTOQUISTA
              )}>
                {getDescricaoTurno(user?.role ?? '', (user as any)?.shift ?? 'FORA_DE_TURNO')}
              </div>
              <div className="space-y-0.5">
                <p className="text-[14px] font-bold text-white tracking-tight leading-tight">{user?.nome}</p>
                <p className="text-[11px] text-slate-500 font-mono-custom">Mat. {user?.matricula}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 bg-rose-500/10 text-rose-400 hover:bg-rose-50 hover:text-white border border-rose-500/20"
            >
              <Lucide.LogOut size={14} /> Sair do sistema
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-400/20">
              {user?.nome?.substring(0, 2).toUpperCase()}
            </div>
            <button 
              onClick={handleLogout}
              title="Sair do sistema"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-50 hover:text-white border border-rose-500/20 transition-all"
            >
              <Lucide.LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>

    {/* Logout Confirmation Modal Premium */}
    <Modal 
      open={showLogoutModal} 
      onClose={() => setShowLogoutModal(false)} 
      title="Confirmação de Saída"
      width="max-w-[400px]"
    >
      <ModalBody className="flex flex-col items-center text-center p-10">
        <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-600 mb-6 shadow-xl shadow-rose-100 rotate-3 border-2 border-rose-100">
           <Lucide.LogOut size={36} strokeWidth={2.5} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Sair do StockPRO?</h3>
        <p className="text-[13px] font-semibold text-slate-400 leading-relaxed">
          Você está prestes a encerrar sua sessão atual. Deseja realmente sair do sistema agora?
        </p>
      </ModalBody>
      <ModalFooter className="grid grid-cols-2 gap-4 px-8 pb-8 pt-0 bg-white border-none">
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={() => setShowLogoutModal(false)}
          className="rounded-2xl font-bold"
        >
          Cancelar
        </Button>
        <Button 
          variant="premium" 
          size="lg" 
          onClick={confirmLogout}
          className="bg-rose-600 hover:bg-rose-700 shadow-rose-200"
        >
          Sim, Sair
        </Button>
      </ModalFooter>
    </Modal>
    </>
  );
}
