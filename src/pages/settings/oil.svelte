<!--
  ! Масло: настройки дозы микропорций (firmware docs/oil.md, docs/oil-dose.md §7).
  !
  !   GET/POST /settings/oil — {lvl, cap, q, micro}: пишется только lvl (−5…+5).
  !
  ! Страница открывается с вкладок «Одометр» (/settings/oil/) и «Таймер»
  ! (/settings/oil/timer/, проп timer = true — routes.js). Остаток масла — на вкладке
  ! «Телеметрия», заправка — в «Сервис → Система» (решение пользователя 28.09.2026).
-->
<Page
  name="oil"
  class={`page`}>

  <Navbar title={$t('settings.oil.title')} />

  {#if connected}
    <!-- Ручка дозы «меньше/больше» -->
    <div class="section-card">
      <Ranges {...doseRange} />
      <SectionInstr title={$t('settings.oil.hint.title')}>
        <p>{$t('settings.oil.hint.p1')}</p>
        <p>{$t('settings.oil.hint.dry')}</p>
        <p>{$t('settings.oil.hint.front')}</p>
        <p>{$t('settings.oil.hint.rear')}</p>
      </SectionInstr>
    </div>

    <!-- ! Макс. скорость при микропорциях — здесь: страница пресетов, где она была,
         спрятана (её расстояния и капли на подачу не влияют), а порог действует —
         выше него порции откладываются до снижения скорости. Только для одометра:
         в режиме «Таймер» скорость неизвестна. -->
    {#if oil.micro && !timer}
    <div class="section-card">
      <Ranges {...maxspRange} />
      <!-- Образец вида карточек с инструкцией: настройка на бежевом, текст ниже на белом. -->
      <div class="section-card__instr section-card__note"><p>{$t('settings.oil.maxspeed.hint')}</p></div>
    </div>
    {/if}
  {:else}
    <BlockTitle class={`block-title-noconnection__text`}>{$t('home.noconnect')}</BlockTitle>
  {/if}
</Page>

<script>
  import {
    Page,
    Navbar,
    BlockTitle,
    useStore
  } from 'framework7-svelte';
  import {t} from '../../services/i18n.js';
  import Ranges from '../../components/range-param.svelte'
  import SectionInstr from '../../components/section-instr.svelte'
  import store from '../../js/store.js';

  // true — страница открыта с вкладки «Таймер» (options.props маршрута).
  export let timer = false

  let connected = useStore('connected', (value) => connected = value);
  let oil = useStore('oil', (value) => oil = value);
  let odometer = useStore('odometer', (value) => odometer = value);
  let pending = useStore('pending', (value) => pending = value);

  // Макс. скорость (ODO.SMR.max) — как на странице пресетов одометра: только
  // секция smart через очередь одометра (pending.trip) и sendDistance.
  $: maxspRange = {
    title: $t('all.maxspeed'),
    value: odometer.smart.maxsp,
    name_value: $t('all.kmh'),
    minValue: 100,
    maxValue: 200,
    stepValue: 10,
    scaleStep: 5,
    scaleSubSteps: 2,
    icon: 'icon-speed-1',
    rangeChange: (e) => {
      if (e === odometer.smart.maxsp) return
      odometer.smart.maxsp = e
      pending.trip.set('smart', odometer.smart)
      store.dispatch('sendDistance', odometer)
    }
  }


  // Шаг ручки ×1.25 на деление (COSMOILER_DOSE_STEP_PCT, firmware docs/oil-dose.md §7).
  const STEP = 1.25

  $: doseRange = {
    title: $t('settings.oil.dose'),
    value: oil.lvl,
    name_value: '(×' + Math.pow(STEP, oil.lvl).toFixed(2) + ')',
    minValue: -5,
    maxValue: 5,
    stepValue: 1,
    scale: true,
    scaleStep: 10,
    scaleSubSteps: 1,
    frmtScaleLabel: (v) => (v > 0 ? '+' + v : '' + v),
    icon: 'icon-drop',
    icon2: 'icon-dropfill',
    rangeChange: (e) => {
      if (e !== oil.lvl)
        store.dispatch('sendOil', e)
    }
  }
</script>
