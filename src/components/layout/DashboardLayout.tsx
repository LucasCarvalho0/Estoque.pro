'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/store/auth.store';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [pageKey, setPageKey] = useState(pathname);
  const [showProgress, setShowProgress] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      setShowProgress(true);
      setPageKey(pathname);
      prevPath.current = pathname;
      const t = setTimeout(() => setShowProgress(false), 500);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#090e17] text-slate-100 antialiased selection:bg-blue-600/30 selection:text-blue-200">
      {/* Indicador de progresso suave */}
      {showProgress && <div className="route-progress" />}

      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 scroll-smooth bg-[#090e17] relative w-full min-w-0">
          <div
            key={pageKey}
            className="max-w-[1680px] mx-auto page-transition-enter relative z-10 w-full min-w-0"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
