import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Nav } from './components/Nav';
import { AddSheet, RecordSheet, type AddRequest } from './components/Sheets';
import { Sprout } from './components/ui';
import { RecordsProvider, useRecords } from './lib/records';
import { useReminders } from './lib/reminders';
import { useRoute } from './lib/router';
import { SettingsProvider, useApplyTheme, useSettings } from './lib/settings';
import { ToastProvider } from './lib/toast';
import type { LifeRecord } from './lib/types';
import { MeScreen } from './screens/MeScreen';
import { MemoryScreen } from './screens/MemoryScreen';
import { RecordScreen } from './screens/RecordScreen';

// 그래프 라이브러리가 커서 인사이트 화면은 열 때 불러온다
const InsightScreen = lazy(() => import('./screens/InsightScreen').then((m) => ({ default: m.InsightScreen })));

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <RecordsProvider>
          <Shell />
        </RecordsProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}

function Shell() {
  const route = useRoute();
  const { settings } = useSettings();
  const { records, loading, error } = useRecords();
  const [addRequest, setAddRequest] = useState<AddRequest | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // 수정 화면은 항상 최신 기록을 보여주도록 id 로 찾는다
  const opened = records.find((r) => r.id === openId) ?? null;
  const onOpen = (r: LifeRecord) => setOpenId(r.id);

  useApplyTheme(settings.theme);
  const lastCreated = useMemo(() => records.reduce((max, r) => Math.max(max, Date.parse(r.created_at)), 0), [records]);
  useReminders(settings, lastCreated);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.tab]);

  // 홈 화면 바로가기(#/record?add=1)로 들어오면 기록 추가 창을 연다
  useEffect(() => {
    if (route.tab === 'record' && route.params.get('add')) {
      setAddRequest({});
      history.replaceState(null, '', '#/record');
    }
  }, [route]);

  // 브라우저가 저장 공간이 부족할 때 기록을 지우지 않도록 요청한다
  useEffect(() => {
    if (records.length) navigator.storage?.persist?.().catch(() => {});
  }, [records.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const spinner = (
    <div className="grid min-h-[60dvh] place-items-center text-primary">
      <Sprout size={40} className="animate-pulse" />
    </div>
  );

  let screen;
  if (loading) {
    screen = spinner;
  } else if (error) {
    screen = (
      <div className="card mt-10 p-6 text-center">
        <p className="font-semibold">기록을 불러오지 못했어요</p>
        <p className="mt-2 text-[14px] text-muted">{error}</p>
        <button className="btn-primary mt-4" onClick={() => location.reload()}>
          다시 시도
        </button>
      </div>
    );
  } else if (route.tab === 'memory') {
    screen = <MemoryScreen key={route.params.get('date') ?? 'all'} date={route.params.get('date')} onOpen={onOpen} />;
  } else if (route.tab === 'insight') {
    screen = (
      <Suspense fallback={spinner}>
        <InsightScreen onOpen={onOpen} />
      </Suspense>
    );
  } else if (route.tab === 'me') {
    screen = <MeScreen section={route.params.get('section')} />;
  } else {
    screen = <RecordScreen onAdd={setAddRequest} onOpen={onOpen} />;
  }

  return (
    <div className="min-h-dvh md:pl-24">
      <main className="mx-auto max-w-5xl px-4 pb-[calc(110px+env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))] md:px-8 md:pb-12 md:pt-6">
        {screen}
      </main>
      <Nav current={route.tab} />
      <AddSheet request={addRequest} onClose={() => setAddRequest(null)} />
      <RecordSheet record={opened} onClose={() => setOpenId(null)} />
    </div>
  );
}
