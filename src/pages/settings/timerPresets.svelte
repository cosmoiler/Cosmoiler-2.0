<Page
  name="timepresets"
  class={`page`}>

  <Navbar title={$t('settings.presets.title')} />

  <Toolbar top tabbar >
    <Link tabLink="#tab-city-time" tabLinkActive>{$t('settings.presets.city')}</Link>
    <Link tabLink="#tab-rain-time">{$t('settings.presets.user')}</Link>
  </Toolbar>
  <Tabs >

<!-- ГОРОД -->
    <Tab id="tab-city-time" tabActive>
      <!--
        ! Каждый параметр — своя карточка, как секции на странице System
        ! (.section-card в css/app.less): <Ranges> уже отдаёт заголовок
        ! (BlockTitle) и строку со шкалой, карточке достаточно обёртки.
      -->
      {#each rangeValues[0] as rangeValue}
        <div class="section-card">
          <Ranges {...rangeValue} />
        </div>
      {/each}
    </Tab>

<!-- ДОЖДЬ ПЕСОК -->
    <!-- id отличается от #tab-rain пресетов одометра: одинаковые id вкладок в
         одном документе — источник путаницы при переключении. -->
    <Tab id="tab-rain-time">
      {#each rangeValues[1] as rangeValue}
        <div class="section-card">
          <Ranges {...rangeValue}/>
        </div>
      {/each}
    </Tab>
  </Tabs>
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
  import store from '../../js/store.js';
  let connected = useStore('connected', (value) => connected = value);
  let timer = useStore('timer', (value) => timer = value);
  let pending = useStore('pending', (value) => pending = value);

  let tmpTimer = timer;

  // ! Без location.reload при потере связи (этап 2, firmware docs/web-frontend.md §13):
  //   без связи — надпись «Нет связи», как раньше; после восстановления вкладки
  //   возвращаются к началу и настройки перечитываются (store.js onLinkUp).
  // Копия — тот же объект стора; после перечитывания настроек — новый объект.
  $: tmpTimer = timer

  const P = store.state.presets

  /**
   * Шкала поля field пресета index. Правка кладёт в очередь таймера
   * (pending.time) ОБА пресета прошивки — город и оффроуд (индекс 1 в
   * интерфейсе — пустышка, см. applyTimer в store.js). Раньше второй элемент
   * брался как arr[OFFROAD] из прошлого двухэлементного массива — всегда
   * undefined, и правка оффроуда терялась, если за 2 с изменить город.
   * tmr — тот же tmpTimer: передаётся, чтобы $: rangeValues зависел от него.
   */
  const presetRange = (tmr, index, field, opts) => ({
    ...opts,
    value: tmr.presets[index][field],
    rangeChange: (e) => {
      tmpTimer.presets[index][field] = e
      pending.time.set('presets', [tmpTimer.presets[P.CITY], tmpTimer.presets[P.OFFROAD]])
      store.dispatch('sendTime', tmpTimer)
    }
  })

  // Время — в секундах; подпись без ведущего пробела локали (« сек»).
  $: timeOpts = {
    title: $t('all.timer'), name_value: $t('all.seconds').trim(), icon: "icon-clock",
    minValue: 10, maxValue: 600, stepValue: 10, scaleSubSteps: 2, frmtScaleLabel: outScaleLabel
  }
  $: countOpts = {
    title: $t('all.count'), icon: "icon-drop",
    minValue: 1, maxValue: 5, stepValue: 1, scaleStep: 4, scaleSubSteps: 1
  }

  $: rangeValues = [
    /* ГОРОД */
    [presetRange(tmpTimer, P.CITY, 'time', { ...timeOpts, scaleStep: 4 }),
     presetRange(tmpTimer, P.CITY, 'num', countOpts)],
    /* ОФФРОАД */
    [presetRange(tmpTimer, P.OFFROAD, 'time', { ...timeOpts, scaleStep: 3 }),
     presetRange(tmpTimer, P.OFFROAD, 'num', countOpts),
     presetRange(tmpTimer, P.OFFROAD, 'cycles', {
      title: $t('all.count.cycles'), icon: "icon-repeat",
      minValue: 0, maxValue: 10, stepValue: 1, scaleStep: 5, scaleSubSteps: 2 })]
  ]

  function outScaleLabel(e) {
    return Math.round(e/10) * 10
  }

</script>
