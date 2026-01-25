
import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, title, description, type = 'info', duration = 3000, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entry animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation to finish before unmounting
      setTimeout(() => onDismiss(id), 300); 
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 300);
  }

  const icons = {
      success: <CheckCircle2 className="text-emerald-500 drop-shadow-md" size={24} />,
      error: <AlertCircle className="text-red-500 drop-shadow-md" size={24} />,
      info: <Info className="text-blue-500 drop-shadow-md" size={24} />
  };

  // Modern Glassmorphism Style
  return (
    <div 
        className={cn(
            "pointer-events-auto flex w-full max-w-sm rounded-xl border p-4 gap-4 transition-all duration-500 ease-out transform mb-3 shadow-2xl backdrop-blur-xl relative overflow-hidden group",
            isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95",
            type === 'success' ? "bg-emerald-950/80 border-emerald-500/30" : 
            type === 'error' ? "bg-red-950/80 border-red-500/30" : 
            "bg-zinc-900/90 border-zinc-800"
        )}
        role="alert"
    >
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        {/* Glow behind icon */}
        <div className={cn(
            "absolute -left-4 -top-4 w-24 h-24 bg-gradient-to-br rounded-full blur-2xl opacity-20",
            type === 'success' ? "from-emerald-500 to-transparent" :
            type === 'error' ? "from-red-500 to-transparent" :
            "from-blue-500 to-transparent"
        )} />

        <div className="shrink-0 pt-0.5 relative z-10">
            {icons[type]}
        </div>
        
        <div className="flex-1 relative z-10">
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">{title}</h3>
            {description && <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>}
        </div>
        
        <button onClick={handleDismiss} className="shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors relative z-10 self-start">
            <X size={16} />
        </button>
    </div>
  );
};

export const Toaster: React.FC<{ toasts: ToastProps[], onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end w-full max-w-[420px] pointer-events-none gap-2">
            {toasts.map(t => (
                <Toast key={t.id} {...t} onDismiss={onDismiss} />
            ))}
        </div>
    )
}
