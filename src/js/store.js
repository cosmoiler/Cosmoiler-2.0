
import { createStore } from 'framework7/lite';
import { f7 } from 'framework7-svelte';
import { get } from 'svelte/store';
import { t } from '../services/i18n.js';
import { request } from './http.js';
import log from './debug.js'

/** Перевод строки вне компонента (svelte-i18n отдаёт t как store). */
const tr = (key) => get(t)(key);

function getUrlVar() {
   // debug("document.location.host")
    var urlVar = window.location.search; // получаем параметры из урла
    var arrayVar = []; // массив для хранения переменных
    var valueAndKey = []; // массив для временного хранения значения и имени переменной
    var resultArray = []; // массив для хранения переменных
    arrayVar = (urlVar.substr(1)).split('&'); // разбираем урл на параметры
    if (arrayVar[0] == "") return false; // если нет переменных в урле
    for (var i = 0; i < arrayVar.length; i++) { // перебираем все переменные из урла
        valueAndKey = arrayVar[i].split('='); // пишем в массив имя переменной и ее значение
        resultArray[valueAndKey[0]] = valueAndKey[1]; // пишем в итоговый массив имя переменной и ее значение
    }
    return resultArray; // возвращаем результат
}

/**
 * @param ws - задается url адрес вебсокета.
 * Примеры: 1. localhost:port/?ws=192.168.4.1/ws - для доступа к @Cosmoiler
 *          2. localhost:port/?ws=2506d4fb70a8.ngrok.io - для доступа к тестовому серверу ngrok.io
 */
function uri() {
    if (document.location.host.indexOf('localhost') + 1) {
        if (!getUrlVar()['ws'])
            return '192.168.4.1'
        else
            return getUrlVar()['ws']
    } else if (document.location.host === "")
        return '192.168.4.1'
    else
        return document.location.host
}

// ---------------------------------------------------------------------------
// ! Контроль связи с устройством
//
// Связь измеряется НЕ «пингом по расписанию», а успешностью обмена с устройством
// (lastOkAt). Любой запрос это время обновляет, поэтому отдельный зонд уходит
// только когда реального трафика нет: на вкладке телеметрии (опрос 500 мс)
// лишних запросов не появляется вовсе.
// ---------------------------------------------------------------------------

/** Период тика сторожа. Сам тик сети не трогает — только читает счётчики. */
const WATCHDOG_MS = 500;
/** Простой, после которого отправляется зонд GET /ping. */
const PROBE_IDLE_MS = 2000;
/** Период зондирования, когда связь уже потеряна (backoff). */
const PROBE_DOWN_MS = 4000;
/**
 * Сколько подряд идущих неудачных зондов считаются потерей связи.
 *
 * Почему счётчик, а не «молчание дольше N мс»: устройство может задержать ответ
 * на секунды, оставаясь живым (см. COMMAND_TIMEOUT_MS), и порог по времени в этом
 * случае неизбежно даёт ложные срабатывания. Подряд идущие неудачи — нет: одна
 * задержка связь не рвёт.
 */
const LINK_LOST_AFTER = 2;
/**
 * Таймаут зонда (/ping). Ответ на него на устройстве готовится мгновенно, так
 * что это чисто запас на доставку. 1.5 с оказалось мало: в логе браузера видно,
 * как запросы ping систематически отменялись ровно на 1.50 s, и интерфейс
 * объявлял потерю связи на ровном месте.
 */
const PROBE_TIMEOUT_MS = 4000;
/**
 * Таймаут остальных запросов к устройству — намеренно больше, чем у зонда.
 *
 * Причина в конструкции ESP-IDF httpd: он обслуживает ВСЕ сессии ОДНОЙ задачей
 * (httpd_main.c: select() и разбор запроса в одном цикле), а принятые сокеты
 * получают SO_SNDTIMEO = send_wait_timeout (умолчание 5 с). Поэтому пока сервер
 * застрял в send() на одном клиенте, все остальные ждут. Запрос к устройству
 * законно может «висеть» несколько секунд, и обрывать его на 1.5 с — это ложные
 * «Команда не выполнена!» и диалоги поверх интерфейса.
 *
 * Обрыв плох ещё и тем, что сам создаёт проблему: httpd добивает застрявшую
 * сессию ошибкой (в логе ESP32 — `error in send : 104` и
 * `httpd_resp_send_err: error calling setsockopt : 22`) и всё это время не
 * обслуживает остальных.
 */
const COMMAND_TIMEOUT_MS = 8000;

/**
 * ! ОТЛАДКА: принудительно считать, что связь с устройством есть.
 *
 * Зачем: большая часть интерфейса спрятана за проверкой связи. Без блока
 * неактивны вкладки «Телеметрия» и «Настройки» (их id задаёт appview.svelte
 * по флагу connected), страницы показывают только надпись «Нет связи», а
 * кнопки остаются заблокированными. Отлаживать в таких условиях нельзя.
 *
 * Включается ТОЛЬКО в режиме отладки: `import.meta.env.DEV` подставляет Vite —
 * true при `npm run dev`, false при `npm run build`. В собранном интерфейсе
 * (то есть в прошивке на устройстве) ветка вырезается сборщиком целиком,
 * вместе со строкой лога ниже — продакшн не затрагивается.
 *
 * ! Перед выпуском: флаг должен оставаться привязанным к import.meta.env.DEV.
 *   Если его выставить в `true` руками — отладка уедет в прошивку.
 */
const FORCE_CONNECTED = import.meta.env.DEV;

/**
 * ! ОТЛАДКА: без устройства показывать настройки текущей прошивки (микропорции).
 *
 * Зачем: вид «Настроек» решает oil.micro из GET /settings/oil. Без устройства
 * запрос не проходит, и оставалось умолчание micro = false — вид прошивки до
 * 27.09.2026 (пресеты расстояния/времени, без страницы «Масло») вперемешку с
 * новыми частями, которые от micro не зависят. Поэтому при `npm run dev` по
 * умолчанию micro и supported — true; прежний вид — параметр адреса `?micro=0`
 * (например, localhost:8080/?micro=0). Ответ устройства, если оно доступно,
 * значения всё равно заменит.
 *
 * Привязка к `import.meta.env.DEV`, как у FORCE_CONNECTED: в собранном
 * интерфейсе (в прошивке) умолчание прежнее — false.
 */
