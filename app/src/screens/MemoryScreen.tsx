// 기억: 지난 기록을 시간순으로 다시 보는 곳 (검색, 종류·감정 거르기, 달력)

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Calendar } from '../components/Calendar';
import { RecordCard, TYPE_ICONS } from '../components/RecordCard';
import { Empty, Segmented } from '../components/ui';
import { MOODS, RECORD_TYPES } from '../lib/constants';
import { dateKey, fmtDate, fmtDayLabel, parseDateKey } from '../lib/dates';
import { useRecords } from '../lib/records';
import { navigate } from '../lib/router';
import type { LifeRecord, MoodKey, RecordType } from '../lib/types';

const ALL_TYPES = Object.keys(RECORD_TYPES) as RecordType[];
const PAGE = 14;

function matches(r: LifeRecord, q: string) {
  if (!q) return true;
  const hay = [
    r.content,
    r.prompt,
    r.tags.join(' '),
    RECORD_TYPES[r.record_type].label,
    MOODS.find((m) => m.key === r.mood)?.label,
    fmtDate(r.occurred_at),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word));
}

export function MemoryScreen({ date, onOpen }: { date: string | null; onOpen: (r: LifeRecord) => void }) {
  const { records } = useRecords();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<RecordType | null>(null);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [month, setMonth] = useState(() => (date ? parseDateKey(date) : new Date()));
  const [calendarDay, setCalendarDay] = useState(() => date ?? dateKey(new Date()));
  const [pages, setPages] = useState(1);

  const filtered = useMemo(
    () => records.filter((r) => (!type || r.record_type === type) && (!mood || r.mood === mood) && matches(r, query.trim())),
    [records, type, mood, query],
  );
  const byDay = useMemo(() => {
    const map = new Map<string, LifeRecord[]>();
    for (const r of filtered) {
      const k = dateKey(r.occurred_at);
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return map;
  }, [filtered]);

  const filtering = !!(query.trim() || type || mood);
  // 주소에 날짜가 있으면 그날만 보여준다 (홈의 "오늘 전체 보기" 등)
  const groups = date ? [[date, byDay.get(date) ?? []] as const] : [...byDay.entries()];

  const dayList = (key: string) => {
    const list = byDay.get(key) ?? [];
    return list.length ? (
      <div className="space-y-2">
        {list.map((r) => (
          <RecordCard key={r.id} record={r} onOpen={onOpen} />
        ))}
      </div>
    ) : (
      <p className="py-6 text-center text-[14px] text-muted">{filtering ? '조건에 맞는 기록이 없어요.' : '이날은 기록이 없어요.'}</p>
    );
  };

  return (
    <div>
      <header className="flex items-end justify-between py-3">
        <div>
          <h1 className="font-display text-[26px] font-bold">기억</h1>
          <p className="text-[13px] text-muted">지나온 순간들을 다시 만나요</p>
        </div>
        <Segmented
          className="w-44"
          value={view}
          onChange={setView}
          options={[
            { value: 'timeline', label: '타임라인' },
            { value: 'calendar', label: '달력' },
          ]}
        />
      </header>

      <div className="mt-2 flex gap-2">
        <label className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="field rounded-full pl-11"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPages(1);
            }}
            placeholder="키워드, 감정, 날짜(예: 11월 7일)"
            aria-label="기록 검색"
          />
        </label>
        <button
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${showFilters || type || mood ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-card text-muted'}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="종류·감정으로 거르기"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={19} />
        </button>
      </div>

      {showFilters && (
        <div className="card mt-3 space-y-4 p-4">
          <div>
            <p className="label">기록 종류</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TYPES.map((t) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button key={t} className={`chip ${type === t ? 'chip-on' : ''}`} onClick={() => setType(type === t ? null : t)}>
                    <Icon size={13} /> {RECORD_TYPES[t].label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="label">감정</p>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button key={m.key} className={`chip ${mood === m.key ? 'chip-on' : ''}`} onClick={() => setMood(mood === m.key ? null : m.key)}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {date && (
        <button className="chip chip-on mt-3" onClick={() => navigate('memory')}>
          {fmtDayLabel(date)} <X size={14} />
        </button>
      )}

      <div className="mt-4">
        {records.length === 0 ? (
          <Empty title="아직 기록이 없어요">기록이 쌓이면 여기서 지난 순간들을 다시 볼 수 있어요.</Empty>
        ) : view === 'calendar' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
            <Calendar
              month={month}
              onMonth={setMonth}
              selected={calendarDay}
              byDay={byDay}
              onSelect={(k) => {
                setCalendarDay(k);
                if (date) navigate('memory');
              }}
            />
            <div>
              <h2 className="mb-3 px-1 font-semibold">{fmtDayLabel(calendarDay)}</h2>
              {dayList(calendarDay)}
            </div>
          </div>
        ) : groups.length === 0 || (date && !(byDay.get(date) ?? []).length) ? (
          <p className="py-10 text-center text-[14px] text-muted">{filtering ? '조건에 맞는 기록이 없어요.' : '이날은 기록이 없어요.'}</p>
        ) : (
          <div className="space-y-6">
            {groups.slice(0, pages * PAGE).map(([key, list]) => (
              <section key={key}>
                <h2 className="mb-2.5 flex items-center gap-2 px-1 text-[14px] font-bold">
                  {fmtDayLabel(key)}
                  <span className="font-normal text-muted">· {list.length}</span>
                </h2>
                <div className="space-y-2">
                  {list.map((r) => (
                    <RecordCard key={r.id} record={r} onOpen={onOpen} />
                  ))}
                </div>
              </section>
            ))}
            {groups.length > pages * PAGE && (
              <button className="btn-ghost w-full" onClick={() => setPages((p) => p + 1)}>
                더 지난 기록 보기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
