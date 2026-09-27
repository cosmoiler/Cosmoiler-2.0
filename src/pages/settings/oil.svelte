<!--
  ! Масло: остаток в бачке, ручка дозы «меньше/больше», заправка.
  !
  ! Контракт с прошивкой (firmware docs/oil.md):
  !   GET/POST /settings/oil — {lvl, cap, q}: пишется только lvl (−5…+5);
  !   GET /oil/refill?e=1    — бачок заправлен, «был почти пуст» (прошивка
  !                            пересчитает расход насоса), без e — просто заправка;
  !   GET /telemetry/get     — params[6] = {oil: %, km: ~км или −1, low: 0|1}.
  !
  ! Остаток приходит телеметрией, а её опрос идёт только на вкладке «Телеметрия»,
  ! поэтому здесь телеметрия запрашивается при входе на страницу и после заправки.
-->
<Page
  name="oil"
  class={`page`}
  onPageBeforeIn={pageBeforeIn}>

  <Navbar title={$t('settings.oil.title')} />

  {#if connected}
    <!-- Остаток масла в бачке -->
    <div class="section-card">
      <BlockTitle class="display-flex justify-content-space-between">
        <span>{$t('settings.oil.remains')}</span>
        <span style={low ? 'color: red' : 'color: var(--f7-theme-color-change-text)'}>{pct} %</span>
      </BlockTitle>
      <List>
        <ListItem class="row-tint">
          <div class="item-cell width-auto flex-shrink-0">
            <Icon icon="icon-addoil" style={low ? 'font-size: 30px; color: red' : 'font-size: 30px'} />
          </div>
          <div class="item-cell item-cell--grow list-input__label list-input__label-text_color">
            {km >= 0 ? $t('settings.oil.km', {values: {p: km}}) : $t('settings.oil.km.unknown')}
          </div>
        </ListItem>
      </List>
      {#if low}
        <Block mediumInset><p style="color: red">{$t('settings.oil.low')}</p></Block>
      {/if}
    </div>

    <!-- Ручка дозы «меньше/больше» -->
    <div class="section-card">
      <Ranges {...doseRange} />
      <button class="section-more" class:is-open={hint} aria-expanded={hint} onclick={() => hint = !hint}>
        <span>{$t('settings.oil.hint.title')}</span>
        <span class="section-more__chev">▾</span>
      </button>
      {#if hint}
      <Block mediumInset>
        <p><i>{$t('settings.oil.hint.p1')}</i></p>
        <p>{$t('settings.oil.hint.dry')}</p>
        <p>{$t('settings.oil.hint.front')}</p>
        <p>{$t('settings.oil.hint.rear')}</p>
      </Block>
      {/if}
    </div>

    <!-- ! Макс. скорость при микропорциях — здесь: страница пресетов, где она была,
         спрятана (её расстояния и капли на подачу не влияют), а порог действует —
         выше него порции откладываются до снижения скорости. -->
    {#if oil.micro}
    <div class="section-card">
      <Ranges {...maxspRange} />
      <Block mediumInset><p><i>{$t('settings.oil.maxspeed.hint')}</i></p></Block>
    </div>
    {/if}

    <!-- Заправка бачка -->
    <div class="section-card">
      <BlockTitle><span>{$t('settings.oil.refill.title')}</span></BlockTitle>
      <List>
        <ListItem class="row-tint">
          <div class="item-cell width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('settings.oil.refill.empty')}</div>
          <div class="item-cell width-auto flex-shrink-4"><Toggle bind:checked={wasEmpty} /></div>
        </ListItem>
      </List>
      <Block>
        <Button fill large disabled={busy} onClick={refill}>{$t('settings.oil.refill.button')}</Button>
      </Block>
      <Block mediumInset>
        <p><i>{$t('settings.oil.refill.p1')}</i></p>
        <p><i>{$t('settings.oil.refill.p2')}</i></p>
        <p><i>{$t('settings.oil.tank', {values: {p: oil.cap, q: flowText}})}</i></p>
      </Block>
    </div>
  {:else}
    <BlockTitle class={`block-title-noconnection__text`}>{$t('home.noconnect')}</BlockTitle>
  {/if}
</Page>

<script>
  import {
    f7,
    Page,
    Navbar,
    BlockTitle,
    Block,
    List,
    ListItem,
    Icon,
    Toggle,
    Button,
    useStore
  } from 'framework7-svelte';
  import {t} from '../../services/i18n.js';
  import Ranges from '../../components/range-param.svelte'
  import store from '../../js/store.js';

  let connected = useStore('connected', (value) => connected = value);
  let oil = useStore('oil', (value) => oil = value);
  let telemetry = useStore('telemetry', (value) => telemetry = value);
  let odometer = useStore('odometer', (value) => odometer = value);
  let mapSettings = useStore('mapSettings', (value) => mapSettings = value);

  // Макс. скорость (ODO.SMR.max) — как на странице пресетов одометра: только
  // секция smart через mapSettings и sendDistance.
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
      mapSettings.set('smart', odometer.smart)
      store.dispatch('sendDistance', odometer)
    }
  }

  let hint = false
  let wasEmpty = false
  let busy = false

  // Шаг ручки ×1.25 на деление (COSMOILER_DOSE_STEP_PCT, firmware docs/oil-dose.md §7).
  const STEP = 1.25

  // params[6] есть только в прошивке с учётом масла (с 27.09.2026); у старой —
  // показываем «полный бачок, оценки нет», а не падаем.
  $: oilTele = (telemetry && telemetry.params && telemetry.params[6]) || {oil: 100, km: -1, low: 0}
  $: pct = oilTele.oil
  $: km = oilTele.km
  $: low = oilTele.low == 1
  $: flowText = (oil.q / 10).toFixed(1)

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

  function pageBeforeIn() {
    store.dispatch('refreshTelemetry')
  }

  function refill() {
    const text = wasEmpty ? $t('settings.oil.refill.confirm.empty') : $t('settings.oil.refill.confirm')
    f7.dialog.confirm(text, 'Cosmoiler', async () => {
      busy = true
      const ok = await store.dispatch('oilRefill', wasEmpty)
      busy = false
      if (ok) {
        wasEmpty = false
        f7.toast.show({ text: $t('settings.oil.refill.done'), closeTimeout: 2000, position: 'center' })
      } else {
        f7.dialog.alert($t('settings.oil.refill.error'), 'Cosmoiler')
      }
    })
  }
</script>
