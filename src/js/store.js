
import { createStore } from 'framework7/lite';
import websocketStore from './websocket.js';
import { f7 } from 'framework7-svelte';
import log from './debug.js'

let testURI = 'ws://db39b18be10d.ngrok.io'
let URI = testURI

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

const checkOnlineStatus = async () => {
  try {
    const online = await fetch("http://"+uri()+'/ping');
    return online.status >= 200 && online.status < 300; // either true or false
  } catch (err) {
    return false; // definitely offline
  }
};
const checkOnlineStatusTest = async () => {
  try {
    const online = await fetch('http://ya.ru');
    return true ;//online.status >= 200 && online.status < 300; // either true or false
  } catch (err) {
    return false; // definitely offline
  }
};

const wsStore = websocketStore('ws://' + uri() + '/ws', {}, [],
  {
    debug: false,
    reconnectionDelayGrowFactor: 1,
    maxReconnectionDelay: 6000,
    minReconnectionDelay: 3000,
    connectionTimeout: 2000,
  })

let timeoutId;

const store = createStore({
  state: {
    wsStore: wsStore,//websocketStore('ws://' + uri(), {"initial": 0}, [], {debug: true}),
    connect: false,
   // trigg_connect: false; // триггер изменения статуса подключения
    locale: window.navigator.userLanguage || window.navigator.language,
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

    gnssPresent: false,
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
      gps: false
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
          v: 110000  // Таймер, [мс]
        },
        { // 2 - pump
          v: 0,      // Количество включений насоса
        },
        { // 3 - mode
          m: 0, p: 0
        },
        { // 4 - gps
          fix: false,   // 3D Fix GPS
          sat: 0,       // Количество спутников
          lat: 0.000000,// Широта
          lon: 0.000000 // Долгота
        },
        { // 5 - voltage
          v: 0,       // Напряжение бортовое
          r: 4095,    // Разрешение АЦП
          max: 3.3,    // Максимальное напряжение на входе АЦП
          R1: 200000,
          R2: 49900
        },
      ]
    },
    verfs: "4.8",

    OILER_PUMPING: 3,
    OILER_SETTINGS: 2,
    OILER_MANUAL: 1,
    OILER_AUTO: 0,

/*     voltage: {
      max: 3.3,
      resolution: 4095
    } */
  },
  getters: {
    gnssPresent:  ({state}) => state.system,
    connected:    ({state}) => state.connect,
    //connected:    async () => await checkOnlineStatus(),

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
/*     telecard ({state}) {
      let md = state.telemetry.params[3].m
      if (md == 1) // Режим "Одометер"
        if (state.odometer.sensor.gnss) { // сенсор GPS?
          if (!state.telemetry.params[4].fix) md =  5 // TimerGPS
        }
      log("md = ", md)
      return md
    } */
  },
  actions: {
    init({state}) {

      log("INIT")

      //state.connect = true

      setInterval(async () => {
        const result = await checkOnlineStatus();
        state.connect = result
        log("CONNECT: ", state.connect)
        //state.connect = true
      }, 2000)

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
            //state.system.pn = Buffer.from(state.system.pn, 'base64').toString()
            if (!state.system.gps)
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
          f7.request.get('http://' + uri() + '/telemetry/start')
            .then((res)=> {
              setTimeout(() => {
                f7.request.get('http://' + uri() + '/telemetry/stop')
              }, 1000)
            })
            .catch((err) => { /* state.connect = false */ })
        }
        log("ONLINE = ", online)
      });

      wsStore.subscribe((value) => {
        log('[ws value]=> ', value)

        if (value) {
          if (value.id == 'telemetry') {
            state.telemetry = value
            log('Telemetry: ', state.telemetry)
          }
          log('Store state', state)
      }
/*       if (value.type == 'error') {
        state.ver = JSON.parse(localStorage.getItem('ver'))
        // парсинг версии
        if (state.ver) {
          let fs = state.ver.fw.slice(-2);
          state.verfs = fs.match(/\d{1}/g).join('.');
        }
      } */
    })
    },

    async getMode({state}) {
      //(async () => {
        const online = await checkOnlineStatus();
        if (online) {
          f7.request.get('http://' + uri() + '/settings/mode')
            .then((response) => { state.mode = JSON.parse(response.data) })
        }
      //})()
    },
//     getSettings({state}){
// /*       f7.request.get('http://' + uri() + '/trip').then((response) => { state.odometer = JSON.parse(response.data) });
//       f7.request.get('http://' + uri() + '/time').then((response) => { state.timer = JSON.parse(response.data) });
//       f7.request.get('http://' + uri() + '/manual').then((response) => { state.manual = JSON.parse(response.data) });
//       f7.request.get('http://' + uri() + '/pump').then((response) => { state.pump = JSON.parse(response.data) }); */
//     },
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
      wsStore.set({cmd: "get", param: ["gnss"]})
      log('requestGNSS')
    },
