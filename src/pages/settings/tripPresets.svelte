<Page
  name="trippresets"
  class={`page`}>

  <Navbar title={$t('settings.presets.title')} />

  <Toolbar top tabbar >
    <Link tabLink="#tab-city" tabLinkActive>{$t('settings.presets.city')}</Link>
    <Link tabLink="#tab-way">{$t('settings.presets.way')}</Link>
    <Link tabLink="#tab-rain">{$t('settings.presets.user')}</Link>
  </Toolbar>

  <Tabs >
<!-- ГОРОД -->
    <Tab id="tab-city" tabActive>
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
<!-- ТРАССА -->
    <Tab id="tab-way">
      {#each rangeValues[1] as rangeValue}
        <div class="section-card">
          <Ranges {...rangeValue} />
        </div>
      {/each}
    </Tab>
<!-- ДОЖДЬ ПЕСОК -->
    <Tab id="tab-rain">
      {#each rangeValues[2] as rangeValue}
        <div class="section-card">
          <Ranges {...rangeValue} />
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
  let odometer = useStore('odometer', (value) => odometer = value);
  let pending = useStore('pending', (value) => pending = value);

  let tmpOdometer = odometer

  $: if (!connected) document.location.reload()

  const P = store.state.presets

  /**
   * Шкала поля field пресета index. Правка кладёт в очередь одометра
   * (pending.trip) ВСЮ тройку пресетов: прошивка принимает полный массив.
   * Раньше массив собирался частями из прошлой очереди, а она была общей с
   * таймером под тем же ключом presets. Расстояние (dst_m, в шкале — км)
   * меняет и число импульсов участка — отсюда calcDistance.
   * odo — тот же tmpOdometer: передаётся, чтобы $: rangeValues зависел от него.
   */
  const presetRange = (odo, index, field, opts) => ({
    ...opts,
    value: field === 'dst_m' ? odo.presets[index].dst_m / 1000 : odo.presets[index][field],
    rangeChange: (e) => {
      tmpOdometer.presets[index][field] = field === 'dst_m' ? e * 1000 : e
      pending.trip.set('presets', tmpOdometer.presets)
      if (field === 'dst_m') store.dispatch('calcDistance', tmpOdometer)
      store.dispatch('sendDistance', tmpOdometer)
    }
  })

  $: rangeValues = [
      /* ГОРОД */
      [presetRange(tmpOdometer, P.CITY, 'dst_m', {
        title: $t('all.distance'), name_value: $t('all.km'), icon: "icon-route",
        minValue: 1, maxValue: 15, stepValue: 1, scaleStep: 7, scaleSubSteps: 2 }),
       presetRange(tmpOdometer, P.CITY, 'num', {
        title: $t('all.count'), icon: "icon-drop",
        minValue: 1, maxValue: 8, stepValue: 1, scaleStep: 7, scaleSubSteps: 1 })],
      /* ТРАССА */
      [presetRange(tmpOdometer, P.WAY, 'dst_m', {
        title: $t('all.distance'), name_value: $t('all.km'), icon: "icon-route",
        minValue: 2, maxValue: 20, stepValue: 1, scaleStep: 9 }),
       presetRange(tmpOdometer, P.WAY, 'num', {
        title: $t('all.count'), icon: "icon-drop",
        minValue: 1, maxValue: 5, stepValue: 1, scaleStep: 4, scaleSubSteps: 1 }),
       { // Скорость — не пресет, а smart.maxsp
        title: $t('all.maxspeed'),
        value: tmpOdometer.smart.maxsp,
        name_value: $t('all.kmh'),
        minValue: 100,
        maxValue: 200,
        stepValue: 10,
        scaleStep: 5,
        scaleSubSteps: 2,
        icon: "icon-speed-1",
        rangeChange: (e)=>{
          tmpOdometer.smart.maxsp = e
          pending.trip.set("smart", tmpOdometer.smart);
          store.dispatch('sendDistance', tmpOdometer);
        }
      }],
      /* ОФФРОАД */
      [presetRange(tmpOdometer, P.OFFROAD, 'dst_m', {
        title: $t('all.distance'), name_value: $t('all.km'), icon: "icon-route",
        minValue: 1, maxValue: 7, stepValue: 1, scaleStep: 6, scaleSubSteps: 1 }),
       presetRange(tmpOdometer, P.OFFROAD, 'num', {
        title: $t('all.count'), icon: "icon-drop",
        minValue: 1, maxValue: 8, stepValue: 1, scaleStep: 7, scaleSubSteps: 1 }),
       presetRange(tmpOdometer, P.OFFROAD, 'cycles', {
        title: $t('all.count.cycles'), icon: "icon-repeat",
        minValue: 0, maxValue: 10, stepValue: 1, scaleStep: 5, scaleSubSteps: 2 })]
    ]

</script>
