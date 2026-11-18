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
  { href: '/movimentacao', label: 'Movimentações', icon: Lucide.ArrowLeftRight, section: 'operacoes' },
  { href: '/inventario', label: 'Inventário', icon: Lucide.ClipboardList, section: 'operacoes' },
  { href: '/relatorios', label: 'Relatórios', icon: Lucide.FileText, section: 'operacoes' },
  { href: '/auditoria', label: 'Auditoria de Logs', icon: Lucide.ScrollText, section: 'operacoes' },
  { href: '/produtos', label: 'Produtos', icon: Lucide.Boxes, section: 'cadastros' },
  { href: '/clientes', label: 'Clientes', icon: Lucide.Building2, section: 'cadastros' },
  { href: '/fornecedores', label: 'Fornecedores', icon: Lucide.Truck, section: 'cadastros' },
  { href: '/usuarios', label: 'Usuários', icon: Lucide.Users, section: 'cadastros', roles: ['ADMINISTRADOR'] },
];

const sections: Record<string, string> = { 
  principal: 'Principal', 
  operacoes: 'Operações', 
  cadastros: 'Cadastros' 
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { data: resumo } = useAlertsResumo();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  useEffect(() => {
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth < 1280 && lastWidth >= 1280) setSidebarCollapsed(true);
      else if (currentWidth >= 1280 && lastWidth < 1280) setSidebarCollapsed(false);
      lastWidth = currentWidth;
    };
    if (window.innerWidth < 1280) setSidebarCollapsed(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  const handleLogout = () => setShowLogoutModal(true);
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

  const roleLabels: Record<string, { label: string; class: string }> = {
    ADMINISTRADOR: { label: 'Administrador', class: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    LIDER: { label: 'Líder de Turno', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    ESTOQUISTA: { label: 'Estoquista', class: 'text-slate-300 bg-slate-800 border-slate-700' },
  };

  const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

  return (
    <>
      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={cn(
          'fixed inset-y-0 left-0 lg:static h-screen flex flex-col transition-all duration-200 ease-in-out z-50 select-none bg-[#0a0f1d] border-r border-slate-800/80',
          isCollapsed ? 'w-[68px]' : 'w-[250px]',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )} 
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 relative bg-[#0a0f1d]">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Lucide.Package size={16} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-white text-[15px] tracking-tight">StockPRO</span>
                <span className="text-[10px] text-slate-300 font-medium">Controle Corporativo</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center mx-auto text-white shadow-sm">
              <Lucide.Package size={18} />
            </div>
          )}

          {/* Botão Fechar no Mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar menu"
          >
            <Lucide.X size={18} />
          </button>

          {/* Toggle Button no Desktop */}
          <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 items-center justify-center shadow-md hover:text-white hover:bg-slate-700 transition-colors z-50 lg:flex hidden press-effect"
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <Lucide.ChevronRight size={13} /> : <Lucide.ChevronLeft size={13} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto scrollbar-hide px-3 space-y-6">
          {Object.entries(sections).map(([key, label]) => {
            if (!grouped[key]?.length) return null;
            return (
              <div key={key} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
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
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 group relative font-medium text-[13px]',
                        isActive 
                          ? 'bg-blue-600/20 text-blue-300 font-semibold' 
                          : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                      )}
                    >
                      {/* Marcador ativo lateral */}
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-blue-500 rounded-r" />
                      )}

                      <Icon 
                        size={17} 
                        className={cn(
                          'flex-shrink-0 transition-colors',
                          isActive 
                            ? 'text-blue-400' 
                            : 'text-slate-300 group-hover:text-white'
                        )} 
                      />
                      
                      {!isCollapsed && (
                        <span className="truncate">
                          {item.label}
                        </span>
                      )}
                      
                      {item.badge && resumo && resumo.ativos > 0 && (
                        <span className={cn(
                          'bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full',
                          isCollapsed ? 'absolute top-1.5 right-1.5 w-4 h-4 text-[9px]' : 'ml-auto px-1.5 py-0.2'
                        )}>
                          {resumo.ativos}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Profile Console */}
        <div className={cn(
          'p-3 border-t border-slate-800 bg-[#0c1322] mt-auto',
          isCollapsed ? 'flex flex-col items-center' : ''
        )}>
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-semibold border',
                    roleLabels[user?.role ?? 'ESTOQUISTA']?.class || 'text-slate-200 border-slate-700 bg-slate-800'
                  )}>
                    {roleLabels[user?.role ?? 'ESTOQUISTA']?.label || 'Usuário'}
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {getDescricaoTurno(user?.role ?? '', (user as any)?.shift ?? 'FORA_DE_TURNO')}
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-[13px] font-semibold text-white truncate leading-tight">
                    {user?.nome}
                  </p>
                  <p className="text-[11px] text-slate-300 font-mono-custom mt-0.5">
                    Matrícula: <strong className="text-white font-medium">{user?.matricula}</strong>
                  </p>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 press-effect"
              >
                <Lucide.LogOut size={13} /> Encerrar sessão
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                {user?.nome?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <button 
                onClick={handleLogout}
                title="Encerrar sessão"
                className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors press-effect"
              >
                <Lucide.LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal 
        open={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Encerrar Sessão"
        width="max-w-[380px]"
      >
        <ModalBody className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-700">
            <Lucide.LogOut size={20} />
          </div>
          <h3 className="text-base font-semibold text-slate-100 mb-1">
            Deseja sair do sistema?
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sua sessão atual no StockPRO será finalizada com segurança.
          </p>
        </ModalBody>
        <ModalFooter className="grid grid-cols-2 gap-3 px-6 pb-6 pt-0 border-none bg-transparent">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowLogoutModal(false)}
          >
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={confirmLogout}
          >
            Sair do Sistema
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
