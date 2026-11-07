// 인사이트 계산 (화면과 분리된 순수 함수 → 테스트하기 쉽고, 나중에 AI 분석의 기초 자료로도 쓴다)
//
// 원칙
// - 실제 기록이 있을 때만 문장을 만든다. 예시 데이터를 사실처럼 보여주지 않는다.
// - 기록이 적으면 아무 말도 하지 않는다 (MIN_* 기준).
// - 상관관계를 원인처럼 말하지 않는다. "~한 경향이 있어요" 처럼 관찰만 전한다.
// - 모든 문장에는 근거가 된 기록 id 를 붙인다.

import { ALL_MOODS, RECORD_SCALES, moodOf, scaleOf } from './constants';
import { PARTS, WEEKDAYS, dateKey, fmtMinutes, partOfDay } from './dates';
import type { LifeRecord, MoodKey, ScaleKey } from './types';

export const MIN_RECORDS = 5;
export const MIN_DAYS = 3;
const MIN_GROUP = 3;
const MIN_DIFF = 0.5;

export type Period = 7 | 30 | 90 | 'all';

export interface Observation {
  id: string;
  text: string;
  evidence: string[];
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (x: number) => Math.round(x * 10) / 10;

export function inPeriod(records: LifeRecord[], period: Period, now = new Date()): LifeRecord[] {
  if (period === 'all') return records;
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (period - 1));
  return records.filter((r) => new Date(r.occurred_at) >= from);
}

/** 기분·에너지·집중·부담감 중 하나라도 있는 기록 */
export const hasState = (r: LifeRecord) => r.mood != null || r.energy != null || r.focus != null || r.stress != null;

export function sufficiency(records: LifeRecord[]) {
  const states = records.filter(hasState);
  const days = new Set(states.map((r) => dateKey(r.occurred_at))).size;
  return { count: states.length, days, enough: states.length >= MIN_RECORDS && days >= MIN_DAYS };
}

const withScale = (records: LifeRecord[], key: ScaleKey) => records.filter((r) => r[key] != null);

// ---------- 그래프용 ----------

/** 기록이 있는 날만, 오래된 날부터 */
export function dailyAverages(records: LifeRecord[], key: ScaleKey) {
  const byDay = new Map<string, number[]>();
  for (const r of withScale(records, key)) {
    const k = dateKey(r.occurred_at);
    byDay.set(k, [...(byDay.get(k) ?? []), r[key]!]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, xs]) => ({ date, label: `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`, avg: round1(avg(xs)!), n: xs.length }));
}

/** 월요일부터 일요일 순서 */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function weekdayAverages(records: LifeRecord[], key: ScaleKey) {
  const list = withScale(records, key);
  return WEEK_ORDER.map((d) => {
    const xs = list.filter((r) => new Date(r.occurred_at).getDay() === d).map((r) => r[key]!);
    const a = avg(xs);
    return { label: WEEKDAYS[d], avg: a == null ? null : round1(a), n: xs.length };
  });
}

export function partAverages(records: LifeRecord[], key: ScaleKey) {
  const list = withScale(records, key);
  return PARTS.map((p) => {
    const group = list.filter((r) => partOfDay(r.occurred_at) === p.key);
    const a = avg(group.map((r) => r[key]!));
    return { ...p, avg: a == null ? null : round1(a), n: group.length, ids: group.map((r) => r.id) };
  });
}

