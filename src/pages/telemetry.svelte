<Page
  name="telemetry"
  class={`page`}
  onPageTabShow={pageTabShow}
  onPageTabHide={pageTabHide}>

  <Navbar title={$t('home.telemetry')} />
  <!-- <Button on:click={() => { store.state.connect =  !store.state.connect}}>Connect = {store.state.connect}</Button> -->

{#if !connected}
<!--   <div transition:fade="{{delay: 250, duration: 30}}"> -->
  <div in:fade="{{delay: 50, duration: 300}}" out:fly="{{duration: 300}}">
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
  </div>
{:else}
<!--   <CardTelemetry {...dataCardTele[telemetry.params[3].m]}  /> -->
<div in:fade="{{delay: 50, duration: 300}}" out:fly="{{duration: 300}}">
    <CardTelemetry {...dataCardTele[md]}  />
    <!-- ! Остаток масла в бачке (params[6], firmware docs/oil.md) — во всех режимах.
         Перенесён со страницы «Масло» в настройках (решение пользователя 28.09.2026):
         это показание, а не настройка. У прошивки без учёта масла params[6] нет —
         карточки нет. -->
    <!-- ! Устроена как карточка режима (tele-card.svelte, «Одометр»): бежевые
         заголовок и подвал, белое содержимое. Заголовок — «ОСТАТОК» и процент,
         содержимое — шкала (и «мало масла»), подвал — оценка пробега. Красный
         при «мало масла» — классом (--state-bad-color), а не инлайн-стилем. -->
    {#if oilTele}
    <Card class='elevation-3'>
      <CardHeader class={`card-header-tele`}>
        <span>{$t('settings.oil.remains').toUpperCase()}</span>
        <span class="oil-card__pct" class:oil-card__low={oilTele.low == 1}>{oilTele.oil} %</span>
      </CardHeader>
      <CardContent padding={true}>
        <OilLevel oil={oilTele.oil} low={oilTele.low} />
        {#if oilTele.low == 1}
          <p class="oil-card__low oil-card__low-text">{$t('settings.oil.low')}</p>
        {/if}
      </CardContent>
      <CardFooter class="card-footer-tele oil-card__footer">
        <div class="card-footer-tele__icon-text oil-card__item">
          <Icon icon="icon-addoil" class={`card-footer-tele__icon${oilTele.low == 1 ? ' card-footer-tele__icon--bad' : ''}`} />
          <span class="oil-card__km">
            {oilTele.km >= 0 ? $t('settings.oil.km', {values: {p: oilTele.km}}) : $t('settings.oil.km.unknown')}
          </span>
        </div>
      </CardFooter>
    </Card>
    {/if}
  </div>
{/if}


</Page>

<script>
  import {
    Page,
    Navbar,
    BlockTitle,
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    Icon,
    useStore
  } from 'framework7-svelte';
  import {t} from '../services/i18n.js';
  import CardTelemetry from '../components/tele-card.svelte'
  import OilLevel from '../components/oil-level.svelte'
  import store from '../js/store';
  import { fade, fly } from 'svelte/transition';
  import log from '../js/debug.js'

  let telemetry = useStore('telemetry', (value) => telemetry = value)
  let odometer = useStore('odometer', (value) => odometer = value)
  let timer = useStore('timer', (value) => timer = value)
  let gnssPresent = useStore('gnssPresent', (value) => gnssPresent = value)
  let connected = useStore('connected', (value) => connected = value);
  let oil = useStore('oil', (value) => oil = value);

  // ! Микропорции (oil.micro, docs/oil.md): params[0].dst — сколько метров до
  //   следующей порции, а не остаток участка пресета; шкала — до 2 км (порция
  //   без учёта времени езды набирается за ~2 км). Вместо расстояния/времени
  //   пресета у иконки пресета — доза (ручка «меньше/больше»).
  const MICRO_SCALE_M = 2000
  //   Ручки дозы раздельные (прошивка с 01.10.2026): одометр — smart.lvl одометра,
  //   он же действует в TimerGps («таймер без спутников» внутри «ПО ПРОБЕГУ»);
  //   «ПО ВРЕМЕНИ» — smart.lvl таймера.
  let doseText = (lvl) => {
    const v = Number(lvl) || 0
    return $t('home.setting.dose', {values: {p: (v > 0 ? '+' : '') + v}})
  }
  let presetValueOdo = (telemetry) => oil.micro
    ? doseText(odometer.smart.lvl)
    : (odometer.presets[indexPreset(telemetry)].dst_m/1000).toFixed() + $t("all.km")
  let presetValueTmr = (telemetry) => oil.micro
    ? doseText(timer.smart.lvl)
    : timer.presets[indexPreset(telemetry)].time + $t("all.seconds")
  // TimerGps: без микропорций — время пресета таймера (как было), с ними — ручка одометра.
  let presetValueTmrGps = (telemetry) => oil.micro
    ? doseText(odometer.smart.lvl)
    : presetValueTmr(telemetry)
  let remainsScale = (telemetry) => oil.micro
    ? Math.min(remainsTrip(odometer, gnssPresent.gps, telemetry.params[nameParams.ODOMETER]) / MICRO_SCALE_M, 1)
    : remainsTrip(odometer, gnssPresent.gps, telemetry.params[nameParams.ODOMETER])/odometer.presets[indexPreset(telemetry)].dst_m


  const MAXSPEED = 250
  const iconsPreset = ["icon-city", "icon-way", "icon-off-road"]
  const nameParams = {
    ODOMETER: 0,
    TIMER: 1,
    PUMP: 2,
    MODE: 3,
    GPS: 4,
    VOLTAGE: 5,
    OIL: 6
  }

  // Остаток масла в бачке (params[6], прошивка с 27.09.2026, docs/oil.md) —
  // отдельная карточка под карточкой режима. У старой прошивки элемента нет.
  $: oilTele = telemetry.params[nameParams.OIL]

  let valueTimer = (data) => {
    let  myDate = new Date(0, 0, 0, 0, 0, 0, data.v);
    return myDate.toTimeString().replace(/.*(\d{2}:\d{2}).*/, "$1");
  }

  let remainsTrip = (odometer, gnssPresent, params) => {
    return params.dst
    if (!odometer.sensor.gnss || !gnssPresent) {
      let imp = params.imp;
      let sensor = odometer.sensor.imp;
      let lwhl = odometer.wheel.l;
      return Number(((imp * lwhl) / sensor) / 1000).toFixed(0);
    }
    else {
      return params.dst;
    }
  }

  let voltage = (data) => {
    return Number(data.v/1000).toFixed(1);
  }

  let voltAlarm = (data) => {
    if (data <= 11.3) return true
    if (data > 11.9 && data <= 14.8) return false
    if (data > 14.8) return true
  }

  /**
   * ! Значок GPS с числом спутников и цветом по вердикту ГНСС (params[4].q,
   * прошивка — docs/telemetry.md §5): 'bad' (красный) — недостоверно или
   * подмена; без цвета — нет фикса; 'warn' (янтарный) — сомнительно; 'ok'
   * (зелёный) — достоверно. Порядок проверок важен: вердикт в прошивке
   * переживает потерю фикса, поэтому «достоверно» без фикса — это «нет фикса»,
   * а Bad сам снимает fix — поэтому красный проверяется первым.
   * Прошивка без поля q (до 29.09.2026) — цвет только по fix.
   */
  let gpsIcon = (telemetry) => {
    const gps = telemetry.params[nameParams.GPS]
    let state = undefined
    if (gps.q == 2 || gps.fake) state = 'bad'
    else if (!gps.fix) state = undefined
    else if (gps.q == 1) state = 'warn'
    else state = 'ok'
    return {icon: "icon-gps", value: gps.sat, state: state}
  }

  let iconOdometerSensor = () => {
    if (odometer.sensor.gnss) {
      if (!telemetry.params[nameParams.GPS].fix)
        return {
          icon: "icon-clock",
          value: presetValueTmrGps(telemetry)
        }
      return gpsIcon(telemetry)
    }
    return {
      icon: "icon-sensor",
      value: "" //telemetry.params[nameParams.ODOMETER].imp
    }
  }

  let indexDataCardTele = (odometer, telemetry) => {
    md = telemetry.params[nameParams.MODE].m
    if (md == 1) // Режим "Одометер"
      if (odometer.sensor.gnss) { // сенсор GPS?
        if (!telemetry.params[nameParams.GPS].fix) md =  5 // TimerGPS
      }
    log("md = ", md)
    return md
  }

  let indexPreset = (telemetry) => {
    return telemetry.params[nameParams.MODE].p
  }

  log(telemetry)
  log(odometer)
  log(timer)

$:  md = indexDataCardTele(odometer, telemetry) // (!telemetry.params[nameParams.GPS].fix && telemetry.params[nameParams.MODE].m == 1) ? 5 : telemetry.params[nameParams.MODE].m

$:  dataCardTele = [
    { //#0
      title: $t('telemetry.off.title').toUpperCase(), // 0
      gauge: [],
      icons: [
        (gnssPresent.gps) ? gpsIcon(telemetry) : null,
        {
          icon: "icon-accum",
          value: voltage(telemetry.params[nameParams.VOLTAGE]) + $t("all.voltage"),
          alarm: voltAlarm(voltage(telemetry.params[nameParams.VOLTAGE]))
        }
      ]
    },
    { //#1
      title: $t('telemetry.odo.title').toUpperCase(), // 1
      gauge: [
        {
          value: telemetry.params[nameParams.ODOMETER].spd/MAXSPEED,
          valueText: (telemetry.params[nameParams.ODOMETER].spd).toFixed(0),
          labelText: (telemetry.params[nameParams.ODOMETER].avgsp).toFixed(0),
          text: $t("all.speed"),
          units: $t("all.kmh") },
        {
          value: remainsScale(telemetry),
          valueText: (remainsTrip(odometer, gnssPresent.gps, telemetry.params[nameParams.ODOMETER])/1000).toFixed(1),
          labelText: (telemetry.params[nameParams.ODOMETER].v / 1000).toFixed(1),
          text: oil.micro ? $t("telemetry.portion") : $t("all.distance"),
          units: $t("all.km") }
      ],
      icons: [
        { // 1-я иконка
          icon: oil.micro ? "icon-drop" : iconsPreset[indexPreset(telemetry)],
          value: presetValueOdo(telemetry)
        },
        { // 2-я иконка
          icon: "icon-pump", // насос
          value: telemetry.params[nameParams.PUMP].v
        },
        // 3-я иконка
        iconOdometerSensor(), // часы спутник сенсор
        { // 4-я иконка
          icon: "icon-accum", // аккумулятор
          value: voltage(telemetry.params[nameParams.VOLTAGE]) + $t("all.voltage"),
          alarm: voltAlarm(voltage(telemetry.params[nameParams.VOLTAGE]))
        }
      ]
    },
    { //#2
      title: $t('telemetry.tmr.title').toUpperCase(), // 2
      gauge: [
        {
          //value: telemetry.params[nameParams.TIMER].v/(timer.presets[indexPreset(telemetry)].time*1000),
          value: telemetry.params[nameParams.TIMER].v/(telemetry.params[nameParams.TIMER].max),
          valueText: valueTimer(telemetry.params[nameParams.TIMER]),
          labelText: "",
          text: "",
          units: "" }
      ],
      icons: [
        {icon: oil.micro ? "icon-drop" : iconsPreset[indexPreset(telemetry)], value: presetValueTmr(telemetry)},
        {icon: "icon-pump", value: telemetry.params[nameParams.PUMP].v},
        {
          icon: "icon-accum",
          value: voltage(telemetry.params[nameParams.VOLTAGE]) + $t("all.voltage"),
          alarm: voltAlarm(voltage(telemetry.params[nameParams.VOLTAGE]))
        }
      ]
    },
    { //#3 — ПРОКАЧКА: сколько раз включался насос и напряжение бортсети
      //
      // ! Приборов (gauge) здесь нет намеренно. Оба показателя — одиночные
      // числа, а шкала у счётчика включений насоса бессмысленна: насос
      // включается по команде «прокачать», а не по циклу, и предела у счётчика
      // нет. Поэтому взят вид страницы OFF (#0) — один подвал с иконками;
      // gauge: [] означает, что CardContent не рисуется вообще.
      title: $t('telemetry.pumping.title').toUpperCase(),
      gauge: [],
      icons: [
        { // насос: количество включений (params[2].v)
          icon: "icon-pump",
          value: telemetry.params[nameParams.PUMP].v
        },
        { // бортсеть: как на остальных страницах, с порогом тревоги
          icon: "icon-accum",
          value: voltage(telemetry.params[nameParams.VOLTAGE]) + $t("all.voltage"),
          alarm: voltAlarm(voltage(telemetry.params[nameParams.VOLTAGE]))
        }
      ]
    },
    { //#4 — ОБУЧЕНИЕ: приём спутников и напряжение бортсети
      //
      // На этой странице важен именно приём ГНСС — по нему видно, есть ли смысл
      // запускать обучение (см. service/system.svelte). Приём показываем только
      // когда ГНСС включён в системных настройках: иначе «0 спутников» читалось
      // бы как проблема приёма, хотя приёмник просто выключен.
      title: $t('telemetry.training.title').toUpperCase(),
      gauge: [],
      icons: [
        (gnssPresent.gps) ? gpsIcon(telemetry) : null,
        {
          icon: "icon-accum",
          value: voltage(telemetry.params[nameParams.VOLTAGE]) + $t("all.voltage"),
          alarm: voltAlarm(voltage(telemetry.params[nameParams.VOLTAGE]))
        }
      ]
    },
    { //#5
      title: $t('telemetry.tmr2.title'), // 5
      gauge: [
        {
          value: telemetry.params[nameParams.TIMER].v/(telemetry.params[nameParams.TIMER].max),
          valueText: valueTimer(telemetry.params[nameParams.TIMER]),
          labelText: "",
          text: "",
          units: "" }
      ],
      icons: [
        {icon: oil.micro ? "icon-drop" : iconsPreset[indexPreset(telemetry)], value: presetValueTmrGps(telemetry)},
        {icon: "icon-pump", value: telemetry.params[nameParams.PUMP].v},
        (gnssPresent.gps) ? gpsIcon(telemetry) : null,
        {
          icon: "icon-accum",
          value: voltage(telemetry.params[nameParams.VOLTAGE]) + $t("all.voltage"),
          alarm: voltAlarm(voltage(telemetry.params[nameParams.VOLTAGE])),
        }
      ]
    },

]


/*     $: {
      if (connected) store.dispatch('requestTelemetryStart')
    } */

  function pageTabShow() {
    store.dispatch('requestTelemetryStart')
  }

  function pageTabHide() {
    store.dispatch('requestTelemetryStop')
    //clearInterval(interval)
  }

</script>
