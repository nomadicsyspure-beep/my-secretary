// 기록 (메인 홈): 지금의 상태를 원터치로 남기는 곳. 휴대폰 한 화면 안에 다 들어오게 만든다.
// 통계나 점수는 보여주지 않는다.

import { BedDouble, Bell, Check, ChevronRight, Moon, Plus, Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { MoodPicker, ScalePicker } from '../components/Pickers';
import { RecordRow } from '../components/RecordCard';
import { SleepSheet } from '../components/SleepSheet';
import type { AddRequest } from '../components/Sheets';
import { Logo, Sheet } from '../components/ui';
import { RECALL_QUESTIONS, RECORD_SCALES, levelLabel, moodOf, scaleOf } from '../lib/constants';
import { WEEKDAYS, dateKey, todayAt } from '../lib/dates';
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

type Levels = Partial<Record<ScaleKey, Level | null>>;

export function RecordScreen({ onAdd, onOpen }: { onAdd: (r: AddRequest) => void; onOpen: (r: LifeRecord) => void }) {
  const { records, addRecord } = useRecords();
  const { settings, update } = useSettings();
  const toast = useToast();
  const now = useNow();
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [levels, setLevels] = useState<Levels>({});
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [recallOpen, setRecallOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);

  const scales = RECORD_SCALES.filter((k) => settings.scales[k]);
  // 감정·집중력·부담감은 각각 따로 기록할 수 있다. 하나만 골라도 저장된다.
  const anySelected = mood != null || Object.values(levels).some((v) => v != null);

  async function save() {
    if (!anySelected || saving) return;
    setSaving(true);
    try {
      await addRecord({ record_type: 'checkin', mood, ...levels });
      const summary = [
        moodOf(mood)?.label,
        ...RECORD_SCALES.filter((k) => levels[k]).map((k) => `${scaleOf(k).label} ${levelLabel(k, levels[k]!)}`),
      ].filter(Boolean);
      toast({ title: '기록했어요', detail: summary.join(' · ') });
      setMood(null);
      setLevels({});
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

  // 아침(4–15시)에 오늘 일어난 수면 기록이 없으면 어젯밤 수면을 묻는다.
  // 그날 처음 열 때 한 번만 창을 띄우고, 닫으면 한 줄 카드로 남긴다.
  const sleptToday = records.some((r) => r.record_type === 'sleep' && dateKey(r.occurred_at) === todayKey);
  const showSleep =
    settings.sleepPrompt && now.getHours() >= 4 && now.getHours() < 15 && !sleptToday && settings.sleepDismissedOn !== todayKey;
  useEffect(() => {
    if (showSleep && settings.sleepPromptedOn !== todayKey) {
      setSleepOpen(true);
      update({ sleepPromptedOn: todayKey });
    }
  }, [showSleep, todayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <div>
      <header className="mb-1 flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <Logo />
          <span className="text-[12px] text-muted">
            {now.getMonth() + 1}월 {now.getDate()}일 ({WEEKDAYS[now.getDay()]}) {hh}:{mm}
          </span>
        </div>
        <div className="flex gap-1 text-muted">
          <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-card" onClick={() => navigate('me', { section: 'reminders' })} aria-label="알림 설정">
            <Bell size={17} />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-card" onClick={() => navigate('me')} aria-label="설정">
            <SettingsIcon size={17} />
          </button>
        </div>
      </header>

      <Hero>
        <h1 className="font-display text-[22px] font-bold leading-snug md:text-[28px]">
          {settings.name ? `${settings.name}님, ` : ''}지금, 어떤 상태인가요?
        </h1>
      </Hero>

      {/* 휴대폰에서는 기록 카드가 풍경의 뿌연 끝자락에 살짝 겹친다 */}
      <div className="relative -mt-1 grid grid-cols-1 gap-3 md:mt-3 lg:grid-cols-2 lg:items-start">
        <section className="card space-y-3 p-3 lg:col-start-2 lg:row-start-1">
          <MoodPicker value={mood} onChange={setMood} />
          {scales.map((k) => (
            <ScalePicker key={k} scale={k} value={levels[k] ?? null} onChange={(v) => setLevels((l) => ({ ...l, [k]: v }))} />
          ))}

          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <span className="text-[12px] leading-tight text-muted">
              {anySelected ? (
                '눌러서 기록'
              ) : (
                <>
                  하나만 골라도
                  <br />
                  기록돼요
                </>
              )}
            </span>
            <button
              key={savedCount}
              onClick={save}
              disabled={!anySelected || saving}
              aria-label="지금 상태 기록하기"
              className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-soft transition active:scale-95 ${
                anySelected ? 'bg-primary' : 'bg-line text-muted shadow-none'
              } ${savedCount ? 'animate-pop' : ''}`}
            >
              <Check size={28} strokeWidth={2.6} />
            </button>
            <button
              onClick={() => onAdd({})}
              className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-line bg-bg text-primary transition active:scale-95"
              aria-label="메모·사진·음성 등 더 기록하기"
              title="더 기록하기"
            >
              <Plus size={20} />
            </button>
          </div>
        </section>

        <div className="space-y-3 lg:col-start-1 lg:row-start-1">
          {showSleep ? (
            <button onClick={() => setSleepOpen(true)} className="card flex w-full items-center gap-2.5 px-4 py-2.5 text-left">
              <BedDouble size={16} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-[13px]">
                <b>어젯밤 수면</b>
                <span className="text-muted"> · 언제 자고 일어났나요?</span>
              </span>
              <ChevronRight size={16} className="text-muted" />
            </button>
          ) : showRecall && (
            <button onClick={() => setRecallOpen(true)} className="card flex w-full items-center gap-2.5 px-4 py-2.5 text-left">
              <Moon size={16} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-[13px]">
                <b>오늘의 기억 복원</b>
                <span className="text-muted"> · 기억하고 싶은 순간이 있나요?</span>
              </span>
              <ChevronRight size={16} className="text-muted" />
            </button>
          )}

          {today.length > 0 ? (
            <section className="card px-2 py-1.5">
              <div className="flex items-center justify-between px-2 pb-1 pt-0.5">
                <h2 className="text-[13px] font-bold">오늘의 순간</h2>
                <button className="flex items-center text-[12px] text-muted" onClick={() => navigate('memory', { date: todayKey })}>
                  전체 보기 <ChevronRight size={14} />
                </button>
              </div>
              {today.slice(0, 3).map((r, i) => (
                <div key={r.id} className={i === 2 ? '[@media(max-height:780px)]:hidden' : ''}>
                  <RecordRow record={r} onOpen={onOpen} />
                </div>
              ))}
            </section>
          ) : (
            <p className="py-2 text-center text-[12px] text-muted">기록하지 않는 날도 괜찮아요 🌿</p>
          )}
        </div>
      </div>

      <SleepSheet
        open={sleepOpen}
        onClose={() => setSleepOpen(false)}
        onSkipToday={() => {
          update({ sleepDismissedOn: todayKey });
          setSleepOpen(false);
        }}
      />

      <Sheet open={recallOpen} onClose={() => setRecallOpen(false)} title="오늘의 기억 복원">
        <p className="-mt-2 mb-3 text-[13px] text-muted">오늘 기록하지 못한 순간 중 기억하고 싶은 것이 있나요? 모두 선택이에요.</p>
        <div className="grid gap-2">
          {RECALL_QUESTIONS.map((q) => (
            <button
              key={q.text}
              onClick={() => {
                setRecallOpen(false);
                onAdd({ type: q.type, prompt: q.text, source: 'recall' });
              }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3 text-left text-[14px] transition active:scale-[.99]"
            >
              <span className="text-lg">{q.emoji}</span>
              {q.text}
            </button>
          ))}
        </div>
        <button
          className="mt-3 w-full rounded-full py-2 text-[13px] text-muted"
          onClick={() => {
            update({ recallDismissedOn: todayKey });
            setRecallOpen(false);
          }}
        >
          오늘은 넘어갈게요
        </button>
      </Sheet>
    </div>
  );
}
