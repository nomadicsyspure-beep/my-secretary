// 저장된 사진·음성 파일을 화면에 보여준다

import { useEffect, useState } from 'react';
import { repository } from '../lib/repository';

/** 저장소의 첨부파일을 화면에서 쓸 수 있는 주소로 바꾼다 */
export function useAttachmentURL(url: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return setSrc(null);
    let objectURL: string | null = null;
    let alive = true;
    repository.getAttachment(url).then((blob) => {
      if (!alive || !blob) return;
      objectURL = URL.createObjectURL(blob);
      setSrc(objectURL);
    });
    return () => {
      alive = false;
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [url]);
  return src;
}

export function StoredImage({ url, className = '' }: { url: string; className?: string }) {
  const src = useAttachmentURL(url);
  if (!src) return <div className={`animate-pulse bg-bg2 ${className}`} />;
  return <img src={src} alt="기록한 사진" className={`object-cover ${className}`} loading="lazy" />;
}

export function StoredAudio({ url }: { url: string }) {
  const src = useAttachmentURL(url);
  if (!src) return null;
  return <audio controls src={src} className="h-10 w-full" preload="metadata" onClick={(e) => e.stopPropagation()} />;
}