const DEV_OIL_MICRO = import.meta.env.DEV && getUrlVar()['micro'] !== '0';

/**
 * ! ОТЛАДКА: без устройства «Телеметрия» показывает карточку «Одометр».
 *
 * Зачем: карточку выбирает режим из телеметрии (params[3].m), а без устройства
 * /telemetry/get не отвечает и оставалось умолчание m = 0 — карточка OFF.
 * При `npm run dev` умолчания — режим 1 (одометр) и фикс GPS: без фикса
 * одометр по ГНСС показывается карточкой «Таймер без спутников»
 * (indexDataCardTele в telemetry.svelte). Скорость, остаток до порции,
 * одометр, спутники, напряжение, остаток масла 60 % — правдоподобные числа,
 * чтобы видеть карточки заполненными. Ответ устройства, если оно доступно, их заменит.
 *
 * Привязка к `import.meta.env.DEV`: в собранном интерфейсе умолчания прежние.
 */
const DEV_TELEMETRY = import.meta.env.DEV;

/**
 * ! ОТЛАДКА: подавление окон «Команда не выполнена!».
 *
 * Зачем: при отладке интерфейса устройство недоступно, поэтому КАЖДЫЙ запрос
 * на запись отклоняется по таймауту и поверх страницы всплывает модальное окно.
 * Деталь здесь в том, что окно САМО МЕШАЕТ отладке: оно перекрывает именно ту
 * страницу, которую правят, а закрыть его некуда — при следующем действии оно
 * всплывает снова, потому что повторный запрос настроек опять уходит на
 * недоступное устройство.
 *
 * Гашение привязано к тому же `import.meta.env.DEV`, что и FORCE_CONNECTED:
 * в собранном интерфейсе (в прошивке) окна работают как прежде, а сама ветка
 * вырезается сборщиком. Проверка такая же: в www/app.js не должно остаться
 * ни строки `Команда не выполнена` вне обработчиков.
 *
 * ! Перед выпуском: не отвязывать от import.meta.env.DEV.
 *
 * @param {string} message — текст окна, как он был бы показан пользователю.
 */
function commandFailed(message) {
  if (FORCE_CONNECTED) {
    log('DEBUG: окно «%s» подавлено (import.meta.env.DEV)', message);
    return;
  }
  f7.dialog.alert(message, 'Cosmoiler');
}

/** Время последнего успешного ответа устройства (0 = ещё ни одного). */
let lastOkAt = 0;
/** Сколько зондов подряд не удалось. */
let probeFailures = 0;
/** Текущее представление о связи — чтобы не писать в state на каждом тике. */
let linkDown = true;
let probeInFlight = false;
let watchdogTimer = 0;

/** Отметка успешного обмена — продлевает «жизнь» связи. */
function markOk() {
  lastOkAt = Date.now();
  probeFailures = 0;
}

/**
 * Запрос к устройству: базовый адрес, таймаут и отметка успеха для сторожа.
 *
 * Обращаться к устройству следует через эту функцию, а не через request()
 * напрямую: иначе запрос не продлит lastOkAt и заставит сторож слать лишние
 * зонды. Всё, что относится к политике общения с устройством, собрано здесь;
 * транспорт — в http.js.
 *
 * @param {string} path — путь от корня устройства, например '/settings/trip'.
 * @param {object} [options] — {method, data, timeout, responseType} (см. http.js).
 */
function deviceRequest(path, options) {
  return request('http://' + uri() + path, Object.assign({
    timeout: COMMAND_TIMEOUT_MS,
  }, options)).then((response) => {
    if (fromDevice(response)) markOk();
    return response;
  });
}

/**
 * ! Ответ именно от блока, а не от чужого узла.
 *
 * Адрес блока по умолчанию «публичный» (194.168.4.1, firmware WiFiKconfig.hpp).
 * Выключили блок — телефон теряет его Wi-Fi и уходит в мобильный интернет, и
 * запрос на этот адрес уходит туда же: ответить может посторонний узел или
 * прокси оператора (HTML, коды 403/502…). Раньше любой ответ продлевал связь —
 * интерфейс «находил» блок, закрывал страницы и перечитывал настройки, хотя
 * блока нет. Блок на любой запрос API отвечает JSON (kMimeJson в WebBsp.cpp,
 * в том числе {"status":false} при отказе) — по нему и отличаем.
 */
function fromDevice(response) {
  const type = response && response.headers && response.headers.get('Content-Type');
  return !!type && type.indexOf('json') !== -1;
}

/** Ответ блока на /ping — {"status":true}; что угодно другое — блока нет. */
function pingOk(response) {
  return fromDevice(response) && statusOk(response);
}

/** Разовая проверка связи. */
const checkOnlineStatus = async () => {
  try {
    return pingOk(await deviceRequest('/ping', { timeout: PROBE_TIMEOUT_MS }));
  } catch (err) {
    return false;
  }
};

/**
 * Один зонд. Больше одного запроса «в полёте» не держим: httpd на устройстве
 * обслуживает все сессии одной задачей, и параллельные соединения его только
 * тормозят.
 *
 * Длительность пишется в лог: по ней видно реальную задержку ответа и то, что
 * связь рвётся именно по таймауту, а не по отказу соединения.
 */
function probeOnce() {
  if (probeInFlight) return;
  probeInFlight = true;
  const t0 = Date.now();
  const ok = () => {
    probeInFlight = false;
    log("PROBE ok: %d ms", Date.now() - t0);
  };
  const fail = () => {
    probeInFlight = false;
    probeFailures += 1;
    log("PROBE FAIL #%d: %d ms", probeFailures, Date.now() - t0);
  };
  // Ответ не от блока (см. fromDevice) — такая же неудача, как таймаут.
  deviceRequest('/ping', { timeout: PROBE_TIMEOUT_MS })
    .then((response) => (pingOk(response) ? ok() : fail()), fail);
}

