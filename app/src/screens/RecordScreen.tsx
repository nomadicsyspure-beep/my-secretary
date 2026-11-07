// 기록 (메인 홈): 지금의 상태를 원터치로 남기는 곳. 통계나 점수는 보여주지 않는다.

import { Bell, CalendarHeart, Check, Plus, Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { MoodPicker, ScalePicker } from '../components/Pickers';
import { RecordCard } from '../components/RecordCard';
import type { AddRequest } from '../components/Sheets';
import { Logo, SectionTitle } from '../components/ui';
import { RECALL_QUESTIONS, SCALES, levelLabel, moodOf } from '../lib/constants';
import { dateKey, fmtDateLong, todayAt } from '../lib/dates';
import { useRecords } from '../lib/records';
import { navigate } from '../lib/router';
import { useSettings } from '../lib/settings';
import { useToast } from '../lib/toast';
import type { Level, LifeRecord, MoodKey, ScaleKey } from '../lib/types';

/** 1분마다 바뀌는 현재 시각 */
function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

type Levels = Record<ScaleKey, Level | null>;
const EMPTY: Levels = { energy: null, focus: null, stress: null };

export function RecordScreen({ onAdd, onOpen }: { onAdd: (r: AddRequest) => void; onOpen: (r: LifeRecord) => void }) {
  const { records, addRecord } = useRecords();
  const { settings, update } = useSettings();
  const toast = useToast();
  const now = useNow();
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [levels, setLevels] = useState<Levels>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // 기분·에너지·집중·부담감은 각각 따로 기록할 수 있다. 하나만 골라도 저장된다.
  const anySelected = mood != null || Object.values(levels).some((v) => v != null);

  async function save() {
    if (!anySelected || saving) return;
    setSaving(true);
    try {
      await addRecord({ record_type: 'checkin', mood, ...levels });
      const summary = [
        moodOf(mood)?.label,
        ...SCALES.filter((s) => levels[s.key]).map((s) => `${s.label} ${levelLabel(s.key, levels[s.key]!)}`),
      ].filter(Boolean);
      toast({ title: '기록했어요', detail: summary.join(' · ') });
      setMood(null);
      setLevels(EMPTY);
      setSavedCount((n) => n + 1);
      navigator.vibrate?.(20);
    } catch {
      toast({ title: '저장하지 못했어요', detail: '잠시 후 다시 시도해 주세요', tone: 'info' });
    } finally {
      setSaving(false);
    }
  }

  const todayKey = dateKey(now);
  const today = records.filter((r) => dateKey(r.occurred_at) === todayKey);
  const showRecall =
    settings.recall.enabled && now >= todayAt(settings.recall.time, now) && settings.recallDismissedOn !== todayKey;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <div>
      <header className="flex items-center justify-between py-3">
        <Logo />
        <div className="flex gap-1 text-muted">
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-card" onClick={() => navigate('me', { section: 'reminders' })} aria-label="알림 설정">
            <Bell size={20} />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-card" onClick={() => navigate('me')} aria-label="설정">
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>
      <p className="mb-3 px-1 text-[13px] text-muted">
        {fmtDateLong(now)} · {hh}:{mm}
      </p>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Hero>
          <h1 className="font-display text-[27px] font-bold leading-snug md:text-[32px]">
            {settings.name ? `${settings.name}님,` : '지금,'}
            <br />
            어떤 상태인가요?
          </h1>
        </Hero>

        <section className="card space-y-5 p-4 sm:p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <MoodPicker value={mood} onChange={setMood} />
          {SCALES.filter((s) => settings.scales[s.key]).map((s) => (
            <ScalePicker key={s.key} scale={s.key} value={levels[s.key]} onChange={(v) => setLevels((l) => ({ ...l, [s.key]: v }))} />
          ))}

          <div className="relative flex flex-col items-center gap-2 pt-1">
            <button
              key={savedCount}
              onClick={save}
              disabled={!anySelected || saving}
              aria-label="지금 상태 기록하기"
              className={`grid h-[76px] w-[76px] place-items-center rounded-full text-white shadow-soft transition active:scale-95 ${
                anySelected ? 'bg-primary' : 'bg-line text-muted shadow-none'
              } ${savedCount ? 'animate-pop' : ''}`}
            >
              <Check size={36} strokeWidth={2.6} />
            </button>
            <span className="text-[13px] text-muted">{anySelected ? '눌러서 기록하기' : '하나만 골라도 기록돼요'}</span>
            <button
              onClick={() => onAdd({})}
              className="absolute right-0 top-4 grid h-12 w-12 place-items-center rounded-full border border-line bg-bg text-primary transition active:scale-95"
              aria-label="메모·사진·음성 등 더 기록하기"
              title="더 기록하기"
            >
              <Plus size={22} />
            </button>
          </div>
        </section>

        <div className="space-y-4 lg:col-start-1">
          {showRecall && (
            <section className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-[19px] font-bold">오늘의 기억 복원</h2>
                  <p className="mt-1 text-[14px] text-muted">오늘 기록하지 못한 순간 중 기억하고 싶은 것이 있나요?</p>
                </div>
                <CalendarHeart className="shrink-0 text-primary" size={22} />
              </div>
              <div className="mt-4 grid gap-2">
                {RECALL_QUESTIONS.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => onAdd({ type: q.type, prompt: q.text, source: 'recall' })}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3 text-left text-[14px] transition active:scale-[.99]"
                  >
                    <span className="text-xl">{q.emoji}</span>
                    {q.text}
                  </button>
                ))}
              </div>
              <button className="mt-3 w-full rounded-full py-2 text-[14px] text-muted" onClick={() => update({ recallDismissedOn: todayKey })}>
                나중에 할게요
              </button>
            </section>
          )}

          {today.length > 0 ? (
            <div>
              <SectionTitle
                action={
                  <button className="text-[13px] text-muted underline" onClick={() => navigate('memory', { date: todayKey })}>
                    오늘 전체 보기
                  </button>
                }
              >
                오늘의 순간
              </SectionTitle>
              <div className="space-y-2">
                {today.slice(0, 5).map((r) => (
                  <RecordCard key={r.id} record={r} onOpen={onOpen} />
                ))}
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-[13px] text-muted">기록하지 않는 날도 괜찮아요 🌿</p>
          )}
        </div>
      </div>
    </div>
  );
}
