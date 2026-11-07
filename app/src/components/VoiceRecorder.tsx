// 음성 기록: 브라우저에서 바로 녹음하거나 파일을 올린다

import { Mic, Square, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { canRecordAudio, recordingMime } from '../lib/media';

export function VoiceRecorder({ onChange }: { onChange: (blob: Blob | null) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number>();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      window.clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const setBlob = (blob: Blob | null) => {
    setPreview(blob ? URL.createObjectURL(blob) : null);
    onChange(blob);
  };

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = recordingMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setBlob(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
      setSeconds(0);
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError('마이크를 사용할 수 없어요. 권한을 허용하거나, 녹음 파일을 올려주세요.');
    }
  }

  function stop() {
    window.clearInterval(timer.current);
    recorder.current?.stop();
    setRecording(false);
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-3xl border border-line bg-bg p-4">
      {preview && !recording ? (
        <div className="space-y-3">
          <audio controls src={preview} className="h-10 w-full" />
          <button className="text-sm text-muted underline" onClick={() => setBlob(null)}>
            다시 녹음하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          {canRecordAudio() && (
            <button
              onClick={recording ? stop : start}
              className={`grid h-16 w-16 place-items-center rounded-full text-white shadow-soft transition active:scale-95 ${
                recording ? 'animate-pulse bg-apricot' : 'bg-primary'
              }`}
              aria-label={recording ? '녹음 멈추기' : '녹음 시작'}
            >
              {recording ? <Square size={22} fill="currentColor" /> : <Mic size={26} />}
            </button>
          )}
          <p className="text-sm text-muted">{recording ? `녹음 중 ${mmss}` : canRecordAudio() ? '눌러서 녹음하기' : '이 브라우저는 녹음을 지원하지 않아요'}</p>
          {!recording && (
            <button className="chip" onClick={() => fileInput.current?.click()}>
              <Upload size={14} /> 음성 파일 올리기
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-brown">{error}</p>}
      <input
        ref={fileInput}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setBlob(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
