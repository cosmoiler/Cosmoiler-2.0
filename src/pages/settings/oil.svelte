<!--
  ! Масло: настройки микропорций своего режима (firmware docs/oil-dose.md §7–8,
  ! docs/config.md §1.1).
  !
  ! Страница открывается с вкладок «Одометр» (/settings/oil/) и «Таймер»
  ! (/settings/oil/timer/, проп timer = true — routes.js). Пресеты при
  ! микропорциях (прошивка с 01.10.2026): АСФАЛЬТ (выбранные ГОРОД и ТРАССА) и
  ! ОФФРОУД — переключаются кнопкой на блоке, здесь — вкладки их настроек:
  !
  !   режим    | АСФАЛЬТ                                   | ОФФРОУД
  !   Одометр  | ручка dose.lvl, макс. скорость smart.maxsp | множитель dose.x
  !   Таймер   | ручка dose.lvl                            | множитель dose.x
  !
  ! «ПО ВРЕМЕНИ» — «только ручка» (решение пользователя 01.10.2026): масло в час
  ! задают ручка и множитель (бюджет как при езде 50 км/ч), интервал пресета
  ! таймера (presets[0].time, TMR.PRS0.tm) при микропорциях не используется —
  ! поля «Порция каждые … с» здесь больше нет.
  !
  ! Всё уходит в /settings/trip или /settings/time (sendDose, sendDistance);
  ! /settings/oil — только чтение. Остаток масла — на вкладке «Телеметрия»,
  ! заправка — в «Сервис → Система».
-->

<!-- Вкладки — в fixedContent, как на странице «Настройки» (settings.svelte):
     внутри .page-content верхний тулбар наезжал бы на первую карточку. -->
{#snippet oilToolbar()}
  {#if connected}
    <Toolbar top tabbar>
      <Link tabLink="#tab-oil-asphalt" tabLinkActive>{$t('settings.oil.asphalt')}</Link>
      <Link tabLink="#tab-oil-offroad">{$t('settings.oil.offroad')}</Link>
    </Toolbar>
  {/if}
{/snippet}

<Page
  name="oil"
  class={`page`}
  fixedContent={oilToolbar}>

  <Navbar title={$t('settings.oil.title')} />

  {#if connected}
    <Tabs>
      <!-- АСФАЛЬТ -->
      <Tab id="tab-oil-asphalt" tabActive>
        <!-- Ручка «меньше/больше» -->
        <div class="section-card">
          <Ranges {...doseRange} />
          <SectionInstr title={$t('settings.oil.hint.title')}>
            <p>{$t('settings.oil.hint.p1')}</p>
            <p>{$t('settings.oil.hint.dry')}</p>
            <p>{$t('settings.oil.hint.front')}</p>
            <p>{$t('settings.oil.hint.rear')}</p>
          </SectionInstr>
        </div>

        {#if !timer}
        <!-- ! Макс. скорость (ODO.SMR.max) — у АСФАЛЬТА одометра: выше неё порции
             откладываются до снижения скорости. В «ПО ВРЕМЕНИ» скорость неизвестна. -->
        <div class="section-card">
          <Ranges {...maxspRange} />
          <div class="section-card__instr section-card__note"><p>{$t('settings.oil.maxspeed.hint')}</p></div>
        </div>
        {/if}
      </Tab>

      <!-- ОФФРОУД -->
      <Tab id="tab-oil-offroad">
        <div class="section-card">
          <Ranges {...mulRange} />
          <div class="section-card__instr section-card__note"><p>{$t('settings.oil.mul.hint')}</p></div>
        </div>
      </Tab>
    </Tabs>
  {/if}
</Page>

<script>
  import {
    Page,
    Navbar,
    Toolbar,
    Link,
    Tabs,
    Tab,
    useStore
  } from 'framework7-svelte';
  import {t} from '../../services/i18n.js';
  import Ranges from '../../components/range-param.svelte'
  import SectionInstr from '../../components/section-instr.svelte'
  import store, { DOSE_X, doseXText } from '../../js/store.js';

  // true — страница открыта с вкладки «Таймер» (options.props маршрута).
  export let timer = false

  let connected = useStore('connected', (value) => connected = value);
  let odometer = useStore('odometer', (value) => odometer = value);
  let timerCfg = useStore('timer', (value) => timerCfg = value);
  let pending = useStore('pending', (value) => pending = value);

  // Настройки своего режима. Прошивка без объекта dose (до 01.10.2026) — умолчания.
  $: cfg = timer ? timerCfg : odometer
  $: level = Number(cfg.dose?.lvl) || 0
  $: mul = Number(cfg.dose?.x) || 300

  // Шаг ручки ×1.25 на деление (COSMOILER_DOSE_STEP_PCT, firmware docs/oil-dose.md §7).
  const STEP = 1.25

  $: doseRange = {
    title: $t('settings.oil.dose'),
    value: level,
    name_value: '(×' + Math.pow(STEP, level).toFixed(2) + ')',
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
      if (e !== level)
        store.dispatch('sendDose', { timer, lvl: e })
    }
  }

  // Макс. скорость (ODO.SMR.max) — секция smart через очередь одометра
  // (pending.trip) и sendDistance.
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

  // Множитель ОФФРОУДА: шкала по номерам из DOSE_X, подпись — «×3».
  // Значение не из списка (записано иначе) — ближайшее деление.
  const nearestX = (x) => DOSE_X.reduce((best, v, i) =>
    Math.abs(v - x) < Math.abs(DOSE_X[best] - x) ? i : best, 0)
  $: mulIndex = nearestX(mul)
  $: mulRange = {
    title: $t('settings.oil.mul'),
    value: mulIndex,
    valueText: doseXText(mul),
    minValue: 0,
    maxValue: DOSE_X.length - 1,
    stepValue: 1,
    // Подпись у каждого деления — сам множитель без «×» (0.25 … 5): «×3» — в заголовке.
    scale: true,
    scaleStep: DOSE_X.length - 1,
    scaleSubSteps: 1,
    frmtScaleLabel: (i) => String(DOSE_X[Math.round(i)] / 100),
    icon: 'icon-off-road',
    rangeChange: (e) => {
      const x = DOSE_X[e]
      if (x !== undefined && x !== mul)
        store.dispatch('sendDose', { timer, x })
    }
  }
</script>