/**
 * ! Появление связи: подписчики и перечитывание настроек.
 *
 * Настройки грузятся НЕ из init, а при каждом переходе «нет связи → есть»:
 * первый раз — после первого успешного /ping сторожа, затем — после каждого
 * восстановления связи. Раньше при потере связи страницы делали
 * location.reload(), и блок заново отдавал все файлы интерфейса.
 * Подписчик (app.svelte) при reconnect закрывает вложенные страницы вкладок
 * (tabReset.js closeAllToRoot) — блок после отключения клиента и так в Auto.
 */
const linkUpListeners = [];
/** Связь уже была хотя бы раз — следующее появление считается восстановлением. */
let everUp = false;
/** Обработчики появления связи (их и loadSettings) — после события load. */
let onLinkUpHook = null;

/**
 * Подписаться на появление связи с блоком.
 * @param {function({reconnect: boolean})} cb — reconnect: связь уже была раньше.
 */
export function onLinkUp(cb) {
  linkUpListeners.push(cb);
}

/**
 * Выполнить fn, когда страница догрузилась (событие load). До него браузер
 * качает index.html, app.css, app.js, шрифт и иконку — до шести соединений,
 * ровно предел httpd на блоке (max_open_sockets = 6); запросы настроек
 * вдобавок попали бы под lru_purge_enable и мешали загрузке страницы.
 */
function whenLoaded(fn) {
  if (document.readyState === 'complete') fn();
  else window.addEventListener('load', fn, { once: true });
}

/**
 * ! Тревога «нет связи» — красный навбар с надписью вместо заголовка (просьба
 * пользователя 05.10.2026, вместо плашки на страницах). Класс link-down на
 * <html> и текст в CSS-переменной --link-down-text (стили — app.less). Без
 * отсрочки навбар мигал бы красным при каждом открытии интерфейса, пока не
 * пришёл первый ответ /ping: поэтому до первой связи — только если блок не
 * ответил за STARTUP_GRACE_MS.
 */
const STARTUP_GRACE_MS = 3000;
const startedAt = Date.now();
let linkAlarm = false;

function updateLinkAlarm() {
  const on = linkDown && (everUp || Date.now() - startedAt > STARTUP_GRACE_MS);
  if (on === linkAlarm) return;
  linkAlarm = on;
  const root = document.documentElement;
  // Строка CSS — в кавычках; JSON.stringify экранирует их внутри текста.
  if (on) root.style.setProperty('--link-down-text', JSON.stringify(tr('navbar.nolink')));
  // Заголовок навбара не подменяется, а прячется (visibility), надпись — слой
  // поверх (app.less): ширина заголовка не меняется, центрирование F7 (из JS,
  // по ширине текста) остаётся верным без пересчёта.
  root.classList.toggle('link-down', on);
}

/** Единственное место, где меняется state.connect. */
function setLink(state, down) {
  // Отладка: связь объявлена постоянной, сторож не имеет права её гасить.
  if (FORCE_CONNECTED) down = false;
  if (down === linkDown) return;
  linkDown = down;
  state.connect = !down;
  log("CONNECT: ", !down);
  if (!down) {
    const reconnect = everUp;
    everUp = true;
    whenLoaded(() => {
      linkUpListeners.forEach((cb) => {
        try { cb({ reconnect }); } catch (err) { log('onLinkUp: %o', err); }
      });
      if (onLinkUpHook) onLinkUpHook();
    });
  }
}

/** Тик сторожа: только чтение счётчиков (+ зонд, если давно нет трафика). */
function watchdogTick(state) {
  // Связь есть только после хотя бы одного успешного ответа и пока не накопилось
  // LINK_LOST_AFTER подряд неудачных зондов.
  const down = (lastOkAt === 0) || (probeFailures >= LINK_LOST_AFTER);
  const silent = Date.now() - lastOkAt;
  // Зонд нужен только если реального трафика нет. Когда связь уже потеряна,
  // зондируем реже — не долбим устройство, которое и так не отвечает.
  const idle = down ? PROBE_DOWN_MS : PROBE_IDLE_MS;
  // Скрытая вкладка не зондирует: реагировать на потерю связи некому, а каждый
  // запрос стоит устройству нового TCP-соединения (httpd закрывает соединение
  // после каждого ответа) и держит время в TIME_WAIT.
  if (silent > idle && !document.hidden && navigator.onLine !== false) probeOnce();
  setLink(state, down);
  updateLinkAlarm();
}

function startWatchdog(state) {
  if (watchdogTimer) return; // идемпотентно

  // ! Отладка: сторож не нужен вовсе — связь объявлена постоянной. Заодно
  // исчезают зонды и их шум в консоли (без блока каждый /ping всё равно
  // кончается таймаутом). Эта ветка есть только в dev-сборке.
  if (FORCE_CONNECTED) {
    log("DEBUG: FORCE_CONNECTED — связь с устройством объявлена постоянной (import.meta.env.DEV)");
    linkDown = false;
    everUp = true;
    state.connect = true;
    // Перехода «нет связи → есть» в dev не бывает — настройки грузим один раз
    // (блок по ?ws= может и ответить; без него запросы просто не пройдут).
    whenLoaded(() => { if (onLinkUpHook) onLinkUpHook(); });
    return;
  }

  // Потеря Wi-Fi — самый частый случай (устройство выключили/перезагрузили,
  // вышли из зоны AP). Это видно мгновенно и бесплатно, без единого запроса.
  window.addEventListener('offline', () => {
    lastOkAt = 0;
    probeFailures = LINK_LOST_AFTER;
    setLink(state, true);
    updateLinkAlarm();
  });
  // «online» НЕ означает, что устройство снова доступно, поэтому связь не
  // объявляем восстановленной, а лишь сразу шлём зонд.
  window.addEventListener('online', () => probeOnce());
  // Возврат во вкладку — сразу проверяем связь, не дожидаясь тика сторожа.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) probeOnce();
  });

  watchdogTimer = setInterval(() => watchdogTick(state), WATCHDOG_MS);
  watchdogTick(state);
}

