import { describe, expect, it } from 'vitest';
import { makeRecord } from './records';
import {
  dailyAverages,
  inPeriod,
  moodObservations,
  scaleObservations,
  sufficiency,
  sleepObservations,
  sleepSummary,
  tagObservations,
} from './insights';
import { resolveSleep } from './dates';
import type { RecordInput } from './records';
import type { LifeRecord } from './types';

const NOW = new Date(2026, 10, 20, 23, 0);
const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0).toISOString();
const rec = (input: Omit<RecordInput, 'record_type'> & { record_type?: RecordInput['record_type'] }): LifeRecord =>
  makeRecord({ record_type: 'checkin', ...input });

describe('insights', () => {
  it('기록이 적으면 부족하다고 판단한다', () => {
    const records = [rec({ mood: 'good', occurred_at: at(20, 9) }), rec({ energy: 3, occurred_at: at(19, 9) })];
    expect(sufficiency(records).enough).toBe(false);
    expect(scaleObservations(records, 'energy', NOW)).toEqual([]);
    expect(moodObservations(records)).toEqual([]);
  });

  it('오전 집중력이 오후보다 높으면 근거와 함께 알려준다', () => {
    const records = [
      ...[14, 15, 16].map((d) => rec({ focus: 5, occurred_at: at(d, 9) })),
      ...[14, 15, 16].map((d) => rec({ focus: 2, occurred_at: at(d, 15) })),
    ];
    const obs = scaleObservations(records, 'focus', NOW);
    const part = obs.find((o) => o.id === 'focus-part');
    expect(part?.text).toContain('오전');
    expect(part?.evidence).toHaveLength(6);
  });

  it('차이가 작으면 말하지 않는다', () => {
    const records = [
      ...[14, 15, 16].map((d) => rec({ focus: 3, occurred_at: at(d, 9) })),
      ...[14, 15, 16].map((d) => rec({ focus: 3, occurred_at: at(d, 15) })),
    ];
    expect(scaleObservations(records, 'focus', NOW).find((o) => o.id === 'focus-part')).toBeUndefined();
  });

  it('태그가 있었던 날과 없었던 날을 비교한다', () => {
    const records = [
      ...[10, 11, 12].flatMap((d) => [
        rec({ record_type: 'event', content: '산책', tags: ['산책'], occurred_at: at(d, 18) }),
        rec({ focus: 4, occurred_at: at(d, 20) }),
      ]),
      ...[13, 14, 15].map((d) => rec({ focus: 2, occurred_at: at(d, 20) })),
    ];
    const obs = tagObservations(records);
    expect(obs).toHaveLength(1);
    expect(obs[0].text).toContain("'산책'");
  });

  it('기간을 거르고 날짜별 평균을 낸다', () => {
    const records = [
      rec({ energy: 2, occurred_at: at(20, 9) }),
      rec({ energy: 4, occurred_at: at(20, 15) }),
      rec({ energy: 5, occurred_at: at(1, 9) }),
    ];
    const week = inPeriod(records, 7, NOW);
    expect(week).toHaveLength(2);
    expect(dailyAverages(week, 'energy')).toEqual([{ date: '2026-11-20', label: '11/20', avg: 3, n: 2 }]);
  });

  it('시각만 고른 수면을 날짜로 바꾼다 (자정을 넘긴 잠)', () => {
    const now = new Date(2026, 10, 20, 9, 0);
    const a = resolveSleep('23:30', '07:10', now);
    expect([a.start.getDate(), a.start.getHours(), a.end.getDate(), a.end.getHours()]).toEqual([19, 23, 20, 7]);
    const b = resolveSleep('01:00', '08:00', now);
    expect([b.start.getDate(), b.start.getHours(), b.end.getDate()]).toEqual([20, 1, 20]);
    // 아직 오지 않은 기상 시각이면 어제 아침으로 본다
    const c = resolveSleep('23:00', '10:00', now);
    expect([c.start.getDate(), c.end.getDate()]).toEqual([18, 19]);
  });

  it('수면 평균과, 적게 잔 날과 많이 잔 날의 상태를 비교한다', () => {
    const sleep = (day: number, hours: number) =>
      rec({ record_type: 'sleep', started_at: new Date(2026, 10, day - 1, 23, 0).toISOString(), occurred_at: new Date(2026, 10, day - 1, 23 + hours, 0).toISOString() });
    const records = [
      ...[10, 11, 12].flatMap((d) => [sleep(d, 5), rec({ focus: 2, occurred_at: at(d, 11) })]),
      ...[13, 14, 15].flatMap((d) => [sleep(d, 8), rec({ focus: 4, occurred_at: at(d, 11) })]),
    ];
    const s = sleepSummary(records)!;
    expect(Math.round(s.avgMinutes)).toBe(390);
    expect(s.avgBed).toBe(23 * 60);
    const obs = sleepObservations(records);
    expect(obs).toHaveLength(1);
    expect(obs[0].text).toContain('집중력 평균은 2');
  });
});
