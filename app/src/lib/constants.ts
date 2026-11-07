import type { Level, MoodKey, RecordType, ScaleKey } from './types';

export const LOCAL_USER = 'local';
export const APP_VERSION = '1.1.0';

// 감정은 좋고 나쁨으로 나누지 않는다. 색도 빨강/초록 같은 평가 색을 피하고 부드러운 톤만 쓴다.
type Mood = { key: MoodKey; emoji: string; label: string; color: string };

/** 홈에서 고를 수 있는 감정 */
export const MOODS: Mood[] = [
  { key: 'best', emoji: '🤩', label: '최고', color: '#F3C665' },
  { key: 'good', emoji: '😊', label: '좋음', color: '#F2D98C' },
  { key: 'okay', emoji: '😶', label: '무덤덤', color: '#E3D8C2' },
  { key: 'tired', emoji: '😪', label: '피곤', color: '#D8BF9E' },
  { key: 'stressed', emoji: '😤', label: '스트레스', color: '#F0B48E' },
  { key: 'anxious', emoji: '😰', label: '불안', color: '#CFC2E0' },
];

/** 예전에 고를 수 있던 감정. 새로 고를 수는 없지만 이미 남긴 기록은 그대로 보여준다. */
export const RETIRED_MOODS: Mood[] = [
  { key: 'sad', emoji: '😔', label: '슬픔', color: '#B8C6D4' },
  { key: 'lethargic', emoji: '😴', label: '무기력', color: '#C8CBBD' },
  { key: 'calm', emoji: '😌', label: '평온', color: '#AFC79F' },
];

export const ALL_MOODS: Mood[] = [...MOODS, ...RETIRED_MOODS];
export const moodOf = (key: MoodKey | null) => ALL_MOODS.find((m) => m.key === key) ?? null;

export const SCALES: { key: ScaleKey; label: string; levels: [string, string, string, string, string] }[] = [
  { key: 'energy', label: '에너지', levels: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'] },
  { key: 'focus', label: '집중력', levels: ['전혀 안 됨', '낮음', '보통', '좋음', '매우 좋음'] },
  { key: 'stress', label: '부담감', levels: ['전혀 없음', '낮음', '보통', '높음', '매우 높음'] },
];
export const scaleOf = (key: ScaleKey) => SCALES.find((s) => s.key === key)!;

/** 홈에서 기록하는 항목. 에너지는 집중력과 겹쳐서 뺐다 (예전 에너지 기록은 그대로 보여준다) */
export const RECORD_SCALES: ScaleKey[] = ['focus', 'stress'];
export const levelLabel = (key: ScaleKey, level: Level) => scaleOf(key).levels[level - 1];

export const RECORD_TYPES: Record<RecordType, { label: string; placeholder: string }> = {
  checkin: { label: '상태 기록', placeholder: '덧붙이고 싶은 말이 있다면 (선택)' },
  text: { label: '텍스트 메모', placeholder: '오늘 있었던 일, 기억하고 싶은 순간, 지금 느끼는 감정…' },
  voice: { label: '음성 기록', placeholder: '음성에 대한 짧은 메모 (선택)' },
  photo: { label: '사진', placeholder: '사진에 대한 짧은 메모 (선택)' },
  event: { label: '사건', placeholder: '어떤 일이 있었나요?' },
  idea: { label: '아이디어', placeholder: '떠오른 아이디어를 적어두세요' },
  thought: { label: '자유로운 생각', placeholder: '머릿속에 떠오르는 것을 그대로' },
  sleep: { label: '수면', placeholder: '잠에 대해 남기고 싶은 말 (선택) · 예: 중간에 깼다' },
};

/** + 버튼에서 고를 수 있는 추가 기록 종류 (순서대로 표시) */
export const EXTRA_TYPES: RecordType[] = ['text', 'voice', 'photo', 'event', 'idea', 'thought', 'sleep'];

export const REMINDER_MESSAGES = [
  '지금의 나를 잠깐 살펴볼까요?',
  '오늘 기억하고 싶은 순간이 있나요?',
  '기록은 선택이에요. 지금은 쉬어도 괜찮아요.',
  '지금 몸과 마음은 어떤가요?',
];

export const RECALL_QUESTIONS: { emoji: string; text: string; type: RecordType }[] = [
  { emoji: '😊', text: '오늘 기분 좋았던 순간이 있었나요?', type: 'event' },
  { emoji: '☁️', text: '조금 힘들었던 순간은 언제였나요?', type: 'event' },
  { emoji: '🌿', text: '오늘 기억하고 싶은 경험이 있나요?', type: 'event' },
  { emoji: '💡', text: '갑자기 떠오른 아이디어가 있었나요?', type: 'idea' },
];
