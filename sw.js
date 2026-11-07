// LIFE OS 서비스 워커: 오프라인에서도 열리게 하고, 알림을 띄운다.
//
// 데이터 절약:
// - 이름에 해시가 붙은 코드(assets/), 풍경 그림(scenes/), 아이콘은 내용이 바뀌지 않으므로
//   한 번 받으면 저장해 둔 것을 그대로 쓴다 (다시 묻지도 않음).
// - 첫 화면(index.html)·manifest 만 열 때마다 "바뀐 게 있나" 확인한다.
//   바뀐 게 없으면 서버는 내용 없이 짧은 답(304)만 보낸다.
//   새 버전을 올리면 여기서 새 파일 이름을 알게 되어, 바뀐 파일만 한 번 받는다.
const CACHE = 'life-os-v2';
const SHELL = ['./', 'manifest.json', 'icons/icon-192.png', 'icons/badge-96.png'];
const IMMUTABLE = /\/(assets|scenes|icons)\//;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const save = (req, res) => {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (IMMUTABLE.test(url.pathname)) {
    // 저장된 것이 있으면 네트워크를 쓰지 않는다
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))));
    return;
  }

  // 첫 화면 등: 네트워크로 확인하되(바뀐 게 없으면 304), 오프라인이면 저장된 것
  e.respondWith(
    fetch(req.url, { cache: 'no-cache' })
      .then((res) => save(req, res))
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./'))),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
