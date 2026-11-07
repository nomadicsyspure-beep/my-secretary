// 아침 수면 기록: 어젯밤 몇 시에 자고 몇 시에 일어났는지 시각만 고르면 끝.

import { useMemo, useState } from 'react';
import { fmtMinutes, resolveSleep } from '../lib/dates';
import { useRecords } from '../lib/records';
import { useToast } from '../lib/toast';
import { Sheet } from './ui';

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** 5분 단위로 내림 */
const floor5 = (d: Date) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - (x.getMinutes() % 5), 0, 0);
  return x;
};

export function SleepSheet({ open, onClose, onSkipToday }: { open: boolean; onClose: () => void; onSkipToday: () => void }) {
  const { records, addRecord } = useRecords();
  const toast = useToast();

  // 기본값: 지난번 수면 기록의 시각 (없으면 23:30 / 지금)
  const defaults = useMemo(() => {
    const last = records.find((r) => r.record_type === 'sleep' && r.started_at);
    const now = new Date();
    const lastWake = last ? hhmm(new Date(last.occurred_at)) : null;
    return {
      bed: last ? hhmm(new Date(last.started_at!)) : '23:30',
      wake: lastWake && lastWake <= hhmm(now) ? lastWake : hhmm(floor5(now)),
    };
  }, [records, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const [bed, setBed] = useState<string | null>(null);
  const [wake, setWake] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const bedValue = bed ?? defaults.bed;
  const wakeValue = wake ?? defaults.wake;
  const { start, end } = resolveSleep(bedValue, wakeValue);
  const minutes = (end.getTime() - start.getTime()) / 60000;

  async function save() {
    setSaving(true);
    try {
      await addRecord({ record_type: 'sleep', started_at: start.toISOString(), occurred_at: end.toISOString() });
      toast({ title: '수면을 기록했어요', detail: fmtMinutes(minutes) });
      setBed(null);
      setWake(null);
      onClose();
    } catch {
      toast({ title: '저장하지 못했어요', detail: '잠시 후 다시 시도해 주세요', tone: 'info' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="어젯밤 수면">
      <p className="-mt-2 mb-4 text-[13px] text-muted">언제 자고 언제 일어났나요? 대충이어도 괜찮아요.</p>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="rounded-2xl border border-line bg-bg p-3">
          <span className="block text-[12px] font-semibold text-muted">🌙 잠든 시각</span>
          <input type="time" step={300} value={bedValue} onChange={(e) => e.target.value && setBed(e.target.value)} className="mt-1 w-full bg-transparent text-[22px] font-bold outline-none" />
        </label>
        <label className="rounded-2xl border border-line bg-bg p-3">
          <span className="block text-[12px] font-semibold text-muted">☀️ 일어난 시각</span>
          <input type="time" step={300} value={wakeValue} onChange={(e) => e.target.value && setWake(e.target.value)} className="mt-1 w-full bg-transparent text-[22px] font-bold outline-none" />
        </label>
      </div>
      <p className="mt-3 text-center text-[14px]">
        <b>{fmtMinutes(minutes)}</b> <span className="text-muted">잤어요</span>
        <span className="block text-[12px] text-muted">
          {start.getMonth() + 1}/{start.getDate()} {hhmm(start)} → {end.getMonth() + 1}/{end.getDate()} {hhmm(end)}
        </span>
      </p>
      <button className="btn-primary mt-4 w-full" onClick={save} disabled={saving || minutes <= 0}>
        {saving ? '저장 중…' : '기록하기'}
      </button>
      <button className="mt-2 w-full rounded-full py-2 text-[13px] text-muted" onClick={onSkipToday}>
        오늘은 넘어갈게요
      </button>
    </Sheet>
  );
}
