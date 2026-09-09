'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const styles = {
    success: { bg: 'bg-success-bg border-success/30', text: 'text-success', icon: <CheckCircle size={16} /> },
    error: { bg: 'bg-danger-bg border-danger/30', text: 'text-danger', icon: <XCircle size={16} /> },
    warning: { bg: 'bg-warning-bg border-warning/30', text: 'text-warning', icon: <AlertTriangle size={16} /> },
  }[toast.type];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-modal slide-up ${styles.bg} min-w-[280px] max-w-sm`}>
      <span className={styles.text}>{styles.icon}</span>
      <p className="flex-1 text-sm font-medium text-foreground">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-muted-foreground hover:text-foreground transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(type: ToastType, message: string) {
    const id = `toast-${Date.now()}`;
    setToasts((p) => [...p, { id, type, message }]);
  }

  function removeToast(id: string) {
    setToasts((p) => p.filter((t) => t.id !== id));
  }

  return { toasts, addToast, removeToast };
}