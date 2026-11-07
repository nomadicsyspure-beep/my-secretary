// 날짜·시간 도우미. 모든 저장은 ISO 문자열(UTC), 화면 표시는 기기의 현지 시간.

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

/** 현지 날짜 기준 'YYYY-MM-DD' */
export function dateKey(d: Date | string | number): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 'HH:MM' (24시간) */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** '11월 7일 (토)' */
export function fmtDate(d: Date | string): string {
  const x = new Date(d);
  return `${x.getMonth() + 1}월 ${x.getDate()}일 (${WEEKDAYS[x.getDay()]})`;
}

/** '2026년 11월 7일 토요일' */
export function fmtDateLong(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;
}

/** 오늘/어제는 이름으로, 나머지는 날짜로 */
export function fmtDayLabel(key: string, now = new Date()): string {
  const today = dateKey(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (key === today) return `오늘 · ${fmtDate(parseDateKey(key))}`;
  if (key === dateKey(y)) return `어제 · ${fmtDate(parseDateKey(key))}`;
  const d = parseDateKey(key);
  return d.getFullYear() === now.getFullYear() ? fmtDate(d) : `${d.getFullYear()}년 ${fmtDate(d)}`;
}

/** <input type="datetime-local"> 값 ↔ ISO */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export const PARTS: { key: PartOfDay; label: string; range: string }[] = [
  { key: 'morning', label: '오전', range: '5–12시' },
  { key: 'afternoon', label: '오후', range: '12–18시' },
  { key: 'evening', label: '저녁', range: '18–22시' },
  { key: 'night', label: '밤', range: '22–5시' },
];
export function partOfDay(iso: string): PartOfDay {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

/** 'HH:MM' 을 오늘 날짜의 Date 로 */
export function todayAt(hhmm: string, now = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
}

/** 기록 시각과 발생 시각이 30분 넘게 차이 나면 회상 기록으로 본다 */
export function isRecalled(occurred_at: string, created_at: string): boolean {
  return Date.parse(created_at) - Date.parse(occurred_at) > 30 * 60 * 1000;
}
