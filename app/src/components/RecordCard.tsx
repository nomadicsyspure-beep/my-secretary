// 타임라인에 보이는 기록 한 개

import { CalendarClock, Camera, Feather, Lightbulb, Mic, Pencil, Smile, History } from 'lucide-react';
import { RECORD_TYPES, levelLabel, moodOf } from '../lib/constants';
import { fmtDate, fmtTime, isRecalled } from '../lib/dates';
import type { LifeRecord, RecordType, ScaleKey } from '../lib/types';
import { StoredAudio, StoredImage } from './Attachment';

export const TYPE_ICONS: Record<RecordType, typeof Pencil> = {
  checkin: Smile,
  text: Pencil,
  voice: Mic,
  photo: Camera,
  event: CalendarClock,
  idea: Lightbulb,
  thought: Feather,
};

const SCALE_SHORT: Record<ScaleKey, string> = { energy: '에너지', focus: '집중', stress: '부담감' };

export function StateChips({ record }: { record: LifeRecord }) {
  const mood = moodOf(record.mood);
  const scales = (['energy', 'focus', 'stress'] as ScaleKey[]).filter((k) => record[k] != null);
  if (!mood && !scales.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {mood && (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold text-[#3a3a2c]" style={{ background: `${mood.color}aa` }}>
          {mood.emoji} {mood.label}
        </span>
      )}
      {scales.map((k) => (
        <span key={k} className="rounded-full bg-bg2 px-2 py-0.5 text-[12px]">
          {SCALE_SHORT[k]} <b className="font-semibold">{levelLabel(k, record[k]!)}</b>
        </span>
      ))}
    </div>
  );
}

/** 홈의 "오늘의 순간"처럼 좁은 곳에 쓰는 한 줄짜리 기록 */
export function RecordRow({ record, onOpen }: { record: LifeRecord; onOpen: (r: LifeRecord) => void }) {
  const Icon = TYPE_ICONS[record.record_type];
  const mood = moodOf(record.mood);
  const state = [
    mood && `${mood.emoji} ${mood.label}`,
    ...(['energy', 'focus', 'stress'] as ScaleKey[]).filter((k) => record[k] != null).map((k) => `${SCALE_SHORT[k]} ${levelLabel(k, record[k]!)}`),
  ].filter(Boolean);
  const text = state.length ? state.join(' · ') : record.content || RECORD_TYPES[record.record_type].label;
  return (
    <button onClick={() => onOpen(record)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-bg active:bg-bg">
      <span className="w-10 shrink-0 text-[12px] font-semibold tabular-nums text-muted">{fmtTime(record.occurred_at)}</span>
      {record.record_type !== 'checkin' && <Icon size={14} className="shrink-0 text-primary" />}
      <span className="min-w-0 flex-1 truncate text-[13px]">{text}</span>
    </button>
  );
}

export function RecordCard({ record, onOpen }: { record: LifeRecord; onOpen: (r: LifeRecord) => void }) {
  const Icon = TYPE_ICONS[record.record_type];
  const recalled = isRecalled(record.occurred_at, record.created_at);
  return (
    <div className="flex gap-3">
      <div className="w-10 shrink-0 pt-3 text-right text-[12px] font-semibold tabular-nums text-muted">{fmtTime(record.occurred_at)}</div>
      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpen(record)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(record))}
        className="min-w-0 flex-1 cursor-pointer space-y-1.5 rounded-2xl border border-line bg-card p-3 transition hover:border-sage active:scale-[.99]"
      >
        {record.record_type !== 'checkin' && (
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
            <Icon size={14} /> {RECORD_TYPES[record.record_type].label}
          </div>
        )}
        {record.prompt && <p className="text-[12px] text-muted">“{record.prompt}”</p>}
        <StateChips record={record} />
        {record.content && <p className="line-clamp-4 whitespace-pre-line text-[14px] leading-relaxed">{record.content}</p>}
        {record.record_type === 'photo' && record.attachment_url && (
          <StoredImage url={record.attachment_url} className="h-36 w-full rounded-xl" />
        )}
        {record.record_type === 'voice' && record.attachment_url && <StoredAudio url={record.attachment_url} />}
        {record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 text-[12px] text-muted">
            {record.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}
        {recalled && (
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <History size={12} /> {fmtDate(record.created_at)} {fmtTime(record.created_at)}에 돌아보며 남김
          </p>
        )}
      </article>
    </div>
  );
}