/**
 * ! WebSocket здесь СОЗНАТЕЛЬНО не используется — не возвращайте его.
 *
 * В прошивке WS-сервера нет: в main/HAL/WebBsp.cpp маршруты /telemetry/start
 * и /telemetry/stop объявлены заглушками с пояснением «Отдельный сеанс
 * телеметрии не нужен: страница опрашивает /telemetry/get сама. В legacy
 * start() поднимал задачу и слал кадры по WebSocket — этот интерфейс в
 * проекте не используется».
 *
 * Кроме того, конфигурация httpd этому прямо мешает: max_open_sockets = 6 при
 * lru_purge_enable = true. Постоянно висящий WS-сокет занял бы один из шести
 * слотов, а LRU вытесняет «самое давно не использованное» соединение — то
 * есть простаивающий WS убивался бы первым при каждой загрузке страницы.
 *
 * Вместо этого — HTTP-опрос (см. requestTelemetryStart и init).
 */

/**
 * ! Отложенная отправка настроек на устройство.
 *
 * Раньше здесь был ОДИН общий timeoutId, который по очереди перезаписывали
 * sendDistance / sendTime / sendManual / sendPump. Из-за этого сохранение
 * одних настроек отменяло ещё не отправленные изменения других (окно ~2 с),
 * то есть правки могли не доехать до устройства. Теперь таймер у каждого
 * канала свой.
 */
const sendTimers = {};

function deferSend(key, fn, delay = 2000) {
  clearTimeout(sendTimers[key]);
  sendTimers[key] = setTimeout(fn, delay);
}

/**
 * ! Не больше limit запросов к блоку одновременно.
 *
 * httpd на блоке обслуживает все сессии одной задачей (max_open_sockets = 6,
 * lru_purge_enable): десяток запросов настроек разом, как было при старте,
 * вытеснял соединения друг друга и тормозил ответы.
 *
 * @param {Array<function(): Promise>} tasks — запросы, по одному на функцию.
 * @param {number} [limit=2]
 * @returns {Promise<void>} — когда завершились все (ошибки не прерывают остальных).
 */
function runLimited(tasks, limit = 2) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      try { await task(); } catch (err) { /* связь отслеживает сторож */ }
    }
  };
  return Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker)).then(() => {});
}

/** Период опроса /telemetry/get — пауза ПОСЛЕ ответа, а не интервал запуска. */
const TELEMETRY_PERIOD_MS = 500;
/** Номер текущей цепочки опроса: старая цепочка, увидев другой номер, гаснет. */
let telemetryGen = 0;
let telemetryTimer = 0;

/**
 * Заводские параметры классификатора «трасса / город» — те же числа, что
 * defaults::kOdoRoute в прошивке (ConfigTypes.hpp) и nvs/cosmoiler_NVS_config.csv.
 * Имена полей — хвосты ключей NVS «ODO.SMR.*» (контракт — docs/config.md §1.1).
 */
export const ROUTE_DEFAULTS = Object.freeze({
  vhi: 90, vstp: 5, vgo: 10,          // км/ч: «высокая скорость», стоим, поехали
  thwy: 65, tcty: 45,                 // %: порог балла трассы / города
  cnfw: 2,                            // окон подряд для смены состояния
  dwell: 300, stdst: 1000, trip: 1500, park: 180, // с, м, м, с
  wdst: 1500, wtm: 120,               // окно наблюдения: м, с
  wcrs: 30, wnst: 15, wstb: 10, wrun: 30, wsdn: 20 // веса ×10
});

/**
 * Проверка набора параметров классификатора — та же, что routeCfgValid() в
 * прошивке: недопустимый набор устройство отклонит целиком (500, status:false).
 * @returns {string|null} ключ перевода с причиной или null, если набор допустим.
 */
export function routeCfgError(r) {
  if (!(r.vstp > 0 && r.vstp < r.vgo && r.vgo < r.vhi)) return 'route.cfg.err.speed';
  if (!(r.thwy <= 100 && r.tcty < r.thwy)) return 'route.cfg.err.threshold';
  if (!(r.cnfw > 0 && r.wdst > 0 && r.wtm > 0 && r.park > 0)) return 'route.cfg.err.zero';
  if (!(r.wcrs + r.wnst + r.wstb + r.wrun + r.wsdn > 0)) return 'route.cfg.err.weights';
  return null;
}

/** Полный адрес ресурса устройства (для ссылок, например выгрузки журнала). */
export function deviceUrl(path) {
  return 'http://' + uri() + path;
}

/**
 * Версия прошивки: ver из /settings/ver (или из localStorage, если блок не
 * ответил). verfs — цифры двух последних символов ver.fw через точку.
 * Раньше разбор был повторён трижды и падал, когда в localStorage ничего нет
 * (JSON.parse(null) → null.fw) или в хвосте fw нет цифр (null.join).
 */
function applyVer(state, ver) {
  if (!ver || typeof ver.fw !== 'string') return;
  state.ver = ver;
  const digits = ver.fw.slice(-2).match(/\d/g);
  if (digits) state.verfs = digits.join('.');
}

function requestVer(state) {
  return deviceRequest('/settings/ver')
    .then((response) => {
      applyVer(state, JSON.parse(response.data));
      localStorage.setItem('ver', response.data);
    })
    .catch(() => {
      try { applyVer(state, JSON.parse(localStorage.getItem('ver'))); } catch (err) { /* нет сохранённой */ }
    });
}

/**
 * Таймер с блока: у прошивки два пресета (город, оффроуд), интерфейс держит три
 * — индекс 1 (трасса) пустышка, чтобы индексы совпадали с одометром
 * (presets.CITY/WAY/OFFROAD). Раньше пустышку вставляла только стартовая
 * загрузка, а перечитывание после отказа записи — нет: оффроуд (индекс 2)
 * становился undefined.
 */
function applyTimer(state, timer) {
  timer.presets.splice(1, 0, { time: 0, num: 0, cycles: 0 });
  state.timer = timer;
}

