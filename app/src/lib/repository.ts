// 저장소
// 화면 코드는 이 RecordRepository 인터페이스만 사용한다.
// 지금은 기기 안(IndexedDB)에 저장하고, 나중에 Supabase 로 옮길 때는
// 같은 인터페이스를 가진 supabaseRepository 를 만들어 갈아 끼우면 된다.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Analysis, Attachment, LifeRecord } from './types';

export interface RecordRepository {
  listRecords(): Promise<LifeRecord[]>;
  /** 새 기록이면 추가, 같은 id가 있으면 덮어쓴다 */
  saveRecord(record: LifeRecord): Promise<void>;
  saveRecords(records: LifeRecord[]): Promise<void>;
  /** 기록과 그 첨부파일을 함께 지운다 */
  deleteRecord(id: string): Promise<void>;
  saveAttachment(blob: Blob, id?: string): Promise<string>;
  getAttachment(url: string): Promise<Blob | null>;
  deleteAttachment(url: string): Promise<void>;
  listAnalyses(): Promise<Analysis[]>;
  saveAnalysis(analysis: Analysis): Promise<void>;
  deleteAnalysis(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

interface LifeOSDB extends DBSchema {
  records: { key: string; value: LifeRecord; indexes: { by_occurred: string } };
  attachments: { key: string; value: Attachment };
  analyses: { key: string; value: Analysis };
}

let dbPromise: Promise<IDBPDatabase<LifeOSDB>> | null = null;
function db() {
  dbPromise ??= openDB<LifeOSDB>('life-os', 1, {
    upgrade(d) {
      const records = d.createObjectStore('records', { keyPath: 'id' });
      records.createIndex('by_occurred', 'occurred_at');
      d.createObjectStore('attachments', { keyPath: 'id' });
      d.createObjectStore('analyses', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const LOCAL_PREFIX = 'idb:';
const attachmentId = (url: string) => (url.startsWith(LOCAL_PREFIX) ? url.slice(LOCAL_PREFIX.length) : null);

export const localRepository: RecordRepository = {
  async listRecords() {
    return (await db()).getAll('records');
  },
  async saveRecord(record) {
    await (await db()).put('records', record);
  },
  async saveRecords(records) {
    const tx = (await db()).transaction('records', 'readwrite');
    await Promise.all([...records.map((r) => tx.store.put(r)), tx.done]);
  },
  async deleteRecord(id) {
    const d = await db();
    const record = await d.get('records', id);
    if (record?.attachment_url) await localRepository.deleteAttachment(record.attachment_url);
    await d.delete('records', id);
  },
  async saveAttachment(blob, id = uid()) {
    await (await db()).put('attachments', {
      id,
      blob,
      mime: blob.type,
      size: blob.size,
      created_at: new Date().toISOString(),
    });
    return LOCAL_PREFIX + id;
  },
  async getAttachment(url) {
    const id = attachmentId(url);
    if (!id) return null;
    return (await (await db()).get('attachments', id))?.blob ?? null;
  },
  async deleteAttachment(url) {
    const id = attachmentId(url);
    if (id) await (await db()).delete('attachments', id);
  },
  async listAnalyses() {
    return (await db()).getAll('analyses');
  },
  async saveAnalysis(analysis) {
    await (await db()).put('analyses', analysis);
  },
  async deleteAnalysis(id) {
    await (await db()).delete('analyses', id);
  },
  async clearAll() {
    const d = await db();
    await Promise.all([d.clear('records'), d.clear('attachments'), d.clear('analyses')]);
  },
};

export const repository: RecordRepository = localRepository;
