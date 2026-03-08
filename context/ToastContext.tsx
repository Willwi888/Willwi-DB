import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`fixed top-24 right-10 z-[2000] px-8 py-4 ${
          toast.type === 'error' ? 'bg-rose-600' : 
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-brand-gold'
        } text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl animate-fade-in-up`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};