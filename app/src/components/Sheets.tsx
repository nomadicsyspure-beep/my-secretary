// + 버튼으로 여는 "기록 추가" 시트, 기록을 눌렀을 때 여는 "기록 보기·수정" 시트

import { useEffect, useState } from 'react';
import { EXTRA_TYPES, RECORD_TYPES } from '../lib/constants';
import type { LifeRecord, RecordSource, RecordType } from '../lib/types';
import { RecordForm } from './RecordForm';
import { TYPE_ICONS } from './RecordCard';
import { Sheet } from './ui';

export interface AddRequest {
  type?: RecordType;
  prompt?: string;
  source?: RecordSource;
}

export function AddSheet({ request, onClose }: { request: AddRequest | null; onClose: () => void }) {
  const [type, setType] = useState<RecordType | null>(null);
  useEffect(() => {
    setType(request?.type ?? null);
  }, [request]);

  return (
    <Sheet open={!!request} onClose={onClose} title={type ? RECORD_TYPES[type].label : '기록 추가'}>
      {type ? (
        <RecordForm key={type} type={type} prompt={request?.prompt} source={request?.source} onDone={onClose} />
      ) : (
        <>
          <p className="-mt-2 mb-4 text-sm text-muted">필요할 때만 남겨요. 아무것도 쓰지 않아도 괜찮아요.</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {EXTRA_TYPES.map((t) => {
              const Icon = TYPE_ICONS[t];
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-bg px-3 py-5 transition active:scale-95"
                >
                  <Icon size={26} className="text-primary" strokeWidth={1.8} />
                  <span className="text-[14px] font-semibold">{RECORD_TYPES[t].label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}

export function RecordSheet({ record, onClose }: { record: LifeRecord | null; onClose: () => void }) {
  return (
    <Sheet open={!!record} onClose={onClose} title={record ? RECORD_TYPES[record.record_type].label : ''}>
      {record && <RecordForm key={record.id} type={record.record_type} initial={record} prompt={record.prompt} onDone={onClose} />}
    </Sheet>
  );
}
