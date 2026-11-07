// 화면 아래에 잠깐 떴다 사라지는 안내

import { Check, Info } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  title: string;
  detail?: string;
  tone: 'done' | 'info';
}

const ToastContext = createContext<(t: Omit<Toast, 'id' | 'tone'> & { tone?: Toast['tone'] }) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number>();

  const show = useCallback((t: Omit<Toast, 'id' | 'tone'> & { tone?: Toast['tone'] }) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), tone: 'done', ...t });
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" role="status">
        {toast && (
          <div
            key={toast.id}
            className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 z-[60] flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 animate-toast items-center gap-3 rounded-full bg-forest px-5 py-3 text-white shadow-soft dark:bg-primary dark:text-primary-ink md:bottom-8"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
              {toast.tone === 'done' ? <Check size={16} strokeWidth={3} /> : <Info size={16} />}
            </span>
            <span className="text-sm">
              <b className="font-semibold">{toast.title}</b>
              {toast.detail && <span className="ml-2 opacity-80">{toast.detail}</span>}
            </span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
