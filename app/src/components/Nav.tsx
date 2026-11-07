// 하단 메뉴 (PC에서는 왼쪽 세로 메뉴)

import { CalendarDays, Home, Sparkles, User } from 'lucide-react';
import { navigate, type Tab } from '../lib/router';
import { Sprout } from './ui';

const ITEMS: { tab: Tab; label: string; icon: typeof Home }[] = [
  { tab: 'record', label: '기록', icon: Home },
  { tab: 'memory', label: '기억', icon: CalendarDays },
  { tab: 'insight', label: '인사이트', icon: Sparkles },
  { tab: 'me', label: '나', icon: User },
];

export function Nav({ current }: { current: Tab }) {
  return (
    <nav
      aria-label="메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:pb-0"
    >
      <div className="hidden justify-center py-7 text-primary md:flex">
        <Sprout size={30} />
      </div>
      <ul className="mx-auto flex max-w-lg md:flex-col md:gap-2">
        {ITEMS.map(({ tab, label, icon: Icon }) => {
          const on = current === tab;
          return (
            <li key={tab} className="flex-1">
              <button
                onClick={() => navigate(tab)}
                aria-current={on ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-1.5 text-[10.5px] transition md:py-3 ${on ? 'font-bold text-primary' : 'text-muted'}`}
              >
                <span className={`grid h-7 w-11 place-items-center rounded-full transition ${on ? 'bg-primary-soft' : ''}`}>
                  <Icon size={19} strokeWidth={on ? 2.4 : 1.9} />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
