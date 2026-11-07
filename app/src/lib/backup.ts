// 데이터 내보내기·가져오기. 모든 기록은 사용자의 것이다.

import { dateKey } from './dates';
import { blobToDataURL, dataURLToBlob, downloadFile } from './media';
import { repository } from './repository';
import type { Settings } from './settings';
import type { Analysis, LifeRecord } from './types';

interface BackupFile {
  app: 'life-os';
  version: 1;
  exported_at: string;
  records: LifeRecord[];
  analyses: Analysis[];
  attachments: { url: string; mime: string; data: string }[];
  settings?: Settings;
}

export async function exportJSON(records: LifeRecord[], settings: Settings) {
  const attachments: BackupFile['attachments'] = [];
  for (const r of records) {
    if (!r.attachment_url) continue;
    const blob = await repository.getAttachment(r.attachment_url);
    if (blob) attachments.push({ url: r.attachment_url, mime: blob.type, data: await blobToDataURL(blob) });
  }
  const file: BackupFile = {
    app: 'life-os',
    version: 1,
    exported_at: new Date().toISOString(),
    records,
    analyses: await repository.listAnalyses(),
    attachments,
    settings,
  };
  downloadFile(new Blob([JSON.stringify(file)], { type: 'application/json' }), `life-os-backup-${dateKey(new Date())}.json`);
}

const CSV_FIELDS: (keyof LifeRecord)[] = [
  'occurred_at', 'created_at', 'record_type', 'mood', 'energy', 'focus', 'stress', 'tags', 'content', 'source', 'id',
];

export function exportCSV(records: LifeRecord[]) {
  const cell = (v: unknown) => {
    const s = Array.isArray(v) ? v.join(' ') : v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [CSV_FIELDS.join(','), ...records.map((r) => CSV_FIELDS.map((f) => cell(r[f])).join(','))];
  // 엑셀에서 한글이 깨지지 않도록 BOM 을 붙인다
  downloadFile(new Blob(['﻿' + rows.join('\n')], { type: 'text/csv' }), `life-os-records-${dateKey(new Date())}.csv`);
}

/**
 * 백업 파일을 지금 기록과 합친다. 같은 기록이 양쪽에 있으면 더 최근에 수정된 쪽을 남긴다.
 * 반환값: 새로 추가되거나 갱신된 기록 수
 */
export async function importJSON(file: File, current: LifeRecord[]): Promise<{ changed: number; settings?: Settings }> {
  const data = JSON.parse(await file.text()) as BackupFile;
  if (data.app !== 'life-os' || !Array.isArray(data.records)) throw new Error('LIFE OS 백업 파일이 아니에요');

  const byId = new Map(current.map((r) => [r.id, r]));
  const incoming = data.records.filter((r) => {
    const mine = byId.get(r.id);
    return !mine || mine.updated_at < r.updated_at;
  });

  const needed = new Set(incoming.map((r) => r.attachment_url).filter(Boolean));
  for (const a of data.attachments ?? []) {
    if (!needed.has(a.url) || !a.url.startsWith('idb:')) continue;
    await repository.saveAttachment(await dataURLToBlob(a.data), a.url.slice(4));
  }
  await repository.saveRecords(incoming);
  for (const a of data.analyses ?? []) await repository.saveAnalysis(a);
  return { changed: incoming.length, settings: data.settings };
}
