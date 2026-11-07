// 기억 환기 알림
//
// 지금(웹앱)은 앱이 열려 있거나 막 백그라운드로 간 동안에만 알림을 띄울 수 있다.
// 앱이 완전히 닫혀 있어도 오게 하려면 안드로이드 앱으로 감싸거나 푸시 서버가 필요하다.
// 그때는 이 파일의 notify / scheduleReminders 만 바꾸면 된다.
//
// 원칙: 같은 시각에는 한 번만. 최근에 기록했으면 보내지 않는다. 무시했다고 다시 보내지 않는다.

import { useEffect, useRef, useState } from 'react';
import { REMINDER_MESSAGES } from './constants';
import { todayAt } from './dates';
import type { Settings } from './settings';

const QUIET_AFTER_RECORD = 45 * 60 * 1000;

export const notificationsSupported = () => 'Notification' in window && 'serviceWorker' in navigator;

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function notify(body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const options: NotificationOptions = {
    body,
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    tag: 'lifeos-reminder', // 같은 태그라서 알림이 쌓이지 않고 바뀐다
    data: { url: './#/record' },
  };
  if (reg) await reg.showNotification('LIFE OS', options);
  else new Notification('LIFE OS', options);
  return true;
}

/** 오늘 남은 알림 시각들 */
export function upcoming(settings: Settings, now = new Date()) {
  const list: { at: Date; message: string }[] = [];
  if (!settings.reminders.enabled) return list;
  settings.reminders.times.forEach((t, i) => {
    list.push({ at: todayAt(t, now), message: REMINDER_MESSAGES[i % REMINDER_MESSAGES.length] });
  });
  if (settings.recall.enabled) list.push({ at: todayAt(settings.recall.time, now), message: '오늘 기억하고 싶은 순간이 있나요?' });
  return list.filter((x) => x.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function useReminders(settings: Settings, lastRecordedAt: number) {
  const last = useRef(lastRecordedAt);
  last.current = lastRecordedAt;
  // 자정이 지나면 다음 날 알림을 다시 예약하기 위한 값
  const [day, setDay] = useState(() => new Date().toDateString());

  useEffect(() => {
    const midnight = new Date();
    midnight.setHours(24, 0, 5, 0);
    const t = window.setTimeout(() => setDay(new Date().toDateString()), midnight.getTime() - Date.now());
    return () => window.clearTimeout(t);
  }, [day]);

  useEffect(() => {
    const timers = upcoming(settings).map(({ at, message }) =>
      window.setTimeout(() => {
        if (Date.now() - last.current < QUIET_AFTER_RECORD) return;
        notify(message);
      }, at.getTime() - Date.now()),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [settings.reminders, settings.recall, day]); // eslint-disable-line react-hooks/exhaustive-deps
}
