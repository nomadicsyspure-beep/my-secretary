// 설정 (작은 값이라 localStorage 에 저장)

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ScaleKey } from './types';

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  name: string;
  theme: ThemeSetting;
  /** 홈 화면에 보여줄 원터치 항목 */
  scales: Record<ScaleKey, boolean>;
  reminders: { enabled: boolean; times: string[] };
  recall: { enabled: boolean; time: string };
  /** 기억 복원 카드를 '나중에 할게요' 한 날 (YYYY-MM-DD) */
  recallDismissedOn: string | null;
  legacyImported: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'system',
  scales: { energy: true, focus: true, stress: true },
  reminders: { enabled: false, times: ['10:00', '15:00', '20:30'] },
  recall: { enabled: true, time: '21:00' },
  recallDismissedOn: null,
  legacyImported: false,
};

const KEY = 'lifeos.settings';

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      scales: { ...DEFAULT_SETTINGS.scales, ...saved.scales },
      reminders: { ...DEFAULT_SETTINGS.reminders, ...saved.reminders },
      recall: { ...DEFAULT_SETTINGS.recall, ...saved.recall },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: Settings;
  update(patch: Partial<Settings>): void;
  replace(next: Settings): void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* 저장 공간이 막혀 있어도 앱은 계속 동작 */
    }
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const replace = useCallback((next: Settings) => setSettings({ ...DEFAULT_SETTINGS, ...next }), []);

  return <SettingsContext.Provider value={{ settings, update, replace }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

/** 설정에 따라 html 에 dark 클래스를 붙인다 */
export function useApplyTheme(theme: ThemeSetting) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1B1E18' : '#FAF6EE');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
