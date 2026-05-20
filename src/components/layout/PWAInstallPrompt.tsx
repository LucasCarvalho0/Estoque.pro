'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter, Button } from '@/components/ui';
import { Share, Download, X } from 'lucide-react';
import Image from 'next/image';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      // Impedir que o mini-infobar apareça no mobile
      e.preventDefault();
      // Guardar o evento para ser acionado depois
      setDeferredPrompt(e);
      // Mostrar nosso próprio prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Mostrar o prompt nativo
    deferredPrompt.prompt();
    
    // Esperar pela escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário escolheu: ${outcome}`);
    
    // Limpar o prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Opcional: salvar no localStorage para não perguntar de novo por X dias
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt && !isIOS) return null;
  
  if (isIOS && !showPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
    return (
      <Modal 
        open={true} 
        onClose={() => setIsIOS(false)} 
        title="Instalar no iPhone / iPad"
        width="max-w-sm"
      >
        <ModalBody className="flex flex-col items-center text-center gap-6 py-8">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-500/20 flex items-center justify-center border-4 border-white overflow-hidden">
            <img src="/icons/icon-512x512.png" alt="StockPRO Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Adicionar à Tela de Início</h3>
            <p className="text-sm text-slate-500 font-medium px-4 leading-relaxed">
              Para instalar o aplicativo no iOS, toque no botão de <Share size={16} className="inline mb-1" /> Compartilhar no menu inferior e depois selecione <strong className="text-slate-700">"Adicionar à Tela de Início"</strong>.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-center bg-white p-6 border-t-0">
          <Button variant="secondary" onClick={() => setIsIOS(false)} className="w-full h-12 rounded-2xl font-bold">Entendi</Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal 
      open={showPrompt} 
      onClose={handleDismiss} 
      title="Instalar Aplicativo StockPRO"
      width="max-w-sm"
    >
      <ModalBody className="flex flex-col items-center text-center gap-6 py-8">
        <div className="w-24 h-24 rounded-[2rem] bg-blue-600 shadow-2xl shadow-blue-500/20 flex items-center justify-center border-4 border-white overflow-hidden">
          <img src="/icons/icon-512x512.png" alt="StockPRO Logo" className="w-full h-full object-cover" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Experiência Completa</h3>
          <p className="text-sm text-slate-500 font-medium px-4">
            Deseja instalar o **StockPRO** no seu dispositivo para um acesso mais rápido e profissional?
          </p>
        </div>
      </ModalBody>
      
      <ModalFooter className="grid grid-cols-2 gap-3 bg-white p-6 border-t-0">
        <Button 
          variant="secondary" 
          onClick={handleDismiss}
          className="h-12 rounded-2xl font-bold border-slate-200"
        >
          Agora não
        </Button>
        <Button 
          variant="primary" 
          onClick={handleInstall}
          className="h-12 rounded-2xl font-bold premium-gradient shadow-lg shadow-blue-200"
        >
          Sim, instalar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
