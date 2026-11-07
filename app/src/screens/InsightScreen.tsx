// 인사이트: 사용자가 원할 때만 들어와서 보는 곳. 실제 기록에서 계산한 것만 보여준다.

import { ChevronDown, Info } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StateChips } from '../components/RecordCard';
import { Empty, Segmented } from '../components/ui';
import { scaleOf } from '../lib/constants';
import { fmtDate, fmtTime } from '../lib/dates';
import {
  MIN_DAYS,
  MIN_RECORDS,
  dailyAverages,
  hourCounts,
  inPeriod,
  moodCounts,
  moodObservations,
  partAverages,
  rhythmObservations,
  scaleObservations,
  sufficiency,
  tagObservations,
  usedTags,
  weekdayAverages,
  weekdayCounts,
  type Observation,
  type Period,
} from '../lib/insights';
import { useRecords } from '../lib/records';
import type { LifeRecord, ScaleKey } from '../lib/types';

type Area = 'mood' | ScaleKey | 'rhythm' | 'activity';
const AREAS: { key: Area; label: string }[] = [
  { key: 'mood', label: '감정' },
  { key: 'energy', label: '에너지' },
  { key: 'focus', label: '집중력' },
  { key: 'stress', label: '부담감' },
  { key: 'rhythm', label: '생활 리듬' },
  { key: 'activity', label: '활동과 상태' },
];

const OLIVE = '#7D9150';
const SAGE = '#A9BC94';
const tooltipStyle = { borderRadius: 14, border: '1px solid rgb(var(--line))', background: 'rgb(var(--card))', color: 'rgb(var(--ink))', fontSize: 13 };

