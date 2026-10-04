/*
 * tabReset.js — смена вкладки закрывает вложенную страницу.
 *
 * Зачем. Страницы настроек выполняют «выход» только в onPageAfterOut:
 *   settings/pump.svelte   — насос стоп, /state/auto (выход из режима настройки насоса);
 *   settings/sensor.svelte — /state/auto, сохранение датчика (sendDistance);
 *   service/system.svelte  — /state/auto, сохранение системы (sendSystem);
 *   service/wifi.svelte    — сохранение точки доступа (sendSystem).
 * Framework7 вызывает afterOut, только когда роутер закрывает страницу. Переход
 * на другую вкладку в таббаре страницу не закрывает — она остаётся «висеть» в
 * скрытой вкладке: настройки не сохранены, смазчик остаётся, например, в режиме
 * настройки насоса (подача на паузе).
 *
 * Как.
 *   * Вкладка, с которой ушли (событие tabHide), возвращается к своему корню без
 *     анимации — у закрываемой страницы срабатывает штатный выход (beforeOut →
 *     afterOut → beforeRemove). Вернувшись, пользователь видит корень вкладки.
 *   * Повторное нажатие на АКТИВНУЮ вкладку возвращает её к корню с анимацией.
 *     Framework7 на такое нажатие событий не даёт (Tab.show сразу выходит),
 *     поэтому нажатие ловится своим обработчиком в фазе захвата.
 *
 * Страницы при этом не правятся — используется их существующий выход.
 * Кнопка «назад» и записи истории — ./backButton.js: он сам снимает лишние
 * записи по routeChanged. Подробно — firmware docs/web-frontend.md §10.
 */

import log from './debug.js';

/**
 * Вернуть представление к корневой странице.
 * @param router  — роутер представления (view.router).
 * @param animate — анимировать переход назад.
 * @returns false — роутер занят анимацией перехода, возврат не выполнен.
 */
function closeToRoot(router, animate) {
  if (!router || router.history.length <= 1) return true;
  if (!router.allowPageChange || router.swipeBackActive) return false;
  if (router.history.length === 2) {
    // Корень есть в DOM (предыдущая страница) — берётся он, без пересоздания.
    router.back({ animate });
  } else {
    // Глубже (Сервис → Диагностика → Обновление): корень загружается заново,
    // промежуточные страницы только удаляются (beforeRemove).
    router.back(router.history[0], { force: true, animate });
  }
  return true;
}

/** С вкладки ушли: закрыть её вложенные страницы. */
function onTabHide(tabEl) {
  const view = tabEl && tabEl.f7View;
  if (!view) return;
  if (closeToRoot(view.router, false)) return;
  // Вкладку сменили посреди анимации перехода — закрыть, когда он закончится,
  // если пользователь к тому времени не вернулся на эту вкладку.
  view.router.once('routeChanged', () => {
    if (!tabEl.classList.contains('tab-active')) closeToRoot(view.router, false);
  });
}

/** Нажатие на уже активную вкладку таббара: вернуть её к корню. */
function onTabbarClick(e) {
  const link = e.target.closest && e.target.closest('.tabbar .tab-link.tab-link-active');
  if (!link) return;
  // Link из framework7-svelte пишет вкладку в data-tab («#view-settings»).
  const selector = link.getAttribute('data-tab') || link.getAttribute('href');
  if (!selector || selector === '#') return;
  const tabEl = document.querySelector(selector);
  if (tabEl && tabEl.f7View) closeToRoot(tabEl.f7View.router, true);
}

/**
 * Вернуть все вкладки к их корню без анимации — после восстановления связи с
 * блоком (store.js onLinkUp, этап 2, firmware docs/web-frontend.md §13). У
 * закрываемых страниц срабатывает их выход (сохранение, /state/auto, насос
 * стоп) — блок после отключения клиента и так вернулся в Auto, страница с ним
 * не расходится. Заменяет прежний location.reload() при потере связи.
 */
export function closeAllToRoot() {
  document.querySelectorAll('.views.tabs > .view').forEach((el) => {
    if (el.f7View) closeToRoot(el.f7View.router, false);
  });
}

/**
 * Включить закрытие вложенных страниц при смене вкладки. Вызывать один раз,
 * после f7ready.
 * @param f7 — экземпляр приложения Framework7.
 */
export function initTabReset(f7) {
  f7.on('tabHide', onTabHide);
  // Захват — до обработчика F7, пока класс активной вкладки ещё прежний.
  document.addEventListener('click', onTabbarClick, true);
  log('tabReset: init');
}
