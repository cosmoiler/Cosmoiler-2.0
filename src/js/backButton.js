/*
 * backButton.js — системная кнопка «назад» без адресов страниц в истории браузера.
 *
 * Зачем. Раньше роутер Framework7 работал с browserHistory: true — каждый
 * переход клал в историю новый адрес (…/#!/settings/pump/), и в истории
 * браузера оставался след из адресов страниц интерфейса. Нужно, чтобы
 * интерфейс вёл себя как приложение: адрес не меняется, а штатная кнопка
 * «назад» телефона по-прежнему возвращает на предыдущую страницу.
 *
 * Как. Модель та же, что у browserHistory, — одна запись истории на каждый
 * переход вглубь, — но запись кладётся с ТЕМ ЖЕ адресом (pushState без URL),
 * а в history.state хранится только её номер (глубина). Кнопка «назад»
 * снимает запись (popstate), модуль вызывает router.back().
 *
 *   вкладка «Настройки»:  /settings/  →  /settings/pump/
 *   история браузера:     [адрес, 0]      [адрес, 0] [адрес, 1]
 *   «назад»           →   popstate (глубина 0) → router.back()
 *
 * Записи сверяются с глубиной активной вкладки (длина router.history − 1):
 *   * переход вглубь по нажатию → запись добавляется;
 *   * возврат без кнопки браузера (свайп назад на iOS), переключение на
 *     вкладку меньшей глубины, перезагрузка страницы → лишние записи
 *     снимаются history.go(−n); ответный popstate пропускается (dropping).
 *
 * ⚠️ Записи добавляются ТОЛЬКО сразу после нажатия пользователя (переход,
 * смена вкладки) и никогда — из обработчика popstate. Chrome помечает
 * записи, добавленные без действия пользователя, как «ловушку» и кнопкой
 * «назад» перескакивает через них — интерфейс закрылся бы вместо шага назад.
 *
 * Окна (диалоги) не обрабатываются — как и при browserHistory: «назад» при
 * открытом диалоге возвращает страницу под ним.
 */

import log from './debug.js';

/** Ключ номера записи в history.state. */
const DepthKey = 'cosmoilerDepth';

let app = null;
let dropping = false;               // ждём popstate от собственного history.go()
const lastLength = new WeakMap();   // router → длина его истории при прошлой сверке

/** Номер записи истории, на которой стоит страница (0 — исходная). */
function depthOf(state) {
  return (state && state[DepthKey]) || 0;
}

/** Роутер представления на экране (активная вкладка или единственное представление). */
function activeRouter() {
  const el = document.querySelector('.views.tabs > .view.tab-active');
  const view = (el && el.f7View) || app.views.main;
  return view ? view.router : null;
}

/** Глубина активной вкладки: сколько раз можно вернуться назад внутри неё. */
function wantedDepth() {
  const router = activeRouter();
  return router ? Math.max(router.history.length - 1, 0) : 0;
}

/**
 * Привести записи истории к глубине активной вкладки.
 * @param allowPush — можно добавлять записи (сверка сразу после нажатия).
 */
function sync(allowPush) {
  if (dropping) return; // досверимся после ответного popstate
  const want = wantedDepth();
  const cur = depthOf(history.state);
  if (want > cur && allowPush) {
    for (let d = cur + 1; d <= want; d++)
      history.pushState({ ...(history.state || {}), [DepthKey]: d }, '');
  } else if (want < cur) {
    dropping = true;
    history.go(want - cur);
  }
}

function onRouteChanged(newRoute, previousRoute, router) {
  // Вглубь — если история роутера выросла (переход по нажатию). Возврат назад
  // записей не добавляет: иначе запись появилась бы без действия пользователя
  // (например, после быстрого двойного «назад» во время анимации).
  const len = router && router.history ? router.history.length : 0;
  const grew = len > (lastLength.get(router) || 1);
  if (router) lastLength.set(router, len);
  sync(grew);
}

function onPopState(e) {
  if (dropping) {
    dropping = false;
    sync(false);
    return;
  }
  const depth = depthOf(e.state);
  const want = wantedDepth();
  if (depth > want) {
    // «Вперёд» (кнопка браузера на компьютере): повторить переход нельзя —
    // возвращаем историю к текущей странице.
    dropping = true;
    history.go(want - depth);
    return;
  }
  const router = activeRouter();
  if (router && router.history.length > 1) {
    // Во время анимации перехода роутер сам игнорирует back() — нажатие
    // теряется, как и при штатном browserHistory.
    router.back();
    return;
  }
  // Внутри вкладки возвращаться некуда, а записи остались (рассинхронизация) —
  // уходим со страницы, как ушли бы без них.
  history.go(-(depth + 1));
}

/**
 * Включить обработку кнопки «назад». Вызывать один раз, после f7ready.
 * @param f7 — экземпляр приложения Framework7.
 */
export function initBackButton(f7) {
  app = f7;

  window.addEventListener('popstate', onPopState);
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return; // возврат из bfcache — состояние могло устареть
    dropping = false;
    sync(false);
  });

  app.on('routeChanged', onRouteChanged);
  app.on('tabShow', () => sync(true)); // смена вкладки — по нажатию

  // После перезагрузки страницы (document.location.reload()) она может стоять
  // на записи с номером > 0, а вкладки начинают с корня — лишнее снимется.
  sync(false);
  log('backButton: init');
}
