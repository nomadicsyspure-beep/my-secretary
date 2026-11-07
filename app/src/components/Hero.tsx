// 홈 화면 위쪽의 풍경. 시간대(새벽·낮·저녁·밤)에 따라 그림이 바뀌고,
// 아래쪽은 배경색으로 뿌옇게 번지면서 글자가 그 위에 겹친다.
// 휴대폰에서는 화면 끝까지 꽉 채우고, 머리글(로고·날짜)도 그림 위에 올린다.

import type { ReactNode } from 'react';

interface Scene {
  key: 'dawn' | 'day' | 'evening' | 'night';
  /** 좁은 화면에서 잘릴 때 어느 쪽을 남길지 (병아리가 보이도록) */
  position: string;
}

function sceneFor(hour: number): Scene {
  if (hour >= 5 && hour < 9) return { key: 'dawn', position: '68% 50%' };
  if (hour >= 9 && hour < 16) return { key: 'day', position: '30% 45%' };
  if (hour >= 16 && hour < 20) return { key: 'evening', position: '35% 55%' };
  return { key: 'night', position: '55% 50%' };
}

// 위: 머리글이 읽히도록 살짝 / 가운데: 그림 그대로 / 아래: 배경색으로 녹아들게
const FADE =
  'linear-gradient(to bottom, rgb(var(--bg) / .75) 0%, rgb(var(--bg) / .35) 16%, rgb(var(--bg) / 0) 32%, rgb(var(--bg) / 0) 46%, rgb(var(--bg) / .78) 78%, rgb(var(--bg)) 100%)';
const BLUR_MASK = 'linear-gradient(to bottom, transparent 0%, black 75%)';

export function Hero({ header, children }: { header: ReactNode; children: ReactNode }) {
  const s = sceneFor(new Date().getHours());
  return (
    <div className="relative -mx-4 -mt-[max(10px,env(safe-area-inset-top))] h-[calc(190px+env(safe-area-inset-top))] overflow-hidden [@media(min-height:820px)]:h-[calc(236px+env(safe-area-inset-top))] [@media(min-height:900px)]:h-[calc(268px+env(safe-area-inset-top))] md:mx-0 md:mt-0 md:!h-80 md:rounded-3xl">
      {/* 데이터를 아끼려고 휴대폰은 작은 그림(약 60KB), 태블릿·PC만 큰 그림을 받는다 */}
      <picture>
        <source media="(min-width: 768px)" srcSet={`./scenes/${s.key}.webp`} />
        <img
          src={`./scenes/${s.key}-sm.webp`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: s.position }}
        />
      </picture>
      <div className="absolute inset-0" style={{ background: FADE }} />
      {/* 아래쪽으로 갈수록 살짝 흐려지게 */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-[3px]" style={{ maskImage: BLUR_MASK, WebkitMaskImage: BLUR_MASK }} />
      <div className="relative flex h-full flex-col justify-between px-4 pb-2 pt-[max(10px,env(safe-area-inset-top))] md:px-6 md:pb-5 md:pt-4">
        {header}
        <div className="[text-shadow:0_1px_12px_rgb(var(--bg))]">{children}</div>
      </div>
    </div>
  );
}