export function hourCounts(records: LifeRecord[]) {
  const counts = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${h}시`, count: 0 }));
  for (const r of records) counts[new Date(r.occurred_at).getHours()].count += 1;
  return counts;
}

export function weekdayCounts(records: LifeRecord[]) {
  return WEEK_ORDER.map((d) => ({
    label: WEEKDAYS[d],
    count: records.filter((r) => new Date(r.occurred_at).getDay() === d).length,
  }));
}

export function moodCounts(records: LifeRecord[]) {
  return ALL_MOODS.map((m) => ({ ...m, count: records.filter((r) => r.mood === m.key).length }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ---------- 관찰 문장 ----------

export function scaleObservations(records: LifeRecord[], key: ScaleKey, now = new Date()): Observation[] {
  const label = scaleOf(key).label;
  const out: Observation[] = [];

  // 1) 시간대 비교
  const parts = partAverages(records, key).filter((p) => p.n >= MIN_GROUP);
  if (parts.length >= 2) {
    const hi = parts.reduce((a, b) => (b.avg! > a.avg! ? b : a));
    const lo = parts.reduce((a, b) => (b.avg! < a.avg! ? b : a));
    if (hi.avg! - lo.avg! >= MIN_DIFF) {
      out.push({
        id: `${key}-part`,
        text: `${hi.label}(${hi.range})에 기록한 ${label} 평균이 ${hi.avg}로, ${lo.label}(${lo.avg})보다 높게 나타나는 경향이 있어요.`,
        evidence: [...hi.ids, ...lo.ids],
      });
    }
  }

  // 2) 요일 비교
  const days = weekdayAverages(records, key).filter((d) => d.n >= MIN_GROUP);
  if (days.length >= 2) {
    const hi = days.reduce((a, b) => (b.avg! > a.avg! ? b : a));
    const lo = days.reduce((a, b) => (b.avg! < a.avg! ? b : a));
    if (hi.avg! - lo.avg! >= MIN_DIFF) {
      const ids = withScale(records, key)
        .filter((r) => [hi.label, lo.label].includes(WEEKDAYS[new Date(r.occurred_at).getDay()]))
        .map((r) => r.id);
      out.push({
        id: `${key}-weekday`,
        text: `${hi.label}요일의 ${label} 평균(${hi.avg})이 ${lo.label}요일(${lo.avg})보다 높게 기록됐어요.`,
        evidence: ids,
      });
    }
  }

  // 3) 최근 변화: 최근 7일 vs 그 전 7일
  const list = withScale(records, key);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const recentFrom = new Date(start);
  recentFrom.setDate(recentFrom.getDate() - 6);
  const prevFrom = new Date(start);
  prevFrom.setDate(prevFrom.getDate() - 13);
  const recent = list.filter((r) => new Date(r.occurred_at) >= recentFrom);
  const prev = list.filter((r) => new Date(r.occurred_at) >= prevFrom && new Date(r.occurred_at) < recentFrom);
  if (recent.length >= MIN_GROUP && prev.length >= MIN_GROUP) {
    const a = round1(avg(recent.map((r) => r[key]!))!);
    const b = round1(avg(prev.map((r) => r[key]!))!);
    if (Math.abs(a - b) >= MIN_DIFF) {
      out.push({
        id: `${key}-trend`,
        text: `최근 7일의 ${label} 평균(${a})이 그 전 7일(${b})보다 ${a > b ? '높아졌어요' : '낮아졌어요'}.`,
        evidence: [...recent, ...prev].map((r) => r.id),
      });
    }
  }

  return out;
}

export function moodObservations(records: LifeRecord[]): Observation[] {
  const list = records.filter((r) => r.mood != null);
  const out: Observation[] = [];
  const name = (k: MoodKey) => moodOf(k)!.label;

  const top = (group: LifeRecord[]) => {
    const counts = new Map<MoodKey, number>();
    for (const r of group) counts.set(r.mood!, (counts.get(r.mood!) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  };

  if (list.length >= MIN_RECORDS) {
    const [mood, n] = top(list);
    out.push({
      id: 'mood-top',
      text: `이 기간에 가장 많이 남긴 감정은 '${name(mood)}'이에요 (${list.length}개 중 ${n}개).`,
      evidence: list.filter((r) => r.mood === mood).map((r) => r.id),
    });
  }

  for (const p of PARTS) {
    const group = list.filter((r) => partOfDay(r.occurred_at) === p.key);
    if (group.length < 4) continue;
    const [mood, n] = top(group);
    if (n / group.length >= 0.5) {
      out.push({
        id: `mood-${p.key}`,
        text: `${p.label}에 남긴 감정 기록 ${group.length}개 중 ${n}개가 '${name(mood)}'이었어요.`,
        evidence: group.filter((r) => r.mood === mood).map((r) => r.id),
      });
    }
  }
  return out;
}

export function rhythmObservations(records: LifeRecord[]): Observation[] {
  if (records.length < MIN_RECORDS) return [];
  const groups = PARTS.map((p) => ({ ...p, list: records.filter((r) => partOfDay(r.occurred_at) === p.key) }));
  const top = groups.reduce((a, b) => (b.list.length > a.list.length ? b : a));
  if (top.list.length / records.length < 0.4) return [];
  return [
    {
      id: 'rhythm-part',
      text: `기록은 주로 ${top.label}(${top.range})에 남겼어요 (${records.length}개 중 ${top.list.length}개).`,
      evidence: top.list.map((r) => r.id),
    },
  ];
}

/** 태그(활동)가 있었던 날과 없었던 날의 상태 비교 */
export function tagObservations(records: LifeRecord[]): Observation[] {
  const tagDays = new Map<string, Set<string>>();
  for (const r of records) {
    for (const t of r.tags) {
      if (!tagDays.has(t)) tagDays.set(t, new Set());
      tagDays.get(t)!.add(dateKey(r.occurred_at));
    }
  }
  const out: Observation[] = [];
  for (const [tag, days] of tagDays) {
    if (days.size < MIN_GROUP) continue;
    for (const key of RECORD_SCALES) {
      const list = withScale(records, key);
      const on = list.filter((r) => days.has(dateKey(r.occurred_at)));
      const off = list.filter((r) => !days.has(dateKey(r.occurred_at)));
      const offDays = new Set(off.map((r) => dateKey(r.occurred_at)));
      if (on.length < MIN_GROUP || off.length < MIN_GROUP || offDays.size < MIN_GROUP) continue;
      const a = round1(avg(on.map((r) => r[key]!))!);
      const b = round1(avg(off.map((r) => r[key]!))!);
      if (Math.abs(a - b) < MIN_DIFF) continue;
      out.push({
        id: `tag-${tag}-${key}`,
        text: `'${tag}'을(를) 기록한 날(${days.size}일)의 ${scaleOf(key).label} 평균은 ${a}, 다른 날은 ${b}였어요.`,
        evidence: on.map((r) => r.id),
      });
    }
  }
  return out;
}

export function usedTags(records: LifeRecord[]) {
  const counts = new Map<string, number>();
  for (const r of records) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
}

// ---------- 수면 ----------

export const MIN_SLEEPS = 3;

export const sleepMinutes = (r: LifeRecord) => (Date.parse(r.occurred_at) - Date.parse(r.started_at!)) / 60000;
/** 잠든 시각이 있고 길이가 말이 되는(0분 초과 20시간 이하) 수면 기록 */
export const sleepRecords = (records: LifeRecord[]) =>
  records.filter((r) => r.record_type === 'sleep' && r.started_at && sleepMinutes(r) > 0 && sleepMinutes(r) <= 20 * 60);

/** 자정을 넘나드는 시각의 평균: 정오 이전은 다음 날로 보고 더한다 (예: 23:30, 00:30 → 00:00) */
function averageClock(minutes: number[]) {
  const shifted = minutes.map((m) => (m < 12 * 60 ? m + 1440 : m));
  return (avg(shifted)! % 1440);
}
const minuteOfDay = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

/** 평균 수면 시간·잠든 시각·일어난 시각과 밤마다의 수면 시간 (일어난 날 기준) */
export function sleepSummary(records: LifeRecord[]) {
  const list = sleepRecords(records);
  if (list.length < MIN_SLEEPS) return null;
  const nights = [...list]
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
    .map((r) => {
      const k = dateKey(r.occurred_at);
      return { date: k, label: `${Number(k.slice(5, 7))}/${Number(k.slice(8))}`, hours: round1(sleepMinutes(r) / 60), id: r.id };
    });
  return {
    count: list.length,
    avgMinutes: avg(list.map(sleepMinutes))!,
    // 잠든 시각은 밤 12시를 넘나들므로 정오 기준으로 이어 붙여 평균 낸다
    avgBed: averageClock(list.map((r) => minuteOfDay(r.started_at!))),
    avgWake: avg(list.map((r) => minuteOfDay(r.occurred_at)))!,
    nights,
  };
}

/**
 * 적게 잔 날 vs 많이 잔 날의 집중력·부담감 비교 (가운데 값으로 나눔).
 * 일어난 날의 상태 기록과 비교한다. 양쪽 모두 3일·3개 이상일 때만 말한다.
 */
export function sleepObservations(records: LifeRecord[]): Observation[] {
  const byDay = new Map<string, LifeRecord>();
  for (const r of sleepRecords(records)) {
    const k = dateKey(r.occurred_at);
    const prev = byDay.get(k);
    if (!prev || sleepMinutes(r) > sleepMinutes(prev)) byDay.set(k, r); // 낮잠보다 밤잠(긴 쪽)
  }
  if (byDay.size < MIN_GROUP * 2) return [];
  const sorted = [...byDay.values()].map(sleepMinutes).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const shortDays = new Set([...byDay].filter(([, r]) => sleepMinutes(r) < median).map(([k]) => k));
  const longDays = new Set([...byDay].filter(([, r]) => sleepMinutes(r) >= median).map(([k]) => k));
  if (shortDays.size < MIN_GROUP || longDays.size < MIN_GROUP) return [];

  const out: Observation[] = [];
  for (const key of RECORD_SCALES) {
    const list = withScale(records, key);
    const short = list.filter((r) => shortDays.has(dateKey(r.occurred_at)));
    const long = list.filter((r) => longDays.has(dateKey(r.occurred_at)));
    if (short.length < MIN_GROUP || long.length < MIN_GROUP) continue;
    const a = round1(avg(short.map((r) => r[key]!))!);
    const b = round1(avg(long.map((r) => r[key]!))!);
    if (Math.abs(a - b) < MIN_DIFF) continue;
    const sleepIds = [...shortDays, ...longDays].map((k) => byDay.get(k)!.id);
    out.push({
      id: `sleep-${key}`,
      text: `${fmtMinutes(median)}보다 적게 잔 날(${shortDays.size}일)의 ${scaleOf(key).label} 평균은 ${a}, 더 잔 날(${longDays.size}일)은 ${b}였어요.`,
      evidence: [...sleepIds, ...short.map((r) => r.id), ...long.map((r) => r.id)],
    });
  }
  return out;
}
