// 여러 화면에서 쓰는 작은 부품들

import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** LIFE OS 새싹 로고 */
export function Sprout({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 29V15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M16 16C16 9 11 5 4 5c0 7 5 11 12 11Z" fill="currentColor" opacity=".85" />
      <path d="M16 14c0-6 4-10 12-10 0 7-5 10-12 10Z" fill="currentColor" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Sprout size={24} />
      <span className="font-display text-[19px] font-bold tracking-wide text-ink">LIFE OS</span>
    </div>
  );
}

/** 아래에서 올라오는 시트 (PC에서는 가운데 창) */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 animate-fade bg-[#1d2016]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92dvh] w-full max-w-lg animate-sheet overflow-y-auto rounded-t-4xl bg-card px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 shadow-soft md:rounded-4xl md:pt-5"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-bg" aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex rounded-full border border-line bg-bg p-1 ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition ${
            o.value === value ? 'bg-primary text-primary-ink shadow-sm' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-line'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between px-1">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <Sprout size={34} className="mb-3 text-sage" />
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
