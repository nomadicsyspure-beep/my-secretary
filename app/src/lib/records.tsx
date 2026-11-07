// 기록 상태 관리
// 앱이 열릴 때 모든 기록을 한 번 불러와 메모리에 두고, 바뀔 때마다 저장소에도 저장한다.
// (개인 기록 규모에서는 이 방식이 가장 단순하고 빠르다)

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LOCAL_USER } from './constants';
import { repository, uid } from './repository';
import type { LifeRecord, RecordType } from './types';

export type RecordInput = Partial<Omit<LifeRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
  record_type: RecordType;
};

export function makeRecord(input: RecordInput, now = new Date()): LifeRecord {
  const iso = now.toISOString();
  return {
    id: uid(),
    user_id: LOCAL_USER,
    content: null,
    mood: null,
    energy: null,
    focus: null,
    stress: null,
    tags: [],
    occurred_at: iso,
    started_at: null,
    source: 'app',
    attachment_url: null,
    attachment_mime: null,
    transcript: null,
    prompt: null,
    ...input,
    created_at: iso,
    updated_at: iso,
  };
}

/** 최근에 일어난 일이 먼저 오도록 정렬 */
export const sortRecords = (list: LifeRecord[]) =>
  [...list].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.created_at.localeCompare(a.created_at));

interface RecordsContextValue {
  records: LifeRecord[];
  loading: boolean;
  error: string | null;
  addRecord(input: RecordInput, attachment?: Blob): Promise<LifeRecord>;
  /** attachment 를 주면 기존 첨부파일을 새것으로 바꾼다 */
  updateRecord(id: string, patch: Partial<LifeRecord>, attachment?: Blob): Promise<void>;
  removeRecord(id: string): Promise<void>;
  reload(): Promise<void>;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<LifeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const reload = useCallback(async () => {
    try {
      setRecords(sortRecords(await repository.listRecords()));
      setError(null);
    } catch (e) {
      console.error(e);
      setError('기록 저장소를 열 수 없어요. 비공개(시크릿) 모드이거나 브라우저 저장 공간이 막혀 있을 수 있어요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addRecord = useCallback(async (input: RecordInput, attachment?: Blob) => {
    const record = makeRecord(input);
    if (attachment) {
      record.attachment_url = await repository.saveAttachment(attachment);
      record.attachment_mime = attachment.type || null;
    }
    await repository.saveRecord(record);
    setRecords((prev) => sortRecords([record, ...prev]));
    return record;
  }, []);

  const updateRecord = useCallback(async (id: string, patch: Partial<LifeRecord>, attachment?: Blob) => {
    const current = recordsRef.current.find((r) => r.id === id);
    if (!current) throw new Error('record not found');
    const next: LifeRecord = { ...current, ...patch, id, updated_at: new Date().toISOString() };
    if (attachment) {
      next.attachment_url = await repository.saveAttachment(attachment);
      next.attachment_mime = attachment.type || null;
    }
    await repository.saveRecord(next);
    // 새 첨부파일이 저장된 뒤에만 예전 것을 지운다
    if (attachment && current.attachment_url) await repository.deleteAttachment(current.attachment_url);
    setRecords((prev) => sortRecords(prev.map((r) => (r.id === id ? next : r))));
  }, []);

  const removeRecord = useCallback(async (id: string) => {
    await repository.deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo(
    () => ({ records, loading, error, addRecord, updateRecord, removeRecord, reload }),
    [records, loading, error, addRecord, updateRecord, removeRecord, reload],
  );
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used inside RecordsProvider');
  return ctx;
}
