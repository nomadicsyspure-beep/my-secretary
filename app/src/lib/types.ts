// LIFE OS 데이터 구조
// 원본 기록(LifeRecord)과 분석 결과(Analysis)는 절대 하나로 합치지 않는다.
// 분석이 틀려도 원본 기록은 그대로 남아야 하기 때문.

export type MoodKey = 'good' | 'okay' | 'tired' | 'stressed' | 'sad' | 'anxious' | 'lethargic' | 'calm';

/** 1(가장 낮음) ~ 5(가장 높음) */
export type Level = 1 | 2 | 3 | 4 | 5;

export type ScaleKey = 'energy' | 'focus' | 'stress';

/**
 * checkin: 원터치 상태 기록 (기분·에너지·집중·부담감 중 하나 이상)
 * 나머지: + 버튼으로 남기는 추가 기록
 */
export type RecordType = 'checkin' | 'text' | 'voice' | 'photo' | 'event' | 'idea' | 'thought';

/** 기록이 어디서 들어왔는지. 나중에 위젯·워치·자동 수집이 생겨도 구조를 바꾸지 않게 미리 둔다 */
export type RecordSource = 'app' | 'recall' | 'reminder' | 'import' | 'legacy' | 'widget' | 'watch';

export interface LifeRecord {
  id: string;
  user_id: string;
  record_type: RecordType;
  content: string | null;
  mood: MoodKey | null;
  energy: Level | null;
  focus: Level | null;
  stress: Level | null;
  /** 일·장소·상황 같은 자유 태그 (예: 산책, 회사) */
  tags: string[];
  /** 그 일이 실제로 있었던 시각 */
  occurred_at: string;
  /** 실제로 앱에 입력한 시각. occurred_at 과 다르면 "회상해서 남긴 기록" */
  created_at: string;
  updated_at: string;
  source: RecordSource;
  /** 로컬: 'idb:<id>' / 나중에 Supabase Storage 의 URL */
  attachment_url: string | null;
  attachment_mime: string | null;
  /** 음성 기록을 글로 바꾼 결과 (향후 자동 변환용) */
  transcript: string | null;
  /** 이 기록을 남기게 한 질문 (기억 복원 질문 등) */
  prompt: string | null;
}

export interface Analysis {
  id: string;
  user_id: string;
  analysis_type: string;
  analysis_content: string;
  /** 이 분석의 근거가 된 원본 기록들 */
  evidence_record_ids: string[];
  confidence: number | null;
  created_at: string;
  analysis_version: string;
}

export interface Attachment {
  id: string;
  blob: Blob;
  mime: string;
  size: number;
  created_at: string;
}
