// 아주 작은 주소(#) 기반 화면 전환. 뒤로 가기 버튼이 자연스럽게 동작한다.
// 예: #/memory?date=2026-11-07

import { useEffect, useState } from 'react';

export type Tab = 'record' | 'memory' | 'insight' | 'me';
const TABS: Tab[] = ['record', 'memory', 'insight', 'me'];

export interface Route {
  tab: Tab;
  params: URLSearchParams;
}

function parse(): Route {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  return {
    tab: (TABS as string[]).includes(path) ? (path as Tab) : 'record',
    params: new URLSearchParams(query),
  };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(tab: Tab, params?: Record<string, string>) {
  const query = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : '';
  window.location.hash = `#/${tab}${query}`;
}
