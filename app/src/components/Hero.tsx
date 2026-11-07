// 홈 화면 위쪽의 풍경 그림. 시간대(새벽·낮·저녁·밤)에 따라 하늘과 해가 바뀐다.

import type { ReactNode } from 'react';

interface Scene {
  sky: [string, string];
  sun: { x: number; y: number; r: number; inner: string; outer: string };
  hills: [string, string, string];
  rock: string;
  night: boolean;
}

function sceneFor(hour: number): Scene {
  if (hour >= 5 && hour < 9)
    return { sky: ['#F6D6B1', '#FBEEDB'], sun: { x: 92, y: 122, r: 30, inner: '#FFF3CF', outer: '#F5C068' }, hills: ['#DCDDBF', '#B4C199', '#8C9E67'], rock: '#B9AE97', night: false };
  if (hour >= 9 && hour < 16)
    return { sky: ['#E5EDD5', '#FBF6EA'], sun: { x: 300, y: 104, r: 22, inner: '#FFF7DA', outer: '#F4D573' }, hills: ['#D6DEC2', '#AEBF95', '#849A5D'], rock: '#BCB29C', night: false };
  if (hour >= 16 && hour < 20)
    return { sky: ['#F1BB91', '#FAE3C6'], sun: { x: 118, y: 128, r: 34, inner: '#FFE6AE', outer: '#F0A25B' }, hills: ['#D9C4A6', '#A8AD83', '#7C8B57'], rock: '#AE9E86', night: false };
  return { sky: ['#283141', '#46506A'], sun: { x: 300, y: 102, r: 16, inner: '#FBF4DA', outer: '#E5D6A2' }, hills: ['#3B4652', '#33403A', '#29342A'], rock: '#575A50', night: true };
}

export function Hero({ children }: { children: ReactNode }) {
  const s = sceneFor(new Date().getHours());
  return (
    <div className="relative h-[116px] overflow-hidden rounded-3xl md:h-60">
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full dark:brightness-[.82]" aria-hidden>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={s.sky[0]} />
            <stop offset="1" stopColor={s.sky[1]} />
          </linearGradient>
          <radialGradient id="sun">
            <stop offset="0" stopColor={s.sun.inner} />
            <stop offset="1" stopColor={s.sun.outer} />
          </radialGradient>
          <radialGradient id="glow">
            <stop offset="0" stopColor={s.sun.outer} stopOpacity=".55" />
            <stop offset="1" stopColor={s.sun.outer} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="240" fill="url(#sky)" />
        {s.night &&
          [[40, 100], [90, 124], [150, 94], [210, 112], [250, 92], [360, 128], [120, 132], [345, 96]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#FFF8E0" opacity=".8" />
          ))}
        <circle cx={s.sun.x} cy={s.sun.y} r={s.sun.r * 2.6} fill="url(#glow)" />
        <circle cx={s.sun.x} cy={s.sun.y} r={s.sun.r} fill="url(#sun)" />
        {/* 먼 산 → 가까운 언덕 */}
        <path d="M0 150 L38 124 L76 138 L128 98 L176 132 L226 108 L282 142 L336 112 L400 138 V240 H0Z" fill={s.hills[0]} />
        <path d="M0 176 C58 152 110 166 160 152 C220 134 262 162 320 152 C360 145 386 156 400 153 V240 H0Z" fill={s.hills[1]} />
        <path d="M0 208 C70 188 140 202 210 193 C280 184 340 197 400 188 V240 H0Z" fill={s.hills[2]} />
        {/* 바위 위에서 쉬는 병아리 */}
        <g transform="translate(322 188)">
          <ellipse cx="0" cy="14" rx="40" ry="15" fill={s.rock} />
          <ellipse cx="0" cy="-8" rx="24" ry="22" fill="#F6D46A" />
          <ellipse cx="-6" cy="-14" rx="10" ry="8" fill="#FBE6A2" opacity=".8" />
          <path d="M-11 -10 q4 3 8 0" stroke="#5B4A2E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M5 -10 q4 3 8 0" stroke="#5B4A2E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="-13" cy="-3" r="3" fill="#F2A98B" opacity=".6" />
          <circle cx="15" cy="-3" r="3" fill="#F2A98B" opacity=".6" />
          <path d="M0 -6 l4 3 l-4 2 l-4 -2Z" fill="#E9A044" />
          <path d="M0 -30 v-6" stroke="#6F8A3E" strokeWidth="2" strokeLinecap="round" />
          <path d="M0 -35 c-2 -6 -8 -8 -12 -6 c2 5 7 7 12 6Z" fill="#7E9A48" />
          <path d="M0 -35 c2 -6 8 -8 12 -6 c-2 5 -7 7 -12 6Z" fill="#94B05A" />
        </g>
      </svg>
      <div className={`relative px-4 py-3.5 ${s.night ? 'text-[#F5EFDD]' : 'text-forest'}`}>{children}</div>
    </div>
  );
}
