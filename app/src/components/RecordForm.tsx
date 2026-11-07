// 기록 추가·수정 화면 (모든 기록 종류를 한 곳에서 처리)

import { Camera, Clock, ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RECORD_SCALES, RECORD_TYPES, SCALES } from '../lib/constants';
import { fmtDate, fmtTime, fromLocalInput, toLocalInput } from '../lib/dates';
import { compressImage } from '../lib/media';
import { useRecords } from '../lib/records';
import { useSettings } from '../lib/settings';
import { useToast } from '../lib/toast';
import type { Level, LifeRecord, MoodKey, RecordSource, RecordType } from '../lib/types';
import { StoredAudio, StoredImage } from './Attachment';
import { MoodPicker, ScalePicker } from './Pickers';
import { VoiceRecorder } from './VoiceRecorder';

interface Props {
  type: RecordType;
  /** 수정할 기록. 없으면 새 기록 */
  initial?: LifeRecord;
  prompt?: string | null;
  source?: RecordSource;
  onDone: () => void;
}

const parseTags = (text: string) =>
  [...new Set(text.split(/[,#\n]/).map((t) => t.trim()).filter(Boolean))].slice(0, 10);

export function RecordForm({ type, initial, prompt = null, source = 'app', onDone }: Props) {
  const { addRecord, updateRecord, removeRecord } = useRecords();
  const { settings } = useSettings();
  const toast = useToast();
  const isEdit = !!initial;

  const [content, setContent] = useState(initial?.content ?? '');
  const [mood, setMood] = useState<MoodKey | null>(initial?.mood ?? null);
  const [levels, setLevels] = useState<Record<'energy' | 'focus' | 'stress', Level | null>>({
    energy: initial?.energy ?? null,
    focus: initial?.focus ?? null,
    stress: initial?.stress ?? null,
  });
  const [tagText, setTagText] = useState(initial?.tags.join(', ') ?? '');
  const [occurred, setOccurred] = useState(toLocalInput(initial?.occurred_at ?? new Date().toISOString()));
  // 사건은 "언제 있었던 일인지"가 중요하므로 처음부터 시각 입력을 보여준다
  const [whenOpen, setWhenOpen] = useState(type === 'event' || isEdit);
  const [whenHint, setWhenHint] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [replaceMedia, setReplaceMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);
  const photoPreview = useMemo(() => (blob && type === 'photo' ? URL.createObjectURL(blob) : null), [blob, type]);
  useEffect(() => () => void (photoPreview && URL.revokeObjectURL(photoPreview)), [photoPreview]);

  const nowLocal = toLocalInput(new Date().toISOString());
  const hasExistingMedia = isEdit && !!initial?.attachment_url && !replaceMedia;

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    setBlob(await compressImage(file));
    // 사진 파일의 시각을 촬영 시각으로 쓴다 (나중에 바꿀 수 있음)
    if (!isEdit && file.lastModified && file.lastModified < Date.now() - 2 * 60 * 1000) {
      setOccurred(toLocalInput(new Date(file.lastModified).toISOString()));
      setWhenOpen(true);
      setWhenHint('사진 파일의 시각으로 맞췄어요. 다르면 바꿔주세요.');
    }
  }

  function setAgo(hours: number) {
    setOccurred(toLocalInput(new Date(Date.now() - hours * 3600_000).toISOString()));
  }

  function validate(): string | null {
    if (type === 'checkin' && !mood && !levels.energy && !levels.focus && !levels.stress) return '하나 이상 골라주세요.';
    if (['text', 'idea', 'thought', 'event'].includes(type) && !content.trim()) return '내용을 적어주세요.';
    if (type === 'photo' && !blob && !hasExistingMedia) return '사진을 골라주세요.';
    if (type === 'voice' && !blob && !hasExistingMedia) return '녹음하거나 음성 파일을 올려주세요.';
    if (occurred > nowLocal) return '아직 오지 않은 시각은 고를 수 없어요.';
    return null;
  }

  async function save() {
    const problem = validate();
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    const data: Partial<LifeRecord> = {
      content: content.trim() || null,
      tags: parseTags(tagText),
      occurred_at: fromLocalInput(occurred),
      ...(type === 'checkin' ? { mood, ...levels } : {}),
    };
    try {
      if (isEdit) {
        await updateRecord(initial!.id, data, blob ?? undefined);
        toast({ title: '수정했어요' });
      } else {
        await addRecord({ record_type: type, prompt, source, ...data }, blob ?? undefined);
        toast({ title: '기록했어요', detail: RECORD_TYPES[type].label });
      }
      onDone();
    } catch (e) {
      console.error(e);
      setError('저장하지 못했어요. 저장 공간이 부족할 수 있어요. 잠시 후 다시 시도해 주세요.');
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial || !confirm('이 기록을 삭제할까요?\n삭제하면 되돌릴 수 없어요.')) return;
    try {
      await removeRecord(initial.id);
      toast({ title: '삭제했어요', tone: 'info' });
      onDone();
    } catch {
      setError('삭제하지 못했어요. 다시 시도해 주세요.');
    }
  }

  return (
    <div className="space-y-4">
      {prompt && <p className="rounded-2xl bg-primary-soft px-3.5 py-2.5 text-[14px] font-semibold">{prompt}</p>}

      {type === 'checkin' && (
        <>
          <MoodPicker value={mood} onChange={setMood} />
          {SCALES.filter((s) => (RECORD_SCALES.includes(s.key) ? isEdit || settings.scales[s.key] : initial?.[s.key] != null)).map((s) => (
            <ScalePicker key={s.key} scale={s.key} value={levels[s.key]} onChange={(v) => setLevels((l) => ({ ...l, [s.key]: v }))} />
          ))}
        </>
      )}

      {type === 'photo' && (
        <div>
          {photoPreview ? (
            <img src={photoPreview} alt="고른 사진" className="max-h-72 w-full rounded-3xl object-cover" />
          ) : hasExistingMedia ? (
            <StoredImage url={initial!.attachment_url!} className="max-h-72 w-full rounded-3xl" />
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => camera.current?.click()}>
              <Camera size={18} /> 사진 찍기
            </button>
            <button className="btn-ghost" onClick={() => album.current?.click()}>
              <ImagePlus size={18} /> 앨범에서
            </button>
          </div>
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPickPhoto(e.target.files?.[0])} />
          <input ref={album} type="file" accept="image/*" hidden onChange={(e) => onPickPhoto(e.target.files?.[0])} />
        </div>
      )}

      {type === 'voice' &&
        (hasExistingMedia ? (
          <div className="space-y-2 rounded-3xl border border-line bg-bg p-4">
            <StoredAudio url={initial!.attachment_url!} />
            <button className="text-sm text-muted underline" onClick={() => setReplaceMedia(true)}>
              새로 녹음하기
            </button>
          </div>
        ) : (
          <VoiceRecorder onChange={setBlob} />
        ))}

      <div>
        {type !== 'checkin' && <label className="label">{type === 'event' ? '어떤 일이 있었나요?' : '내용'}</label>}
        <textarea
          className="field min-h-[88px] resize-y leading-relaxed"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={RECORD_TYPES[type].placeholder}
          rows={type === 'checkin' ? 2 : 4}
        />
      </div>

      {type !== 'checkin' && (
        <div>
          <label className="label">태그 (선택 · 일, 장소, 상황)</label>
          <input className="field" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="예: 산책, 회사, 카페" />
        </div>
      )}

      <div>
        {whenOpen ? (
          <>
            <label className="label">{type === 'event' ? '언제 있었던 일인가요?' : type === 'photo' ? '촬영 시각' : '언제의 일인가요?'}</label>
            <input type="datetime-local" className="field" value={occurred} max={nowLocal} onChange={(e) => setOccurred(e.target.value)} />
            {!isEdit && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  ['방금', 0],
                  ['1시간 전', 1],
                  ['3시간 전', 3],
                  ['6시간 전', 6],
                ].map(([label, h]) => (
                  <button key={label} className="chip" onClick={() => setAgo(h as number)}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {whenHint && <p className="mt-2 text-[12px] text-muted">{whenHint}</p>}
          </>
        ) : (
          <button className="flex items-center gap-1.5 text-[13px] text-muted" onClick={() => setWhenOpen(true)}>
            <Clock size={14} /> 지금의 일이에요 · <u>지난 일이면 시각 바꾸기</u>
          </button>
        )}
      </div>

      {isEdit && (
        <p className="text-[12px] text-muted">
          처음 기록 {fmtDate(initial!.created_at)} {fmtTime(initial!.created_at)}
          {initial!.updated_at !== initial!.created_at && ` · 마지막 수정 ${fmtDate(initial!.updated_at)} ${fmtTime(initial!.updated_at)}`}
        </p>
      )}

      {error && <p className="rounded-2xl bg-apricot/25 px-4 py-3 text-sm">{error}</p>}

      <div className="flex gap-2">
        {isEdit && (
          <button className="btn-ghost px-4 text-brown" onClick={remove} aria-label="삭제">
            <Trash2 size={18} /> 삭제
          </button>
        )}
        <button className="btn-primary flex-1" onClick={save} disabled={saving}>
          {saving ? '저장 중…' : isEdit ? '수정 저장' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
