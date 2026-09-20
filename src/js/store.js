
import { createStore } from 'framework7/lite';
import { f7 } from 'framework7-svelte';
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
// Связь измеряется НЕ «пингом по расписанию», а временем последнего УСПЕШНОГО
// ответа устройства (lastOkAt). Любой запрос это время обновляет, поэтому
// отдельный зонд уходит только когда реального трафика нет: на вкладке
// телеметрии (опрос 500 мс) лишних запросов не появляется вовсе, а на пустой
// странице зонд идёт не чаще, чем раньше шёл /ping.
// ---------------------------------------------------------------------------

/** Период тика сторожа. Сам тик сети не трогает — только читает время. */
const WATCHDOG_MS = 500;
/** Простой, после которого отправляется зонд GET /ping. */
const PROBE_IDLE_MS = 1000;
/** Молчание, после которого связь считается потерянной. */
const LINK_LOST_MS = 2000;
/**
 * Таймаут запроса к устройству. Без него «зависший» запрос висит до
 * системного таймаута TCP (десятки секунд), и сторож не может отличить
 * «устройство мертво» от «устройство медленное» — интерфейс не реагирует на
 * потерю связи.
 */
const DEVICE_TIMEOUT_MS = 1500;

/** Время последнего успешного ответа устройства (0 = ещё ни одного). */
let lastOkAt = 0;
/** Текущее представление о связи — чтобы не писать в state на каждом тике. */
let linkDown = true;
let probeInFlight = false;
let watchdogTimer = 0;

/** Отметка успешного обмена — продлевает «жизнь» связи. */
function markOk() {
  lastOkAt = Date.now();
}

/**
 * Запрос к устройству: таймаут + отметка успеха для сторожа.
 *
 * Обращаться к устройству следует через эту функцию, а не через f7.request
 * напрямую: иначе запрос не продлит lastOkAt и заставит сторож слать лишние
 * зонды. Полная форма f7.request({...}) нужна потому, что сокращённые вызовы
 * (f7.request.get/post) опций не принимают — второй аргумент у них это data.
 */
function deviceRequest(path, options) {
  return f7.request(Object.assign({
    url: 'http://' + uri() + path,
    method: 'GET',
    timeout: DEVICE_TIMEOUT_MS,
  }, options)).then((response) => {
    markOk();
    return response;
  });
}

