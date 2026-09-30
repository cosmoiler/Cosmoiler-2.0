/*
 * keepAwake.js — экран телефона не гаснет, пока открыт интерфейс.
 *
 * Зачем. На мотоцикле телефон с «Телеметрией» стоит на руле: без касаний экран
 * гаснет через время, заданное в телефоне.
 *
 * Как.
 *   * Штатный способ — Screen Wake Lock API (navigator.wakeLock) — есть только на
 *     защищённых страницах (HTTPS, localhost). Интерфейс открывается по HTTP с
 *     адреса смазчика, поэтому navigator.wakeLock там нет. Если он всё же есть
 *     (например, интерфейс открыт по HTTPS), берётся он.
 *   * Иначе — приём NoSleep.js: по кругу играет ролик-пустышка
 *     (./noSleepMedia.js), не вставленный в страницу. Пока видео играет, браузер
 *     не даёт экрану погаснуть.
 *   * Видео со звуковой дорожкой браузер запускает только в ответ на действие
 *     пользователя, поэтому запуск — на первое касание страницы. Когда страница
 *     скрыта (свёрнут браузер, погас экран), браузер ставит видео на паузу и
 *     отпускает wake lock: следующее касание или возврат на страницу запускают
 *     снова. Переключателя нет — решение пользователя 30.09.2026.
 *
 * Пакет nosleep.js не подключаем: в нём для iOS < 10 страница перезагружается
 * каждые 15 с, а от пакета нужны только ролики. Подробно — firmware
 * docs/web-frontend.md §12.
 */

import log from './debug.js';
import { media } from './noSleepMedia.js';

let video = null;    // ролик-пустышка (создаётся при первом запуске)
let wakeLock = null; // WakeLockSentinel штатного способа
let pending = false; // запрос уже отправлен, ответа ещё нет

function createVideo() {
  const v = document.createElement('video');
  v.setAttribute('title', 'keep-awake');
  v.setAttribute('playsinline', '');
  for (const [type, src] of [['webm', media.webm], ['mp4', media.mp4]]) {
    const source = document.createElement('source');
    source.src = src;
    source.type = `video/${type}`;
    v.appendChild(source);
  }
  // Как в NoSleep.js: webm (≤ 1 с) зацикливается, mp4 перематывается в начало,
  // не доходя до конца.
  v.addEventListener('loadedmetadata', () => {
    if (v.duration <= 1) {
      v.setAttribute('loop', '');
    } else {
      v.addEventListener('timeupdate', () => {
        if (v.currentTime > 0.5) v.currentTime = Math.random();
      });
    }
  });
  return v;
}

/** Не дать экрану погаснуть, если это ещё не сделано. */
function engage() {
  if (pending || document.visibilityState !== 'visible') return;

  if ('wakeLock' in navigator) {
    if (wakeLock && !wakeLock.released) return;
    pending = true;
    navigator.wakeLock.request('screen')
      .then((lock) => { wakeLock = lock; log('keepAwake: wake lock'); })
      .catch((err) => log('keepAwake: wake lock не получен: %s', err.message))
      .finally(() => { pending = false; });
    return;
  }

  if (!video) video = createVideo();
  if (!video.paused) return;
  pending = true;
  video.play()
    .then(() => log('keepAwake: видео'))
    // Без действия пользователя браузер откажет — запустится по следующему касанию.
    .catch((err) => log('keepAwake: видео не запущено: %s', err.message))
    .finally(() => { pending = false; });
}

/**
 * Включить удержание экрана. Вызывать один раз, после f7ready.
 */
export function initKeepAwake() {
  // События, которые браузер считает действием пользователя (разрешают звук).
  for (const type of ['touchend', 'pointerup', 'click', 'keydown']) {
    document.addEventListener(type, engage, { capture: true, passive: true });
  }
  // Вернулись на страницу: wake lock и так уже отпущен, видео на паузе.
  document.addEventListener('visibilitychange', engage);
  engage();
  log('keepAwake: init');
}
