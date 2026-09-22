
import { createStore } from 'framework7/lite';
import { f7 } from 'framework7-svelte';
import { request } from './http.js';
import log from './debug.js'

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
    markOk();
    return response;
  });
}

/** Разовая проверка связи (перед загрузкой настроек). */
const checkOnlineStatus = async () => {
  try {
    await deviceRequest('/ping', { timeout: PROBE_TIMEOUT_MS });
    return true;
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
  deviceRequest('/ping', { timeout: PROBE_TIMEOUT_MS }).then(ok, fail);
}

/** Единственное место, где меняется state.connect. */
function setLink(state, down) {
  // Отладка: связь объявлена постоянной, сторож не имеет права её гасить.
  if (FORCE_CONNECTED) down = false;
  if (down === linkDown) return;
  linkDown = down;
  state.connect = !down;
  log("CONNECT: ", !down);
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
}

function startWatchdog(state) {
  if (watchdogTimer) return; // идемпотентно

  // ! Отладка: сторож не нужен вовсе — связь объявлена постоянной. Заодно
  // исчезают зонды и их шум в консоли (без блока каждый /ping всё равно
  // кончается таймаутом). Эта ветка есть только в dev-сборке.
  if (FORCE_CONNECTED) {
    log("DEBUG: FORCE_CONNECTED — связь с устройством объявлена постоянной (import.meta.env.DEV)");
    linkDown = false;
    state.connect = true;
    return;
  }

  // Потеря Wi-Fi — самый частый случай (устройство выключили/перезагрузили,
  // вышли из зоны AP). Это видно мгновенно и бесплатно, без единого запроса.
  window.addEventListener('offline', () => {
    lastOkAt = 0;
    probeFailures = LINK_LOST_AFTER;
    setLink(state, true);
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

const store = createStore({
  state: {
    telemetryInterval: 0,
    connect: false,
   // trigg_connect: false; // триггер изменения статуса подключения
    locale: (navigator.userLanguage || navigator.language || navigator.systemLanguage),
    /**
     * ! Флаг изменения настроек
     * status {false, true}: true - настройки были изменены, false - не было измененений
     * id:
     * settings: имя ключа в объекте (массив объектов: ключ:значение)
     *
     */
    fChngSettings: {status: false, id: []},
    /**
     * ! Данные настроек */
    mapSettings: new Map(),

    //gnssPresent: false,
    mode: {
      id: "/mode.json",
      m: 0,
      p: 0
    },
    odometer: {
      id: "/trip.json",
      smart: { predict: 5, avgsp: 80, maxsp: 150 },
      sensor: { gnss: true, imp: 16, hdop: 5000 },
      presets: [
          { dst_m: 4000, num: 2, imp_m: 0, n: 5, cycles: 0 },
          { dst_m: 7000, num: 5, imp_m: 0, n: 10, cycles: 0 },
          { dst_m: 3000, num: 1, imp_m: 0, n: 3, cycles: 0 }
      ],
      wheel: { d: 17, w: 150, h: 70, l: 2016 }
    },
    timer: {
      id: "/time.json",
      smart: { trail: true, predict: 600 },
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
      usr: false // пользовательский насос
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
          v: 0,     // Одометр
          dst: 0,   // Оставшееся расстояние до вкл насоса [м]
          spd: 0,   // Скорость
          maxsp: 0, // Максимальная скорость
          avgsp: 0  // Средняя скорость
        },
        { // 1 - timer
          v: 110000,  // Таймер, [мс]
          max: 110000 // Интервал таймера, [мс]
        },
        { // 2 - pump
          v: 0,      // Количество включений насоса
        },
        { // 3 - mode
          m: 0, p: 0
        },
        { // 4 - gps
          fix: false,   // 3D Fix GPS
          fake: false,  // Признак спуффинга GPS сигнала
          sat: 0,       // Количество спутников
          lat: 0.000000,// Широта
          lon: 0.000000 // Долгота
        },
        { // 5 - voltage
          v: 0,       // Напряжение бортовое [мс]
          r: 4095,    // Разрешение АЦП
          max: 3.3,    // Максимальное напряжение на входе АЦП [В]
          R1: 200000,
          R2: 49900
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
    telemetry:    ({state}) => state.telemetry,
    mode:         ({state}) => state.mode,
    system:       ({state}) => state.system,
    ver:          ({state}) => state.ver,
    verfs:        ({state}) => state.verfs,
    chngSettings: ({state}) => state.fChngSettings,
    mapSettings:  ({state}) => state.mapSettings,
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

      // Вместо «пинга по расписанию» — сторож времени последнего успешного
      // ответа (см. блок «Контроль связи» выше). Он сам решает, когда нужен зонд.
      startWatchdog(state);

      /**
       * Начальная загрузка настроек с устройства.
       *
       * Вынесено в функцию, потому что полагаться на событие load на window
       * нельзя: init() вызывается из f7ready() внутри onMount, и если к этому
       * моменту страница успела догрузиться (кеш браузера, быстрый старт,
       * повторное открытие вкладки), событие load уже прошло — подписка на него
       * не сработала бы НИКОГДА и настройки не загрузились бы вовсе.
       */
      async function loadInitialSettings() {
        //const statusDisplay = document.getElementById("status");
        const online = await checkOnlineStatus()
        if (online) {
          deviceRequest('/settings/mode').then((response) => { state.mode = JSON.parse(response.data) });
          deviceRequest('/settings/trip').then((response) => { state.odometer = JSON.parse(response.data) });
          deviceRequest('/settings/time').then((response) => {
            state.timer = JSON.parse(response.data)
            state.timer.presets.splice(1, 0, { time: 0, num: 0, cycles: 0 })
          });
          deviceRequest('/settings/manual').then((response) => { state.manual = JSON.parse(response.data) });
          deviceRequest('/settings/pump').then((response) => { state.pump = JSON.parse(response.data) });
          deviceRequest('/settings/system').then((response) => {
            state.system = JSON.parse(response.data)
            if (ToBoolean(state.system.gps) == false)
              state.odometer.sensor.gnss = false
          });
          deviceRequest('/settings/ver')
            .then((response) => {
              state.ver = JSON.parse(response.data)
              localStorage.setItem('ver', response.data)
              // парсинг версии
              let fs = state.ver.fw.slice(-2);
              state.verfs = fs.match(/\d{1}/g).join('.');
            })
            .catch((err) => {
              state.ver = JSON.parse(localStorage.getItem('ver'))
              // парсинг версии
              if (state.ver) {
                let fs = state.ver.fw.slice(-2);
                state.verfs = fs.match(/\d{1}/g).join('.');
              }
            });
          deviceRequest('/telemetry/get')
            .then((response)=> {
              state.telemetry = JSON.parse(response.data)
            })
            .catch((err) => { /* state.connect = false */ })
        }
        log("ONLINE = ", online)
      }

      // Ждать load всё же стоит: браузер грузит index.html, app.css, app.js,
      // шрифт и иконку — это до шести параллельных соединений, ровно предел
      // httpd на устройстве (max_open_sockets = 6). Ещё семь запросов настроек
      // вдобавок к этому попали бы под lru_purge_enable и могли помешать
      // загрузке страницы.
      //
      // document.readyState === 'complete' — это и есть «load уже отгремел».
      if (document.readyState === 'complete') {
        loadInitialSettings();
      } else {
        window.addEventListener("load", loadInitialSettings);
      }
    },

    async getMode({state}) {
        const online = await checkOnlineStatus();
        if (online) {
          deviceRequest('/settings/mode')
            .then((response) => { state.mode = JSON.parse(response.data) })
        }
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
          deviceRequest('/settings/ver')
            .then((response) => {
              state.ver = JSON.parse(response.data)
              localStorage.setItem('ver', response.data)
              // парсинг версии
              let fs = state.ver.fw.slice(-2);
              state.verfs = fs.match(/\d{1}/g).join('.');
            })
            .catch((err) => {
              state.ver = JSON.parse(localStorage.getItem('ver'))
              // парсинг версии
              let fs = state.ver.fw.slice(-2);
              state.verfs = fs.match(/\d{1}/g).join('.');
            });
        }
      //}
    },

    requestGNSS({state}) {
      //wsStore.set({cmd: "get", param: ["gnss"]})
      log('requestGNSS')
    },

    requestTelemetryStart({state}) {
      // Идемпотентно. Раньше при повторном pageTabShow создавался ЕЩЁ один
      // интервал, а ссылка на предыдущий терялась (перезапись без
      // clearInterval) — опрос начинал идти несколькими циклами сразу, и
      // остановить их requestTelemetryStop уже не мог.
      clearInterval(state.telemetryInterval);
      state.telemetryInterval = 0;

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
      deviceRequest('/telemetry/get')
        .then((response) => {
          state.telemetry = JSON.parse(response.data)
        })
        .catch((err) => {
          /* связь отслеживает сторож по lastOkAt */
        })

      state.telemetryInterval = setInterval(() => {
        // В скрытой вкладке опрос не нужен: реагировать некому, а устройство
        // обслуживает запросы одной задачей — лишний трафик только мешает.
        if (document.hidden) return;
        deviceRequest('/telemetry/get')
          .then((response) => {
            state.telemetry = JSON.parse(response.data)
          })
          .catch((err) => { /* связь отслеживает сторож по lastOkAt */ })
      }, 500)
    },

    requestTelemetryStop({state}) {
      clearInterval(state.telemetryInterval);
      state.telemetryInterval = 0;
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

    sendDistance({state}, data) {
      state.odometer = data
      state.odometer = state.odometer
      deferSend('trip', () => {
        deviceRequest('/settings/trip', { method: 'POST', data: Object.fromEntries(state.mapSettings) })
        .then((res) => {
          log(res)
        })
        .catch((err) => {
          commandFailed("Команда не выполнена!")
          deviceRequest('/settings/trip')
            .then((response) => { state.odometer = JSON.parse(response.data) })
        })
        state.mapSettings.clear();
        log("ws send: ", {cmd: "post", param: [state.odometer.id, Object.fromEntries(state.mapSettings)]})
                                                          // Данная запись прдотвращает попадание в массив повторяющихся значений id
        state.fChngSettings = { status: true, id: [...new Set([...state.fChngSettings.id, state.odometer.id])]};
        log("send Dist = ", state.odometer)
      })

    },

    sendTime({state}, data) {
      state.timer = data
      state.timer = state.timer
      deferSend('time', () => {
        deviceRequest('/settings/time', { method: 'POST', data: Object.fromEntries(state.mapSettings) })
        .then((res) => {
          log(res)
        })
        .catch((err) => {
          commandFailed("Команда не выполнена!")
          // ! Было state.odometer: данные таймера затирали одометр.
          deviceRequest('/settings/time')
            .then((response) => { state.timer = JSON.parse(response.data) })
        })
        state.mapSettings.clear()
        state.fChngSettings = { status: true, id: [...new Set([...state.fChngSettings.id, state.timer.id])]}
        log("send Time = ", state.timer)
      })
    },

    sendManual({state}, data) {
      state.manual = data
      state.manual = state.manual
      deferSend('manual', () => {
          deviceRequest('/settings/manual', { method: 'POST', data: state.manual })
          .then((res) => {
            log(res)
          })
          .catch((err) => {
            commandFailed("Команда не выполнена!")
            // ! Было state.odometer: данные manual затирали одометр.
            deviceRequest('/settings/manual')
              .then((response) => { state.manual = JSON.parse(response.data) })
          })
          state.fChngSettings = { status: true, id: [...new Set([...state.fChngSettings.id, state.manual.id])]};
          log("send Pump = ", state.manual);
      })
    },

    sendPump({state}, data) {
      state.pump = data;
      state.pump = state.pump;
      deferSend('pump', () => {
          deviceRequest('/settings/pump', { method: 'POST', data: {dpms: data.dpms} })
          .then((res) => {
            log(res)
          })
          .catch((err) => {
            commandFailed("Команда не выполнена!")
            // ! Было state.odometer: данные насоса затирали одометр.
            deviceRequest('/settings/pump')
              .then((response) => { state.pump = JSON.parse(response.data) })
          })
          state.fChngSettings = { status: true, id: [...new Set([...state.fChngSettings.id, state.pump.id])]};
          log("send Pump = ", state.pump);
      });

    },

    sendMode({state}, data) {
        state.mode.m = data.m
        state.mode = state.mode
        log("send Mode = ", state.mode)
        deviceRequest('/settings/mode', { method: 'POST', data: state.mode })
          .then((res) => {
            log(res)
          })
          .catch((err) => {
            commandFailed("Команда не выполнена!")
            deviceRequest('/settings/mode')
              .then((response) => { state.mode = JSON.parse(response.data) })
              .catch((err) => { /* state.connect = false */ })
          })
    },

    sendSystem({state}, data) {
      state.system = data
      state.system = state.system
      deviceRequest('/settings/system', { method: 'POST', data: Object.fromEntries(state.mapSettings) })
      .then((res) => {
        log(res)
      })
      .catch((err) => {
        commandFailed("Команда не выполнена!")
        // ! Было state.odometer: данные system затирали одометр.
        deviceRequest('/settings/system')
          .then((response) => { state.system = JSON.parse(response.data) })
      })
      state.mapSettings.clear()
      state.fChngSettings = { status: true, id: [...new Set([...state.fChngSettings.id, state.system.id])]}
      log("send System = ", state.system)
    },

    modeWork({state}, mode) {
      let rest_str;
      if (mode == store.state.OILER_AUTO) {
        rest_str = '/state/auto'
      }
      if (mode == store.state.OILER_VISCOSITY) {
        rest_str = '/state/ctrl'
      }
      if (mode == store.state.OILER_PUMPING) {
        rest_str = '/state/pumping'
      }
      if (mode == store.state.OILER_TRAINING) {
        rest_str = '/state/training'
      }
      deviceRequest(rest_str)
      .catch(() => {
        // f7.alert не существует: было TypeError вместо сообщения пользователю.
        commandFailed('Нет связи с блоком управеления. Команда не выполнена')
      })
    },

    ctrlPump({state}, settings) {
      deviceRequest('/settings/pump/ctrl?state=' + (settings[0]>>0) + '&dir=' + settings[1], { method: 'POST', data: settings[2] })
      .then((res) => {
        log(res)
      })
      .catch((err) => {
        commandFailed("Команда не выполнена!")
      })
    },

    ctrlBright({state}, data) {
      deviceRequest('/settings/bright?v='+ data, { method: 'POST' })
        .catch(() => {
          commandFailed('Нет связи с блоком управеления. Команда не выполнена.')
        })
    },

    fakeGPS({state}, data) {
      deviceRequest('/settings/fakegps?state='+(data>>0), { method: 'POST' })
      .catch(() => {
        commandFailed('Нет связи с блоком управеления. Команда не выполнена.')
      })
    }
  },
})

export default store;
