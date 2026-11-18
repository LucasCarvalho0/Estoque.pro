'use client';
import { cn } from '@/lib/utils';
import * as Lucide from 'lucide-react';
import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef, useState } from 'react';

// Button — Enterprise Standard
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

export function Button({ variant = 'secondary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  const v = { 
    primary: 'bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm border border-blue-500/30', 
    secondary: 'bg-slate-800/80 hover:bg-slate-750 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm', 
    danger: 'bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-600/30 shadow-sm', 
    success: 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-600/30 shadow-sm', 
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent', 
    outline: 'bg-transparent border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white',
    premium: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-sm border border-blue-400/30'
  };

  const s = { 
    sm: 'px-3 py-1.5 text-xs rounded-md', 
    md: 'px-4 py-2 text-[13px] rounded-md', 
    lg: 'px-5 py-2.5 text-sm font-medium rounded-md',
    xl: 'px-7 py-3.5 text-base font-semibold rounded-lg'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 tracking-tight transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none press-effect',
        v[variant], s[size], className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Lucide.Loader2 size={14} className="animate-spin" />}{children}
    </button>
  );
}

// Badge — Corporate Status Pill
interface BadgeProps { 
  variant?: 'default' | 'red' | 'green' | 'amber' | 'blue' | 'gray' | 'glass'; 
  children: React.ReactNode; 
  className?: string; 
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const v = { 
    default: 'bg-slate-800 text-slate-200 border-slate-700', 
    red: 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold', 
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold', 
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold', 
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold', 
    gray: 'bg-slate-800 text-slate-300 border-slate-700 font-medium',
    glass: 'bg-slate-900/90 backdrop-blur border-slate-700 text-slate-200 font-medium'
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full border', v[variant], className)}>
      {children}
    </span>
  );
}

// Card — Corporate Panel
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'enterprise-panel enterprise-panel-hover rounded-lg overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800/80 bg-slate-900/30', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-100 tracking-tight flex items-center gap-2', className)}>
      {children}
    </h3>
  );
}

// Input — Clean Form Input
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-200">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md outline-none',
          'transition-colors text-white placeholder:text-slate-400',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20',
          error && 'border-rose-500 focus:border-rose-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 fade-in">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

// Select — Clean Form Select
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-200">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md outline-none',
          'transition-colors text-white',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20',
          error && 'border-rose-500 focus:border-rose-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';

// Textarea — Clean Form Textarea
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ label, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-200">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-md outline-none',
          'transition-colors text-white placeholder:text-slate-400 resize-none',
          'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20',
          className
        )}
        {...props}
      />
    </div>
  ),
);
Textarea.displayName = 'Textarea';

// Modal — Clean Enterprise Modal
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string; }
export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  const [visible, setVisible] = useState(open);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setAnimating(true);
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        style={{
          opacity: animating ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
        onClick={onClose}
      />
      <div
        className={cn('bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl w-full relative z-10 overflow-hidden', width)}
        style={{
          opacity: animating ? 1 : 0,
          transform: animating ? 'scale(1)' : 'scale(0.98)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors press-effect"
          >
            <Lucide.X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-5 text-slate-200 text-sm', className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-end gap-2.5 px-5 py-3.5 bg-slate-900/40 border-t border-slate-800", className)}>
      {children}
    </div>
  );
}

// StatCard — Executive KPI Card
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  valueClass?: string;
  icon?: any;
  footer?: React.ReactNode;
}

function useCountUp(target: number, duration = 500): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export function StatCard({ label, value, sub, accent = '#2563eb', valueClass, icon: Icon, footer }: StatCardProps) {
  const isNumeric = typeof value === 'number';
  const animatedValue = useCountUp(isNumeric ? (value as number) : 0, 500);
  const displayValue = isNumeric ? animatedValue : value;

  return (
    <div className="enterprise-panel enterprise-panel-hover p-4 relative overflow-hidden flex flex-col justify-between h-full select-none">
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-200">
            {label}
          </span>
          {Icon && (
            <div 
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              <Icon size={15} />
            </div>
          )}
        </div>
        
        {/* Valor Principal */}
        <div className="space-y-1">
          <p className={cn('text-2xl md:text-3xl font-bold tracking-tight text-white font-mono-custom tabular-nums', valueClass)}>
            {displayValue}
          </p>
          {sub && (
            <p className="text-xs text-slate-300 font-medium">
              {sub}
            </p>
          )}
        </div>
      </div>

      {footer && (
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-300">
          {footer}
        </div>
      )}
    </div>
  );
}

// QtyBar — Linear Stock Health Bar
export function QtyBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);

  const colors = value <= min 
    ? { bg: 'bg-rose-950/30', bar: 'bg-rose-500', text: 'text-rose-400' } 
    : value <= min * 1.5 
      ? { bg: 'bg-amber-950/30', bar: 'bg-amber-500', text: 'text-amber-400' } 
      : { bg: 'bg-emerald-950/30', bar: 'bg-emerald-500', text: 'text-emerald-400' };

  return (
    <div className="flex items-center gap-2.5 w-full max-w-[190px]">
      <div className={cn("h-1.5 flex-1 rounded-full overflow-hidden bg-slate-800", colors.bg)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold min-w-[28px] text-right font-mono-custom tabular-nums", colors.text)}>{value}</span>
    </div>
  );
}

// PageHeader — Executive Page Header
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800 fade-in-down">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// PageLoading — Corporate Spinner
export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] gap-3 select-none">
      <Lucide.Loader2 size={32} className="animate-spin text-blue-500" />
      <p className="text-xs text-slate-400 font-medium">Carregando informações...</p>
    </div>
  );
}

// InfoBanner — Corporate Notice Banner
interface InfoBannerProps { type?: 'info' | 'warning' | 'success'; children: React.ReactNode; className?: string; }
export function InfoBanner({ type = 'info', children, className }: InfoBannerProps) {
  const s = { 
    info: 'bg-blue-950/20 border-blue-800/40 text-blue-200', 
    warning: 'bg-amber-950/20 border-amber-800/40 text-amber-200', 
    success: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' 
  };
  const icons = { info: Lucide.Info, warning: Lucide.AlertCircle, success: Lucide.CheckCircle2 };
  const Icon = icons[type];

  return (
    <div className={cn('px-4 py-3 rounded-md border flex items-start gap-2.5 text-xs font-medium leading-relaxed', s[type], className)}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