/**
 * Отправить очередь раздела (state.pending[section]) и очистить её. При отказе —
 * окно ошибки и чтение раздела с блока, чтобы страница показала то, что в нём
 * действительно лежит (apply — как применить ответ GET к state).
 */
function sendPending(state, section, path, apply) {
  const queue = state.pending[section];
  if (queue.size === 0) return;
  const data = Object.fromEntries(queue);
  queue.clear();
  log('send %s: %o', path, data);
  deviceRequest(path, { method: 'POST', data })
    .catch(() => {
      commandFailed(tr('error.command'));
      deviceRequest(path)
        .then((response) => apply(JSON.parse(response.data)))
        .catch(() => { /* связь отслеживает сторож */ });
    });
}

/**
 * Множители ОФФРОУДА, которые предлагает веб (dose.x, %): прошивка принимает
 * 25…500, список — firmware docs/config.md §1.1. По умолчанию 300 (×3).
 */
export const DOSE_X = Object.freeze([25, 30, 50, 75, 100, 150, 200, 300, 400, 500]);

/** Множитель ОФФРОУДА для показа: 300 → «×3», 25 → «×0.25». */
export function doseXText(x) {
  return '×' + (Number(x) || 300) / 100;
}

/** Адреса команд смены режима смазчика (modeWork). */
const MODE_PATHS = {
  0: '/state/auto',     // OILER_AUTO
  2: '/state/ctrl',     // OILER_VISCOSITY
  3: '/state/pumping',  // OILER_PUMPING
  4: '/state/training', // OILER_TRAINING
};

/** Ответ прошивки на запись настроек: {"status":true|false} (при отказе ещё и HTTP 500). */
function statusOk(response) {
  try {
    return JSON.parse(response.data).status === true;
  } catch (err) {
    return false;
  }
}

