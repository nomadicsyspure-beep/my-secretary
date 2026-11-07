// 이전 버전(나의 비서실)에서 남긴 기록을 LIFE OS 기록으로 옮긴다.
// 이전 데이터는 지우지 않고 그대로 둔다.

import { LOCAL_USER } from './constants';
import type { LifeRecord, Level, RecordType } from './types';

interface LegacyDay {
  wake?: number;
  checkin?: { energy?: number; concern?: number; need?: number; at?: number } | null;
  focusTask?: string;
  focusDone?: boolean;
  closing?: { kind?: number; step?: string; line?: string; at?: number } | null;
  worries?: string[];
}

const CONCERNS = ['경제적 문제', '미래에 대한 불안', '자기비판과 열등감', '일과 피로', '특별한 고민 없음'];
const NEEDS = ['차분하게 하루 보내기', '작은 목표 하나 달성하기', '새로운 것 배우기', '충분히 쉬기'];
const CLOSINGS = ['한 걸음 나아갔어요', '잘 쉬었어요', '버텼어요', '그냥 흘러갔어요'];
/** 이전 에너지(매우 좋음·보통·조금 지침·많이 지침) → 1~5 */
const ENERGY: Level[] = [5, 3, 2, 1];

function readLegacyDays(): LegacyDay[] {
  try {
    const days: LegacyDay[] = JSON.parse(localStorage.getItem('rhythm.days') || '[]');
    const today: LegacyDay = JSON.parse(localStorage.getItem('rhythm.v1') || '{}');
    if (today.wake && !days.some((d) => d.wake === today.wake)) days.push(today);
    return days.filter((d) => typeof d.wake === 'number');
  } catch {
    return [];
  }
}

export function convertLegacy(): LifeRecord[] {
  const out: LifeRecord[] = [];
  const make = (id: string, type: RecordType, at: number, patch: Partial<LifeRecord>): LifeRecord => {
    const iso = new Date(Math.min(at, Date.now())).toISOString();
    return {
      id, user_id: LOCAL_USER, record_type: type, content: null, mood: null, energy: null, focus: null, stress: null,
      tags: [], occurred_at: iso, started_at: null, created_at: iso, updated_at: iso, source: 'legacy',
      attachment_url: null, attachment_mime: null, transcript: null, prompt: null, ...patch,
    };
  };

  for (const d of readLegacyDays()) {
    const wake = d.wake!;
    const c = d.checkin;
    if (c && c.energy != null) {
      const lines = [
        c.concern != null && `신경 쓰이는 것: ${CONCERNS[c.concern]}`,
        c.need != null && `필요한 것: ${NEEDS[c.need]}`,
      ].filter(Boolean);
      out.push(make(`legacy-${wake}-checkin`, 'checkin', c.at ?? wake, {
        energy: ENERGY[c.energy] ?? null,
        content: lines.join('\n') || null,
      }));
    }
    if (d.focusTask) {
      out.push(make(`legacy-${wake}-focus`, 'text', wake, {
        content: `오늘의 한 가지: ${d.focusTask}${d.focusDone ? ' (끝냄)' : ''}`,
      }));
    }
    const evening = d.closing?.at ?? wake + 13 * 3600_000;
    if (d.closing && d.closing.kind != null) {
      const lines = [
        `하루 마무리: ${CLOSINGS[d.closing.kind] ?? ''}`,
        d.closing.step && `방향으로 움직인 것: ${d.closing.step}`,
        d.closing.line && d.closing.line,
      ].filter(Boolean);
      out.push(make(`legacy-${wake}-closing`, 'thought', evening, { content: lines.join('\n') }));
    }
    (d.worries ?? []).forEach((w, i) => {
      out.push(make(`legacy-${wake}-worry-${i}`, 'thought', evening, { content: `내려놓은 걱정: ${w}` }));
    });
  }
  return out;
}

export const hasLegacyData = () => readLegacyDays().length > 0;
