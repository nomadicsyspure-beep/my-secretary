import { describe, expect, it } from 'vitest';
import { makeRecord } from './records';
import {
  dailyAverages,
  inPeriod,
  moodObservations,
  scaleObservations,
  sufficiency,
  tagObservations,
} from './insights';
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
        rec({ energy: 4, occurred_at: at(d, 20) }),
      ]),
      ...[13, 14, 15].map((d) => rec({ energy: 2, occurred_at: at(d, 20) })),
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
});