/** Разовая проверка связи (зонд и проверка перед загрузкой настроек). */
const checkOnlineStatus = async () => {
  try {
    await deviceRequest('/ping');
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Один зонд. Больше одного запроса «в полёте» не держим: иначе зонды начнут
 * конкурировать за сокеты httpd (на устройстве max_open_sockets = 6).
 */
function probeOnce() {
  if (probeInFlight) return;
  probeInFlight = true;
  const done = () => { probeInFlight = false; };
  deviceRequest('/ping').then(done, done);
}

/** Единственное место, где меняется state.connect. */
function setLink(state, down) {
  if (down === linkDown) return;
  linkDown = down;
  state.connect = !down;
  log("CONNECT: ", !down);
}

/** Тик сторожа: только чтение времени (+ зонд, если давно нет трафика). */
function watchdogTick(state) {
  const silent = Date.now() - lastOkAt;
  // Когда сеть у самого телефона пропала, зондировать бессмысленно.
  if (silent > PROBE_IDLE_MS && navigator.onLine !== false) probeOnce();
  setLink(state, silent > LINK_LOST_MS);
}

function startWatchdog(state) {
  if (watchdogTimer) return; // идемпотентно

  // Потеря Wi-Fi — самый частый случай (устройство выключили/перезагрузили,
  // вышли из зоны AP). Это видно мгновенно и бесплатно, без единого запроса.
  window.addEventListener('offline', () => {
    lastOkAt = 0;
    setLink(state, true);
  });
  // «online» НЕ означает, что устройство снова доступно, поэтому связь не
  // объявляем восстановленной, а лишь сразу шлём зонд.
  window.addEventListener('online', () => probeOnce());

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

      // Таймаут по умолчанию для запросов к устройству (см. deviceRequest).
      // Ставится здесь, а не на уровне модуля: на момент импорта store.js
      // экземпляр f7 ещё не создан — его устанавливает framework7-svelte при
      // инициализации App. Исключение — загрузка прошивки с cosmoiler.ru: там
      // явно указан timeout: 0, иначе большой файл не успеет скачаться.
      f7.request.setup({ timeout: DEVICE_TIMEOUT_MS });

      // Вместо «пинга по расписанию» — сторож времени последнего успешного
      // ответа (см. блок «Контроль связи» выше). Он сам решает, когда нужен зонд.
      startWatchdog(state);

      window.addEventListener("load", async (event) => {
        //const statusDisplay = document.getElementById("status");
        const online = await checkOnlineStatus()
        if (online) {
          f7.request.get('http://' + uri() + '/settings/mode').then((response) => { state.mode = JSON.parse(response.data) });
          f7.request.get('http://' + uri() + '/settings/trip').then((response) => { state.odometer = JSON.parse(response.data) });
          f7.request.get('http://' + uri() + '/settings/time').then((response) => {
            state.timer = JSON.parse(response.data)
            state.timer.presets.splice(1, 0, { time: 0, num: 0, cycles: 0 })
          });
          f7.request.get('http://' + uri() + '/settings/manual').then((response) => { state.manual = JSON.parse(response.data) });
          f7.request.get('http://' + uri() + '/settings/pump').then((response) => { state.pump = JSON.parse(response.data) });
          f7.request.get('http://' + uri() + '/settings/system').then((response) => {
            state.system = JSON.parse(response.data)
            if (ToBoolean(state.system.gps) == false)
              state.odometer.sensor.gnss = false
          });
          f7.request.get('http://' + uri() + '/settings/ver')
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
          f7.request.get('http://' + uri() + '/telemetry/get')
            .then((response)=> {
              state.telemetry = JSON.parse(response.data)
            })
            .catch((err) => { /* state.connect = false */ })
        }
        log("ONLINE = ", online)
      });

/*       wsStore.subscribe((value) => {
        //log('[ws value]=> ', value)

        if (value) {
          if (value.id == 'telemetry') {
            state.telemetry = value
            log('Telemetry: ', state.telemetry)
          }
          log('Store state', state)
        }
      }) */
    },

    async getMode({state}) {
        const online = await checkOnlineStatus();
        if (online) {
          f7.request.get('http://' + uri() + '/settings/mode')
            .then((response) => { state.mode = JSON.parse(response.data) })
        }
    },

    async getServiceInfo({state}) {
      log("getServiceInfo")
      //async () => {
        const online = await checkOnlineStatus();
        if (online) {
          f7.request.get('http://' + uri() + '/settings/system').then((response) => {
            state.system = JSON.parse(response.data)
            if (!state.system.gps) state.odometer.sensor.gnss = false
          });
          f7.request.get('http://' + uri() + '/settings/ver')
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
        f7.request.postJSON('http://' + uri() + '/settings/trip', Object.fromEntries(state.mapSettings))
        .then((res) => {
          log(res)
        })
        .catch((err) => {
          f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
          f7.request.get('http://' + uri() + '/settings/trip')
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
        f7.request.postJSON('http://' + uri() + '/settings/time', Object.fromEntries(state.mapSettings))
        .then((res) => {
          log(res)
        })
        .catch((err) => {
          f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
          f7.request.get('http://' + uri() + '/settings/time')
            .then((response) => { state.odometer = JSON.parse(response.data) })
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
          f7.request.postJSON('http://' + uri() + '/settings/manual', state.manual)
          .then((res) => {
            log(res)
          })
          .catch((err) => {
            f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
            f7.request.get('http://' + uri() + '/settings/manual')
              .then((response) => { state.odometer = JSON.parse(response.data) })
          })
          state.fChngSettings = { status: true, id: [...new Set([...state.fChngSettings.id, state.manual.id])]};
          log("send Pump = ", state.manual);
      })
    },

    sendPump({state}, data) {
      state.pump = data;
      state.pump = state.pump;
      deferSend('pump', () => {
          f7.request.postJSON('http://' + uri() + '/settings/pump', {dpms: data.dpms})
          .then((res) => {
            log(res)
          })
          .catch((err) => {
            f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
            f7.request.get('http://' + uri() + '/settings/pump')
              .then((response) => { state.odometer = JSON.parse(response.data) })
          })
          state.fChngSettings = { status: true, id: [...new Set([...state.fChngSettings.id, state.pump.id])]};
          log("send Pump = ", state.pump);
      });

    },

    sendMode({state}, data) {
        state.mode.m = data.m
        state.mode = state.mode
        log("send Mode = ", state.mode)
        f7.request.postJSON('http://' + uri() + '/settings/mode', state.mode)
          .then((res) => {
            log(res)
          })
          .catch((err) => {
            f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
            f7.request.get('http://' + uri() + '/settings/mode')
              .then((response) => { state.mode = JSON.parse(response.data) })
              .catch((err) => { /* state.connect = false */ })
          })
    },

    sendSystem({state}, data) {
      state.system = data
      state.system = state.system
      f7.request.postJSON('http://' + uri() + '/settings/system', Object.fromEntries(state.mapSettings))
      .then((res) => {
        log(res)
      })
      .catch((err) => {
        f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
        f7.request.get('http://' + uri() + '/settings/system')
          .then((response) => { state.odometer = JSON.parse(response.data) })
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
      f7.request.get('http://' + uri() + rest_str)
      .catch(() => {
        // f7.alert не существует: было TypeError вместо сообщения пользователю.
        f7.dialog.alert('Нет связи с блоком управеления. Команда не выполнена', 'Cosmoiler')
      })
    },

    ctrlPump({state}, settings) {
      f7.request.postJSON('http://' + uri() + '/settings/pump/ctrl?state=' + (settings[0]>>0) + '&dir=' + settings[1], settings[2])
      .then((res) => {
        log(res)
      })
      .catch((err) => {
        f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
      })
    },

    ctrlBright({state}, data) {
      f7.request.post('http://' + uri() + '/settings/bright?v='+ data)
        .catch(() => {
          f7.dialog.alert('Нет связи с блоком управеления. Команда не выполнена.', 'Cosmoiler')
        })
    },

    fakeGPS({state}, data) {
      f7.request.post('http://' + uri() + '/settings/fakegps?state='+(data>>0))
      .catch(() => {
        f7.dialog.alert('Нет связи с блоком управеления. Команда не выполнена.', 'Cosmoiler')
      })
    }
  },
})

export default store;
