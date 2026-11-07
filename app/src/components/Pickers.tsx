// 원터치 기록용 선택 버튼들 (한 화면에 다 들어오도록 작게)

import { Cloud, Target, Zap } from 'lucide-react';
import { MOODS, SCALES } from '../lib/constants';
import type { Level, MoodKey, ScaleKey } from '../lib/types';

export function MoodPicker({ value, onChange }: { value: MoodKey | null; onChange: (v: MoodKey | null) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {MOODS.map((m) => {
        const on = value === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(on ? null : m.key)}
            aria-pressed={on}
            className={`flex flex-col items-center gap-0.5 rounded-2xl border py-2 transition active:scale-95 ${
              on ? 'border-primary ring-2 ring-primary/30' : 'border-line bg-bg'
            }`}
            style={on ? { background: `${m.color}77` } : undefined}
          >
            <span className={`text-[24px] leading-none ${on ? 'animate-pop' : ''}`}>{m.emoji}</span>
            <span className={`whitespace-nowrap text-[11px] tracking-tighter ${on ? 'font-bold' : 'text-muted'}`}>{m.label}</span>
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
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <span className="flex items-center gap-1 text-[13px] font-semibold">
          <Icon size={14} className="text-primary" />
          {s.label}
        </span>
        <span className={`text-[12px] ${value ? 'font-semibold text-primary' : 'text-muted'}`}>
          {value ? s.levels[value - 1] : `${s.levels[0]} → ${s.levels[4]}`}
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
              className={`flex h-9 items-end justify-center rounded-xl border pb-1.5 transition active:scale-95 ${
                on ? 'border-primary bg-primary-soft ring-2 ring-primary/30' : 'border-line bg-bg'
              }`}
            >
              {/* 높이로 정도를 보여주는 작은 막대 */}
              <span className={`w-2 rounded-full transition ${on ? 'bg-primary' : 'bg-sage/50'}`} style={{ height: 4 + lv * 3.5 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