/*     requestTelemetry({state}) {
      //wsStore.set({cmd: "telemetry"})
      f7.request.get('http://192.168.4.1/telemetry/start')
        .then((res)=> {
            log('192.168.4.1/telemetry = ', res.data)
            state.telemetry = JSON.parse(res.data)
          }
        )
        .catch((err) => {
          log(err)
        })
    }, */
    async requestTelemetryStart({state}) {
      //wsStore.set({cmd: "telemetry"})
      const online = await checkOnlineStatus();
      if (online) {
        f7.request.get('http://' + uri() + '/telemetry/start')
      }
    },
    async requestTelemetryStop({state}) {
      //wsStore.set({cmd: "telemetry"})
      const online = await checkOnlineStatus();
      if (online) {
        f7.request.get('http://' + uri() + '/telemetry/stop')
      }
    },
    requestConfig ({state}, settings) {
      wsStore.set({cmd: "get", param: settings})
    },
  // TODO: проверить правильность заполнения поля imp_m
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
    // TODO: add rest api
    sendDistance({state}, data) {
      state.odometer = data
      state.odometer = state.odometer
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
//        wsStore.set({cmd: "post", param: [state.odometer.id, Object.fromEntries(state.mapSettings)]}); // отправляем в БУ
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
      }, 2000)

    },
        // TODO: add rest api
    sendTime({state}, data) {
      state.timer = data
      state.timer = state.timer
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        //wsStore.set({cmd: "post", param: [state.timer.id, Object.fromEntries(state.mapSettings)]})
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
      }, 2000)
    },
        // TODO: add rest api
    sendManual({state}, data) {
      state.manual = data
      state.manual = state.manual
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
          //wsStore.set({cmd: "post", param: [state.manual.id, state.manual]});
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
      }, 2000)
    },
        // TODO: add rest api
    sendPump({state}, data) {
      //console.log("sendPump: ", prop)
      state.pump = data;
      state.pump = state.pump;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
          //wsStore.set({cmd: "post", param: [state.pump.id, {dpms: data.dpms}]}); // отправляем в БУ только свойство dpms
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
      }, 2000);

    },
    sendMode({state}, data) {
        state.mode.m = data.m
        state.mode = state.mode
        //wsStore.set({cmd: "post", param: [state.mode.id, {m: data.m}]}) // отправляем в БУ только свойство m
        log("send Mode = ", state.mode)
        //log("uri = ", uri())
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
/*         f7.request({
          url: 'http://192.168.4.1/mode',
          method: 'POST',
          data: state.mode,
          dataType: 'json',
          contentType: 'application/json',
          //crossDomain: true,
          error: function(err) {
            f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
            f7.request.get('http://192.168.4.1' + '/mode')
              .then((response) => { state.mode = JSON.parse(response.data) })
              .catch((err) => { state.connect = false })
          }
        }) */

     // }
    },

    sendSystem({state}, data) {
      state.system = data
      state.system = state.system
      //wsStore.set({cmd: "post", param: [state.system.id, Object.fromEntries(state.mapSettings)]}) // TODO проверить!
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
        // /state/ctrl, /state/auto
    modeWork({state}, mode) {
      //state.wsStore.set({cmd: "work", param: mode})
      let rest_str;
      if (mode == store.state.OILER_AUTO) {
        rest_str = '/state/auto'
      }
      if (mode == store.state.OILER_SETTINGS) {
        rest_str = '/state/ctrl'
      }
      if (mode == store.state.OILER_PUMPING) {
        rest_str = '/state/pumping'
      }
      f7.request.get('http://' + uri() + rest_str)
      .catch(() => {
        f7.alert('Нет связи с блоком управеления. Команда не выполнена','Cosmoiler')
      })
    },
        // /pump/ctrl?state=1[0]&dir=1[0]
    ctrlPump({state}, settings) {
      state.wsStore.set({cmd: "pump", param: settings})
      f7.request.postJSON('http://' + uri() + '/pump/ctrl?state=' + (settings[0]>>0) + '&dir=' + settings[1], settings[2])
      .then((res) => {
        log(res)
      })
      .catch((err) => {
        f7.dialog.alert("Команда не выполнена!", "Cosmoiler")
      })
    },
        //(POST /bright?v=X)
    ctrlBright({state}, data) {
      //state.wsStore.set({cmd: "bright", param: data})
      f7.request.post('http://' + uri() + '/settings/bright?v='+ data)
        .catch(() => {
          f7.alert('Нет связи с блоком управеления. Команда не выполнена.','Cosmoiler')
        })
    },
/*     cmdUpdate({state}) {
      state.wsStore.set({cmd: "update"})
    }, */
/*     cmdReset({state}) {
      state.wsStore.set({cmd: "resetCnfg"})
    } */
  },
})

export default store;
