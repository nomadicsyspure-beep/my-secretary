// 달력. 기록이 있는 날에는 작은 점이 보이고, 기록이 없는 날은 그냥 평범한 날로 둔다.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { moodOf } from '../lib/constants';
import { WEEKDAYS, dateKey } from '../lib/dates';
import type { LifeRecord } from '../lib/types';

export function Calendar({
  month,
  onMonth,
  selected,
  onSelect,
  byDay,
}: {
  month: Date;
  onMonth: (d: Date) => void;
  selected: string | null;
  onSelect: (key: string) => void;
  byDay: Map<string, LifeRecord[]>;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  const today = dateKey(new Date());
  const shift = (n: number) => onMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="card p-3">
      <div className="mb-3 flex items-center justify-between">
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg" onClick={() => shift(-1)} aria-label="이전 달">
          <ChevronLeft size={20} />
        </button>
        <b className="font-display text-[17px]">
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </b>
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg" onClick={() => shift(1)} aria-label="다음 달">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[12px] text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const key = dateKey(d);
          const list = byDay.get(key) ?? [];
          // 감정 기록은 그 감정 색으로, 나머지 기록은 세이지색 점으로
          const dots = [...new Set(list.map((r) => moodOf(r.mood)?.color ?? 'rgb(var(--sage))'))].slice(0, 3);
          const on = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일${list.length ? `, 기록 ${list.length}개` : ''}`}
              aria-pressed={on}
              className={`mx-auto flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-xl text-[13px] transition ${
                on ? 'bg-primary text-primary-ink' : key === today ? 'bg-primary-soft font-bold' : 'hover:bg-bg'
              }`}
            >
              {d.getDate()}
              <span className="flex h-1.5 gap-0.5">
                {dots.map((c) => (
                  <i key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
