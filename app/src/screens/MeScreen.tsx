// 나: 개인 설정과 데이터 관리

import { Download, FileSpreadsheet, History, Plus, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Segmented, Sprout, Toggle } from '../components/ui';
import { exportCSV, exportJSON, importJSON } from '../lib/backup';
import { APP_VERSION, RECORD_SCALES, scaleOf } from '../lib/constants';
import { convertLegacy, hasLegacyData } from '../lib/legacy';
import { formatBytes } from '../lib/media';
import { useRecords } from '../lib/records';
import { notificationsSupported, notify, requestNotificationPermission } from '../lib/reminders';
import { repository } from '../lib/repository';
import { useSettings, type ThemeSetting } from '../lib/settings';
import { useToast } from '../lib/toast';

function Card({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-4 p-5">
      <h2 className="mb-3 font-display text-[16px] font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[14px] font-semibold">{title}</p>
        {desc && <p className="text-[13px] text-muted">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function MeScreen({ section }: { section: string | null }) {
  const { records, reload } = useRecords();
  const { settings, update, replace } = useSettings();
  const toast = useToast();
  const importInput = useRef<HTMLInputElement>(null);
  const [permission, setPermission] = useState(() => (notificationsSupported() ? Notification.permission : 'unsupported'));
  const [storage, setStorage] = useState<{ usage: number; persisted: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }, [section]);

  useEffect(() => {
    (async () => {
      if (!navigator.storage?.estimate) return;
      const { usage = 0 } = await navigator.storage.estimate();
      setStorage({ usage, persisted: (await navigator.storage.persisted?.()) ?? false });
    })();
  }, [records.length]);

  async function toggleReminders(on: boolean) {
    if (!on) return update({ reminders: { ...settings.reminders, enabled: false } });
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      update({ reminders: { ...settings.reminders, enabled: true } });
      toast({ title: '알림을 켰어요' });
    } else if (result === 'unsupported') {
      toast({ title: '이 브라우저는 알림을 지원하지 않아요', tone: 'info' });
    } else {
      toast({ title: '알림 권한이 꺼져 있어요', detail: '브라우저 설정에서 허용해 주세요', tone: 'info' });
    }
  }

  const setTimes = (times: string[]) => update({ reminders: { ...settings.reminders, times: [...times].sort() } });

  async function onImport(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { changed, settings: saved } = await importJSON(file, records);
      if (saved && confirm('백업에 들어 있는 설정(이름, 알림 등)도 불러올까요?')) replace(saved);
      await reload();
      toast({ title: '백업을 불러왔어요', detail: `${changed}개 기록` });
    } catch (e) {
      toast({ title: '불러오지 못했어요', detail: e instanceof Error ? e.message : '파일을 확인해 주세요', tone: 'info' });
    } finally {
      setBusy(false);
    }
  }

  async function importLegacy() {
    const existing = new Set(records.map((r) => r.id));
    const list = convertLegacy().filter((r) => !existing.has(r.id));
    await repository.saveRecords(list);
    await reload();
    update({ legacyImported: true });
    toast({ title: '이전 기록을 옮겼어요', detail: `${list.length}개` });
  }

  async function deleteAll() {
    const answer = prompt('모든 기록과 사진·음성이 지워지고 되돌릴 수 없어요.\n정말 지우려면 "삭제"라고 입력해 주세요.');
    if (answer?.trim() !== '삭제') return;
    await repository.clearAll();
    await reload();
    toast({ title: '모든 기록을 지웠어요', tone: 'info' });
  }

  return (
    <div className="space-y-3">
      <header className="pb-1">
        <h1 className="font-display text-[22px] font-bold">나</h1>
        <p className="text-[13px] text-muted">LIFE OS를 나에게 맞게</p>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <div className="space-y-3">
          <Card title="프로필">
            <div>
              <label className="label" htmlFor="name">
                불리고 싶은 이름 (선택)
              </label>
              <input id="name" className="field" value={settings.name} maxLength={20} onChange={(e) => update({ name: e.target.value })} placeholder="예: 민지" />
            </div>
          </Card>

          <Card id="reminders" title="기억 환기 알림">
            <Row title="기록 알림" desc="정한 시각에 한 번씩, 부담 없이">
              <Toggle checked={settings.reminders.enabled} onChange={toggleReminders} label="기록 알림" />
            </Row>
            {settings.reminders.enabled && (
              <>
                <div className="flex flex-wrap gap-2">
                  {settings.reminders.times.map((t, i) => (
                    <div key={i} className="flex items-center gap-1 rounded-full border border-line bg-bg py-1 pl-3 pr-1">
                      <input
                        type="time"
                        value={t}
                        aria-label={`알림 시각 ${i + 1}`}
                        className="bg-transparent text-[15px] outline-none"
                        onChange={(e) => e.target.value && setTimes(settings.reminders.times.map((x, j) => (j === i ? e.target.value : x)))}
                      />
                      <button
                        className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-card"
                        aria-label="이 알림 지우기"
                        onClick={() => setTimes(settings.reminders.times.filter((_, j) => j !== i))}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  {settings.reminders.times.length < 6 && (
                    <button className="chip py-2" onClick={() => setTimes([...settings.reminders.times, '12:00'])}>
                      <Plus size={14} /> 시각 추가
                    </button>
                  )}
                </div>
                <button
                  className="text-[13px] text-muted underline"
                  onClick={async () => !(await notify('지금의 나를 잠깐 살펴볼까요?')) && toast({ title: '알림 권한이 없어요', tone: 'info' })}
                >
                  알림 미리 받아보기
                </button>
              </>
            )}
            <p className="rounded-2xl bg-bg px-4 py-3 text-[13px] text-muted">
              지금은 웹앱이라 <b>앱이 열려 있거나 최근에 열었을 때만</b> 알림이 와요. 앱이 닫혀 있어도 오게 하는 건 안드로이드 앱으로 옮길 때 추가돼요.
              최근 45분 안에 기록했다면 알림을 건너뛰고, 무시해도 다시 보내지 않아요.
              {permission === 'denied' && ' (지금 브라우저에서 알림 권한이 꺼져 있어요)'}
            </p>
          </Card>

          <Card title="아침 수면 기록">
            <Row title="어젯밤 수면 묻기" desc="아침(4–15시)에 처음 열 때 한 번, 잠든·일어난 시각을 물어요">
              <Toggle checked={settings.sleepPrompt} onChange={(v) => update({ sleepPrompt: v })} label="어젯밤 수면 묻기" />
            </Row>
          </Card>

          <Card title="기억 복원">
            <Row title="하루 돌아보기 카드" desc="정한 시각 이후 홈에 질문이 나타나요">
              <Toggle checked={settings.recall.enabled} onChange={(v) => update({ recall: { ...settings.recall, enabled: v } })} label="기억 복원" />
            </Row>
            {settings.recall.enabled && (
              <input
                type="time"
                className="field w-40"
                value={settings.recall.time}
                aria-label="기억 복원 시각"
                onChange={(e) => e.target.value && update({ recall: { ...settings.recall, time: e.target.value }, recallDismissedOn: null })}
              />
            )}
          </Card>

          <Card title="기록 설정">
            <p className="-mt-2 text-[13px] text-muted">홈 화면에서 감정과 함께 원터치로 기록할 항목</p>
            {RECORD_SCALES.map((k) => (
              <Row key={k} title={scaleOf(k).label}>
                <Toggle checked={settings.scales[k]} onChange={(v) => update({ scales: { ...settings.scales, [k]: v } })} label={scaleOf(k).label} />
              </Row>
            ))}
          </Card>

          <Card title="테마">
            <Segmented<ThemeSetting>
              value={settings.theme}
              onChange={(theme) => update({ theme })}
              options={[
                { value: 'system', label: '기기 설정' },
                { value: 'light', label: '밝게' },
                { value: 'dark', label: '어둡게' },
              ]}
            />
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="데이터 관리">
            <p className="-mt-2 text-[14px]">모든 기록은 나의 것이에요. 언제든 내보내고 지울 수 있어요.</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" disabled={!records.length || busy} onClick={() => exportJSON(records, settings)}>
                <Download size={17} /> 백업 (JSON)
              </button>
              <button className="btn-ghost" disabled={!records.length} onClick={() => exportCSV(records)}>
                <FileSpreadsheet size={17} /> 표 (CSV)
              </button>
              <button className="btn-ghost col-span-2" disabled={busy} onClick={() => importInput.current?.click()}>
                <Upload size={17} /> 백업 불러오기
              </button>
            </div>
            <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={(e) => (onImport(e.target.files?.[0]), (e.target.value = ''))} />
            <p className="text-[13px] text-muted">
              백업(JSON)에는 사진·음성까지 들어 있어요. 불러오면 지금 기록과 합쳐지고, 같은 기록은 더 최근에 수정된 쪽이 남아요.
            </p>
            {storage && (
              <p className="flex items-center gap-1.5 text-[13px] text-muted">
                <ShieldCheck size={14} /> 기록 {records.length}개 · 사용 중 {formatBytes(storage.usage)}
                {storage.persisted ? ' · 저장 공간 보호됨' : ''}
              </p>
            )}
            {hasLegacyData() && !settings.legacyImported && (
              <button className="btn-ghost w-full" onClick={importLegacy}>
                <History size={17} /> 이전 버전(나의 비서실) 기록 가져오기
              </button>
            )}
            <button className="btn w-full border border-line text-brown" disabled={!records.length} onClick={deleteAll}>
              <Trash2 size={17} /> 모든 기록 삭제
            </button>
          </Card>

          <Card title="개인정보">
            <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-muted">
              <li>기록은 지금 이 기기의 브라우저 안에만 저장돼요. 어떤 서버로도 보내지 않아요.</li>
              <li>위치, 걸음 수, 수면 같은 정보는 수집하지 않아요. 나중에 연결하더라도 직접 동의한 것만 가져와요.</li>
              <li>브라우저 데이터를 지우면 기록도 지워져요. 가끔 백업해 두세요.</li>
              <li>로그인과 기기 간 동기화가 생기면 내 기록은 나만 볼 수 있게 분리해서 저장해요.</li>
            </ul>
          </Card>

          <section className="card p-6 text-center">
            <Sprout size={32} className="mx-auto text-primary" />
            <p className="mt-2 font-display text-[20px] font-bold">LIFE OS</p>
            <p className="text-[13px] text-muted">Personal Life Operating System · v{APP_VERSION}</p>
            <p className="mt-4 font-display text-[16px]">기록은 가볍게. 분석은 깊게. 삶은 온전히.</p>
            <ul className="mt-4 space-y-1 text-[13px] text-muted">
              <li>관찰하되 판단하지 않는다</li>
              <li>계획하되 집착하지 않는다</li>
              <li>성장하되 현재를 희생하지 않는다</li>
              <li>기록하지 않는 날도 괜찮다</li>
              <li>휴식도 삶의 중요한 일부다</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