const store = createStore({
  state: {
    connect: false,
   // trigg_connect: false; // триггер изменения статуса подключения
    locale: (navigator.userLanguage || navigator.language || navigator.systemLanguage),
    /**
     * ! Изменённые, но ещё не отправленные поля настроек — по разделам.
     *
     * Страница кладёт поле в очередь своего раздела (pending.trip.set('presets', …)),
     * send* отправляет только эту очередь и очищает её. Раньше очередь была одна
     * на всех (mapSettings): поездка и таймер писали туда один ключ presets, а
     * sendSystem отправлял и очищал её сразу — правки поездки, ждущие отложенной
     * отправки (2 с), уходили на /settings/system и терялись.
     */
    pending: { trip: new Map(), time: new Map(), system: new Map() },

    //gnssPresent: false,
    mode: {
      id: "/mode.json",
      m: DEV_TELEMETRY ? 1 : 0, // dev без блока — одометр (см. DEV_TELEMETRY)
      p: 0
    },
    odometer: {
      id: "/trip.json",
      smart: { predict: 5, avgsp: 80, maxsp: 150 },
      // Микропорции (прошивка с 01.10.2026, firmware docs/config.md §1.1): lvl —
      // ручка «масло» АСФАЛЬТА −5…+5 (ODO.PRS0.lvl, действует и в TimerGps),
      // x — множитель ОФФРОУДА, % (25…500, ODO.PRS1.x). См. DOSE_X.
      dose: { lvl: 0, x: 300 },
      sensor: { gnss: true, imp: 16, hdop: 5000 },
      presets: [
          { dst_m: 4000, num: 2, imp_m: 0, n: 5, cycles: 0 },
          { dst_m: 7000, num: 5, imp_m: 0, n: 10, cycles: 0 },
          { dst_m: 3000, num: 1, imp_m: 0, n: 3, cycles: 0 }
      ],
      wheel: { d: 17, w: 150, h: 70, l: 2016 },
      // Классификатор «трасса / город» (NVS ODO.SMR.*, docs/route.md §3.1).
      // Значения — целые, как в NVS: пороги балла в %, веса ×10, времена в с.
      route: { ...ROUTE_DEFAULTS }
    },
    timer: {
      id: "/time.json",
      smart: { trail: true, predict: 600 },
      // Микропорции «ПО ВРЕМЕНИ» — «только ручка»: lvl — ручка АСФАЛЬТА
      // (TMR.PRS0.lvl), x — множитель ОФФРОУДА (TMR.PRS1.x); интервал пресета
      // (presets[0].time) при микропорциях прошивка не использует.
      dose: { lvl: 0, x: 300 },
      presets: [
          { time: 120, num: 2, cycles: 0 },
          { time: 0, num: 0, cycles: 0 },
          { time: 60, num: 1, cycles: 0 }
      ]
    },
    manual: {
      id: "/manual.json",
      pump: { dpms: 500, dpdp: 800 }
    },
    pump: {
      id: "/pump.json",
      dpms: null, dpdp: null,
      usr: false, // пользовательский насос
      type: ""    // тип насоса (PMP.type): 'A', 'B', 'C' — от него предел dpms в pump.svelte
    },
    // Масло (/settings/oil, firmware docs/oil.md) — только чтение: cap — объём
    // бачка, мл, q — расход насоса, мкл/с × 10, micro — прошивка подаёт масло
    // микропорциями. Ручки дозы с 01.10.2026 — dose.lvl одометра и таймера,
    // множители ОФФРОУДА — dose.x (sendDose); до этого было одно поле lvl здесь.
    //
    // ! micro решает, какие настройки показывать: при микропорциях пресеты
    //   расстояния/времени и объём насоса на подачу не влияют и спрятаны, доза
    //   задаётся ручкой на странице «Масло». Прошивка без секции масла (до
    //   27.09.2026) её не отдаёт — остаётся false, интерфейс прежний.
    //
    // ! supported — не поле прошивки: ставится после успешного GET /settings/oil
    //   (учёт масла есть и в прежнем алгоритме подачи). По нему «Сервис → Система»
    //   показывает карточку «Заправка».
    //
    // ! При `npm run dev` умолчание micro/supported — true (DEV_OIL_MICRO).
    oil: {
      id: "/oil.json",
      cap: 90,
      q: 167,
      micro: DEV_OIL_MICRO,
      supported: DEV_OIL_MICRO
    },
    system: {
      id: "/system.json",
      pn: "",
      ap: {ssid: "Cosmoiler-NNNN", psw: "", pwr: true},
      sta: {ssid: "", psw: ""},
      bright: 255,
      gps: true,
      fake: false
    },
   /*  pn: { pn: null, ssid: "Cosmoiler_", psw: null }, */
    ver: {
      id: "/ver.json",
      fw: "   ", hw: "   "
    },
    telemetry: {
      id: "telemetry",
      params: [
        { // 0 - odometer
          sp: 0,
          imp: 0,
          v: DEV_TELEMETRY ? 12345 : 0,   // Одометр [м]
          dst: DEV_TELEMETRY ? 2000 : 0,  // Оставшееся расстояние до вкл насоса [м]
          spd: DEV_TELEMETRY ? 120 : 0,    // Скорость
          maxsp: DEV_TELEMETRY ? 98 : 0,  // Максимальная скорость
          avgsp: DEV_TELEMETRY ? 54 : 0   // Средняя скорость
        },
        { // 1 - timer
          v: 110000,  // Таймер, [мс]
          max: 110000 // Интервал таймера, [мс]
        },
        { // 2 - pump
          v: 0,      // Количество включений насоса
        },
        { // 3 - mode (dev без блока — одометр, см. DEV_TELEMETRY)
          m: DEV_TELEMETRY ? 1 : 0, p: 0
        },
        { // 4 - gps
          fix: DEV_TELEMETRY,          // 3D Fix GPS
          fake: false,  // Признак спуффинга GPS сигнала
          sat: DEV_TELEMETRY ? 9 : 0,  // Количество спутников
          lat: 0.000000,// Широта
          lon: 0.000000,// Долгота
          q: 0          // Вердикт достоверности ГНСС: 0 — достоверно, 1 — сомнительно,
                        // 2 — недостоверно (прошивка с 29.09.2026; у старой поля нет —
                        // тогда цвет значка GPS решает один fix, см. telemetry.svelte)
        },
        { // 5 - voltage
          v: DEV_TELEMETRY ? 13800 : 0, // Напряжение бортовое [мВ]
          r: 4095,    // Разрешение АЦП
          max: 3.3,    // Максимальное напряжение на входе АЦП [В]
          R1: 200000,
          R2: 49900
        },
        { // 6 - oil (прошивка с 27.09.2026, docs/oil.md)
          oil: DEV_TELEMETRY ? 100 : 100, // Остаток масла в бачке, %
          km: DEV_TELEMETRY ? 2500 : -1,     // Хватит на ~N км (-1 — оценки ещё нет)
          low: 0      // 1 — мало масла
        },
      ]
    },
    verfs: "5.0",

    OILER_TRAINING: 4,
    OILER_PUMPING: 3,
    OILER_VISCOSITY: 2,
    OILER_MANUAL: 1,
    OILER_AUTO: 0,

    presets: {
      CITY: 0,
      WAY: 1,
      OFFROAD: 2
    },

  },
  getters: {
    gnssPresent:  ({state}) => state.system,
    connected:    ({state}) => state.connect,
    odometer:     ({state}) => state.odometer,
    timer:        ({state}) => state.timer,
    manual:       ({state}) => state.manual,
    pump:         ({state}) => state.pump,
    oil:          ({state}) => state.oil,
    telemetry:    ({state}) => state.telemetry,
    mode:         ({state}) => state.mode,
    system:       ({state}) => state.system,
    ver:          ({state}) => state.ver,
    verfs:        ({state}) => state.verfs,
    pending:      ({state}) => state.pending,
  },
  actions: {
    init({state}) {

      log("INIT")

      // Таймаут задаётся на каждый запрос (см. deviceRequest), глобальной
      // настройки больше нет: f7.request удалён в Framework7 8, а собственный
      // транспорт (http.js) не зависит от созданного экземпляра приложения.
      // Поэтому исчезла и прежняя ловушка «setup() нельзя звать на уровне
      // модуля, пока f7 не создан».
      // Запросы в интернет за прошивкой идут с timeout: 0 (см. diag.svelte) —
      // иначе большой файл не успеет скачаться.

      // ! Настройки грузятся при появлении связи (setLink → onLinkUpHook), а не
      //   здесь: первая связь — первый успешный /ping сторожа, дальше — каждое
      //   восстановление связи. Хук ставится ДО сторожа: в dev (FORCE_CONNECTED)
      //   сторож вызывает его сразу.
      onLinkUpHook = () => store.dispatch('loadSettings');

      // Вместо «пинга по расписанию» — сторож времени последнего успешного
      // ответа (см. блок «Контроль связи» выше). Он сам решает, когда нужен зонд.
      startWatchdog(state);
    },

    /**
     * Перечитать настройки с блока — не больше двух запросов одновременно
     * (runLimited). Вызывается при появлении связи и обновлением жестом на
     * «Главной». Раздел, у которого есть неотправленные правки (очередь
     * state.pending), не перечитывается: правки новее, а GET затёр бы их до
     * отложенного POST.
     * @returns {Promise<void>} — когда завершились все запросы.
     */
    loadSettings({state}) {
      const get = (path, apply) => () =>
        deviceRequest(path).then((response) => apply(JSON.parse(response.data)));
      const tasks = [
        get('/settings/mode', (mode) => { state.mode = mode }),
        get('/telemetry/get', (telemetry) => { state.telemetry = telemetry }),
      ];
      if (state.pending.trip.size === 0)
        tasks.push(get('/settings/trip', (odometer) => { state.odometer = odometer }));
      if (state.pending.time.size === 0)
        tasks.push(get('/settings/time', (timer) => applyTimer(state, timer)));
      tasks.push(
        get('/settings/manual', (manual) => { state.manual = manual }),
        get('/settings/pump', (pump) => { state.pump = pump }),
        // Прошивка до 27.09.2026 секции масла не знает — остаются умолчания.
        get('/settings/oil', (oil) => { state.oil = { ...oil, supported: true } }),
      );
      if (state.pending.system.size === 0)
        tasks.push(get('/settings/system', (system) => {
          state.system = system
          if (ToBoolean(state.system.gps) == false)
            state.odometer.sensor.gnss = false
        }));
      tasks.push(() => requestVer(state));
      log('loadSettings: %d запросов', tasks.length);
      return runLimited(tasks, 2);
    },

    async getServiceInfo({state}) {
      log("getServiceInfo")
      //async () => {
        const online = await checkOnlineStatus();
        if (online) {
          deviceRequest('/settings/system').then((response) => {
            state.system = JSON.parse(response.data)
            if (!state.system.gps) state.odometer.sensor.gnss = false
          });
          requestVer(state);
        }
      //}
    },

    requestGNSS({state}) {
      //wsStore.set({cmd: "get", param: ["gnss"]})
      log('requestGNSS')
    },

    requestTelemetryStart({state}) {
      // Идемпотентно: новый номер цепочки гасит прежнюю (её ответ, придя
      // позже, уже не запланирует следующий запрос).
      clearTimeout(telemetryTimer);
      const gen = ++telemetryGen;

      // Без предварительного checkOnlineStatus() (GET /ping): в цикле ниже он
      // выполнялся перед КАЖДЫМ опросом, то есть на 500 мс уходило 2 запроса
      // вместо одного.
      //
      // Запрос идёт через deviceRequest(): каждый успешный ответ продлевает
      // связь (lastOkAt), поэтому пока эта страница открыта, сторож не шлёт ни
      // одного лишнего зонда.
      //
      // GET /telemetry/start не нужен: на устройстве это заглушка, которая
      // сразу отвечает true и ничего не меняет (firmware/main/HAL/WebBsp.cpp,
      // Route::TelemetryStart: «Отдельный сеанс телеметрии не нужен: страница
      // опрашивает /telemetry/get сама»).
      //
      // ! Цепочка setTimeout, а не setInterval: следующий запрос уходит через
      //   TELEMETRY_PERIOD_MS ПОСЛЕ ответа (или ошибки). С setInterval при
      //   медленном ответе блока запросы накладывались друг на друга.
      const schedule = () => {
        if (gen !== telemetryGen) return;
        telemetryTimer = setTimeout(tick, TELEMETRY_PERIOD_MS);
      };
      const tick = () => {
        if (gen !== telemetryGen) return;
        // В скрытой вкладке опрос не нужен: реагировать некому, а устройство
        // обслуживает запросы одной задачей — лишний трафик только мешает.
        if (document.hidden) { schedule(); return; }
        deviceRequest('/telemetry/get')
          .then((response) => {
            if (gen === telemetryGen) state.telemetry = JSON.parse(response.data)
          })
          .catch((err) => { /* связь отслеживает сторож по lastOkAt */ })
          .finally(schedule)
      };
      tick();
    },

    requestTelemetryStop({state}) {
      clearTimeout(telemetryTimer);
      telemetryTimer = 0;
      telemetryGen++;
      // GET /telemetry/stop — тоже заглушка на устройстве: отдельного сеанса
      // телеметрии нет (см. комментарий в requestTelemetryStart), поэтому
      // запрос не отправляется.
    },

    calcDistance({state}, _trip) {
      log("_trip", _trip)
      state.odometer.wheel.d = Number(_trip.wheel.d)
      state.odometer.wheel.h = Number(_trip.wheel.h)
      state.odometer.wheel.w = Number(_trip.wheel.w)
      state.odometer.sensor.imp = Number(_trip.sensor.imp)
      let dm = _trip.wheel.d * 25.4;
      let hm = _trip.wheel.h * _trip.wheel.w / 100;
      let Len = (dm + 2 * hm) * 3.14159;
      state.odometer.wheel.l = Math.round(Len);
      for (let i = 0; i <= 2; i++) {
          let a = _trip.sensor.imp * _trip.presets[i].dst_m / (_trip.wheel.l / 1000);
          state.odometer.presets[i].imp_m = parseInt(a.toFixed(), 10);
      }
      state.odometer = state.odometer
    },

    /** Одометр: поля из state.pending.trip, отправка через 2 с после последней правки. */
    sendDistance({state}, data) {
      state.odometer = data
      state.odometer = state.odometer
      deferSend('trip', () => sendPending(state, 'trip', '/settings/trip',
        (odometer) => { state.odometer = odometer }))
    },

    /**
     * Параметры классификатора (страница /route/cfg). Отправляются сразу, без
     * deferSend: это явное действие по кнопке «Сохранить», а результат нужен
     * странице — прошивка отклоняет недопустимый набор целиком.
     * @returns {Promise<boolean>} true — сохранено.
     */
    async sendRoute({state}, route) {
      let ok = false;
      try {
        const res = await deviceRequest('/settings/trip', { method: 'POST', data: { route } });
        ok = statusOk(res);
      } catch (err) {
        ok = false;
      }
      // Показать то, что действительно лежит в устройстве.
      try {
        const res = await deviceRequest('/settings/trip');
        state.odometer = JSON.parse(res.data);
      } catch (err) { /* связь пропала — страница покажет ошибку */ }
      return ok;
    },

    /** Состояние классификатора: GET /route/get (docs/route.md §8). */
    async routeInfo() {
      const res = await deviceRequest('/route/get');
      return JSON.parse(res.data);
    },

    /** Очистить калибровочный журнал перед новой поездкой. */
    async routeClear() {
      const res = await deviceRequest('/route/clear');
      return statusOk(res);
    },

    /** Таймер: поля из state.pending.time, отправка через 2 с после последней правки. */
    sendTime({state}, data) {
      state.timer = data
      state.timer = state.timer
      deferSend('time', () => sendPending(state, 'time', '/settings/time',
        (timer) => applyTimer(state, timer)))
    },

    sendManual({state}, data) {
      state.manual = data
      state.manual = state.manual
      // ! Настройки ручного режима применяются на ходу: если насос ручного режима
      //   работает, прошивка сразу перезапускает его с новыми параметрами. Поэтому
      //   задержка отправки короткая (300 мс — только чтобы не слать каждый шаг
      //   ползунка), а не общие 2 с.
      deferSend('manual', () => {
          deviceRequest('/settings/manual', { method: 'POST', data: state.manual })
          .then((res) => {
            log(res)
          })
          .catch(() => {
            commandFailed(tr('error.command'))
            // ! Было state.odometer: данные manual затирали одометр.
            deviceRequest('/settings/manual')
              .then((response) => { state.manual = JSON.parse(response.data) })
              .catch(() => { /* связь отслеживает сторож */ })
          })
          log("send Manual = ", state.manual);
      }, 300)
    },

    sendPump({state}, data) {
      state.pump = data;
      state.pump = state.pump;
      deferSend('pump', () => {
          // ! Отправляются все настраиваемые поля насоса. Было только {dpms}:
          //   выбор «Дополнительный насос» (usr) и пауза dpdp до устройства не
          //   доходили. Тип (type) не отправляется — его задаёт «железо» (NVS).
          deviceRequest('/settings/pump', { method: 'POST', data: {dpms: data.dpms, dpdp: data.dpdp, usr: data.usr} })
          .then((res) => {
            log(res)
          })
          .catch(() => {
            commandFailed(tr('error.command'))
            // ! Было state.odometer: данные насоса затирали одометр.
            deviceRequest('/settings/pump')
              .then((response) => { state.pump = JSON.parse(response.data) })
              .catch(() => { /* связь отслеживает сторож */ })
          })
          log("send Pump = ", state.pump);
      });

    },

    /**
     * Микропорции своего режима (firmware docs/oil-dose.md §7–8, docs/config.md
     * §1.1): timer = false — одометр (/settings/trip, «ПО ПРОБЕГУ» и TimerGps),
     * true — таймер (/settings/time, «ПО ВРЕМЕНИ»). Поля необязательные:
     *   lvl  — ручка «масло» АСФАЛЬТА −5…+5 (dose.lvl);
     *   x    — множитель ОФФРОУДА, % (dose.x, одно из DOSE_X).
     *
     * ! Уходит объект dose целиком: прошивка берёт присланные поля, остальные
     *   оставляет. Задержка короткая
     *   (300 мс — только чтобы не слать каждый шаг ползунка): прошивка применяет
     *   дозу сразу. Ключ deferSend общий с sendDistance / sendTime — ждущие
     *   правки раздела уходят тем же запросом.
     */
    sendDose({state}, {timer, lvl, x}) {
      const section = timer ? 'time' : 'trip'
      const cfg = timer ? state.timer : state.odometer
      if (lvl !== undefined) cfg.dose.lvl = lvl
      if (x !== undefined) cfg.dose.x = x
      state.pending[section].set('dose', cfg.dose)
      if (timer) state.timer = state.timer
      else state.odometer = state.odometer
      deferSend(section, () => sendPending(state, section,
        timer ? '/settings/time' : '/settings/trip',
        timer ? (t) => applyTimer(state, t) : (o) => { state.odometer = o }), 300)
    },

    /**
     * Бачок заправлен: GET /oil/refill?e=1 — «был почти пуст» (прошивка
     * пересчитает расход насоса), без e — просто заправка. Затем свежие
     * остаток (телеметрия) и расход (секция масла).
     * @returns {Promise<boolean>} true — прошивка записала заправку.
     */
    async oilRefill({state}, wasEmpty) {
      let ok = false;
      try {
        const res = await deviceRequest('/oil/refill' + (wasEmpty ? '?e=1' : ''));
        ok = statusOk(res);
      } catch (err) {
        ok = false;
      }
      try {
        const tel = await deviceRequest('/telemetry/get');
        state.telemetry = JSON.parse(tel.data);
        const oil = await deviceRequest('/settings/oil');
        state.oil = { ...JSON.parse(oil.data), supported: true };
      } catch (err) { /* связь пропала — страница покажет ошибку */ }
      return ok;
    },

    sendMode({state}, data) {
        state.mode.m = data.m
        state.mode = state.mode
        log("send Mode = ", state.mode)
        deviceRequest('/settings/mode', { method: 'POST', data: state.mode })
          .then((res) => {
            log(res)
          })
          .catch(() => {
            commandFailed(tr('error.command'))
            deviceRequest('/settings/mode')
              .then((response) => { state.mode = JSON.parse(response.data) })
              .catch(() => { /* связь отслеживает сторож */ })
          })
    },

    /** Система: поля из state.pending.system, отправка сразу (при уходе со страницы). */
    sendSystem({state}, data) {
      state.system = data
      state.system = state.system
      sendPending(state, 'system', '/settings/system',
        (system) => { state.system = system })
    },

    modeWork({state}, mode) {
      const path = MODE_PATHS[mode];
      if (!path) {
        log('modeWork: неизвестный режим %o', mode);
        return Promise.resolve();
      }
      // Promise возвращается: store.dispatch отдаёт его вызывающему, и тот может
      // дождаться ответа (system.svelte шлёт команду насоса только после
      // /state/pumping — прошивка выполняет её лишь в режиме прокачки).
      return deviceRequest(path)
      .catch(() => {
        // f7.alert не существует: было TypeError вместо сообщения пользователю.
        commandFailed(tr('error.nolink'))
      })
    },

    ctrlPump({state}, settings) {
      deviceRequest('/settings/pump/ctrl?state=' + (settings[0]>>0) + '&dir=' + settings[1], { method: 'POST', data: settings[2] })
      .then((res) => {
        log(res)
      })
      .catch(() => {
        commandFailed(tr('error.command'))
      })
    },

    ctrlBright({state}, data) {
      // Шаги ползунка — одним запросом после остановки (150 мс), а не каждый.
      deferSend('bright', () => {
        deviceRequest('/settings/bright?v='+ data, { method: 'POST' })
          .catch(() => {
            commandFailed(tr('error.nolink'))
          })
      }, 150)
    },

    fakeGPS({state}, data) {
      deviceRequest('/settings/fakegps?state='+(data>>0), { method: 'POST' })
      .catch(() => {
        commandFailed(tr('error.nolink'))
      })
    }
  },
})

export default store;