function ChartBox({ children }: { children: ReactNode }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

function Observations({ list, byId, onOpen }: { list: Observation[]; byId: Map<string, LifeRecord>; onOpen: (r: LifeRecord) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-display text-[18px] font-bold">발견한 경향</h2>
      {list.length === 0 ? (
        <p className="text-[14px] text-muted">이 기간에는 뚜렷한 차이가 보이지 않아요.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const evidence = o.evidence.map((id) => byId.get(id)).filter(Boolean) as LifeRecord[];
            return (
              <li key={o.id} className="rounded-3xl bg-bg p-4">
                <p className="text-[15px] leading-relaxed">{o.text}</p>
                <button
                  className="mt-2 flex items-center gap-1 text-[13px] text-muted"
                  onClick={() => setOpen(open === o.id ? null : o.id)}
                  aria-expanded={open === o.id}
                >
                  근거 기록 {evidence.length}개 <ChevronDown size={14} className={`transition ${open === o.id ? 'rotate-180' : ''}`} />
                </button>
                {open === o.id && (
                  <ul className="mt-2 space-y-1.5">
                    {evidence.slice(0, 12).map((r) => (
                      <li key={r.id}>
                        <button className="flex w-full flex-wrap items-center gap-2 text-left text-[12px]" onClick={() => onOpen(r)}>
                          <span className="text-muted">
                            {fmtDate(r.occurred_at)} {fmtTime(r.occurred_at)}
                          </span>
                          <StateChips record={r} />
                          {!r.mood && !r.energy && !r.focus && !r.stress && <span className="truncate">{r.content}</span>}
                        </button>
                      </li>
                    ))}
                    {evidence.length > 12 && <li className="text-[12px] text-muted">외 {evidence.length - 12}개</li>}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 flex items-start gap-1.5 text-[12px] text-muted">
        <Info size={13} className="mt-0.5 shrink-0" />
        기록에서 관찰된 경향일 뿐, 원인을 뜻하지는 않아요.
      </p>
    </section>
  );
}

function ScaleCharts({ list, scale }: { list: LifeRecord[]; scale: ScaleKey }) {
  const [view, setView] = useState<'day' | 'part' | 'week'>('day');
  const label = scaleOf(scale).label;
  const daily = dailyAverages(list, scale);
  const parts = partAverages(list, scale).map((p) => ({ label: p.label, avg: p.avg, n: p.n }));
  const week = weekdayAverages(list, scale);
  if (!daily.length) return <p className="card p-5 text-[14px] text-muted">이 기간에 기록한 {label}이(가) 없어요.</p>;
  return (
    <section className="card p-5">
      <Segmented
        className="mb-4"
        value={view}
        onChange={setView}
        options={[
          { value: 'day', label: '날짜별' },
          { value: 'part', label: '시간대별' },
          { value: 'week', label: '요일별' },
        ]}
      />
      <ChartBox>
        {view === 'day' ? (
          <LineChart data={daily} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, `${label} 평균`]} />
            <Line type="monotone" dataKey="avg" stroke={OLIVE} strokeWidth={2.5} dot={{ r: 3.5, fill: OLIVE }} />
          </LineChart>
        ) : (
          <BarChart data={view === 'part' ? parts : week} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, p) => [`${v} (기록 ${p.payload.n}개)`, `${label} 평균`]} />
            <Bar dataKey="avg" fill={SAGE} radius={[10, 10, 4, 4]} maxBarSize={36} />
          </BarChart>
        )}
      </ChartBox>
      <p className="mt-2 text-center text-[12px] text-muted">1 = {scaleOf(scale).levels[0]} · 5 = {scaleOf(scale).levels[4]}</p>
    </section>
  );
}

export function InsightScreen({ onOpen }: { onOpen: (r: LifeRecord) => void }) {
  const { records } = useRecords();
  const [period, setPeriod] = useState<Period>(30);
  const [area, setArea] = useState<Area>('mood');
  const [rhythmView, setRhythmView] = useState<'hour' | 'week'>('hour');

  const list = useMemo(() => inPeriod(records, period), [records, period]);
  const byId = useMemo(() => new Map(records.map((r) => [r.id, r])), [records]);
  const suff = sufficiency(list);

  const observations = useMemo(() => {
    if (!suff.enough && area !== 'activity') return [];
    if (area === 'mood') return moodObservations(list);
    if (area === 'rhythm') return rhythmObservations(list);
    if (area === 'activity') return tagObservations(list);
    return scaleObservations(list, area);
  }, [list, area, suff.enough]);

  if (records.length === 0) {
    return (
      <div>
        <Header />
        <Empty title="아직 기록이 없어요">기록이 쌓이면 나만의 패턴을 여기서 볼 수 있어요.</Empty>
      </div>
    );
  }

  const moods = moodCounts(list);
  const tags = usedTags(list);

  return (
    <div className="space-y-4">
      <Header />
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 7, label: '7일' },
          { value: 30, label: '30일' },
          { value: 90, label: '90일' },
          { value: 'all', label: '전체' },
        ]}
      />
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {AREAS.map((a) => (
          <button key={a.key} className={`chip shrink-0 px-4 py-2 ${area === a.key ? 'chip-on' : ''}`} onClick={() => setArea(a.key)}>
            {a.label}
          </button>
        ))}
      </div>

      <p className="px-1 text-[13px] text-muted">
        이 기간의 상태 기록 {suff.count}개 · {suff.days}일
      </p>

      {!suff.enough && area !== 'activity' && (
        <section className="card p-5">
          <p className="font-semibold">아직 패턴을 발견하기에는 기록이 조금 더 필요해요.</p>
          <p className="mt-1 text-[14px] text-muted">
            {MIN_DAYS}일 이상, 상태 기록 {MIN_RECORDS}개 이상이 모이면 경향을 찾아볼게요. 아래 그래프는 지금까지의 기록 그대로예요.
          </p>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {(suff.enough || area === 'activity') && <Observations list={observations} byId={byId} onOpen={onOpen} />}

        {area === 'mood' &&
          (moods.length ? (
            <section className="card p-5">
              <h2 className="mb-3 font-semibold">감정별 기록 수</h2>
              <div className="w-full" style={{ height: Math.max(120, moods.length * 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moods} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" dataKey="count" hide allowDecimals={false} domain={[0, 'dataMax']} />
                    <YAxis type="category" dataKey="label" width={64} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}개`, '기록']} />
                    <Bar dataKey="count" radius={[4, 12, 12, 4]} maxBarSize={26}>
                      {moods.map((m) => (
                        <Cell key={m.key} fill={m.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : (
            <p className="card p-5 text-[14px] text-muted">이 기간에 기록한 감정이 없어요.</p>
          ))}

        {(area === 'energy' || area === 'focus' || area === 'stress') && <ScaleCharts key={area} list={list} scale={area} />}

        {area === 'rhythm' && (
          <section className="card p-5">
            <Segmented
              className="mb-4"
              value={rhythmView}
              onChange={setRhythmView}
              options={[
                { value: 'hour', label: '시간대별 기록' },
                { value: 'week', label: '요일별 기록' },
              ]}
            />
            <ChartBox>
              <BarChart data={rhythmView === 'hour' ? hourCounts(list) : weekdayCounts(list)} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={rhythmView === 'hour' ? 2 : 0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}개`, '기록']} />
                <Bar dataKey="count" fill={SAGE} radius={[8, 8, 3, 3]} />
              </BarChart>
            </ChartBox>
            <p className="mt-2 text-center text-[12px] text-muted">모든 종류의 기록을 셌어요</p>
          </section>
        )}

        {area === 'activity' && (
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">자주 남긴 태그</h2>
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 20).map((t) => (
                  <span key={t.tag} className="chip">
                    #{t.tag} <b className="font-semibold text-muted">{t.count}</b>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-muted">메모·사건에 태그(예: 산책, 운동, 회사)를 달면, 그 활동이 있었던 날의 상태를 비교해 볼 수 있어요.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="py-3">
      <h1 className="font-display text-[26px] font-bold">인사이트</h1>
      <p className="text-[13px] text-muted">쌓인 기록에서 나의 흐름을 살펴봐요</p>
    </header>
  );
}
