// 원터치 기록용 선택 버튼들

import { Cloud, Target, Zap } from 'lucide-react';
import { MOODS, SCALES } from '../lib/constants';
import type { Level, MoodKey, ScaleKey } from '../lib/types';

export function MoodPicker({ value, onChange }: { value: MoodKey | null; onChange: (v: MoodKey | null) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {MOODS.map((m) => {
        const on = value === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(on ? null : m.key)}
            aria-pressed={on}
            className={`flex flex-col items-center gap-1 rounded-3xl border py-3 transition active:scale-95 ${
              on ? 'border-primary shadow-sm ring-2 ring-primary/30' : 'border-line bg-bg'
            }`}
            style={on ? { background: `${m.color}66` } : undefined}
          >
            <span className={`text-[28px] leading-none ${on ? 'animate-pop' : ''}`}>{m.emoji}</span>
            <span className={`text-[12px] ${on ? 'font-bold' : 'text-muted'}`}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const SCALE_ICONS = { energy: Zap, focus: Target, stress: Cloud };

export function ScalePicker({
  scale,
  value,
  onChange,
}: {
  scale: ScaleKey;
  value: Level | null;
  onChange: (v: Level | null) => void;
}) {
  const s = SCALES.find((x) => x.key === scale)!;
  const Icon = SCALE_ICONS[scale];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[14px] font-semibold">
          <Icon size={16} className="text-primary" />
          {s.label}
        </span>
        <span className={`text-[13px] ${value ? 'font-semibold text-primary' : 'text-muted'}`}>
          {value ? s.levels[value - 1] : '선택 안 함'}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {([1, 2, 3, 4, 5] as Level[]).map((lv) => {
          const on = value === lv;
          return (
            <button
              key={lv}
              onClick={() => onChange(on ? null : lv)}
              aria-pressed={on}
              aria-label={`${s.label} ${s.levels[lv - 1]}`}
              className={`flex h-12 items-end justify-center rounded-2xl border pb-2 transition active:scale-95 ${
                on ? 'border-primary bg-primary-soft ring-2 ring-primary/30' : 'border-line bg-bg'
              }`}
            >
              {/* 높이로 정도를 보여주는 작은 막대 */}
              <span
                className={`w-2.5 rounded-full transition ${on ? 'bg-primary' : 'bg-sage/50'}`}
                style={{ height: 6 + lv * 5 }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted">
        <span>{s.levels[0]}</span>
        <span>{s.levels[4]}</span>
      </div>
    </div>
  );
}
