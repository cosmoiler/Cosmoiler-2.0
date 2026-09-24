<Page
  name="trippresets"
  class={`page`}
  onPageAfterOut={pageAfteOut} >

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
  import log from '../../js/debug.js'

  let connected = useStore('connected', (value) => connected = value);
  let odometer = useStore('odometer', (value) => odometer = value);
  let mapSettings = useStore('mapSettings', (value) => mapSettings = value);

  let tmpOdometer = odometer

  $: if (!connected) document.location.reload()

  $: rangeValues = [
      /* ГОРОД */
      [{ // Расстояние
        title: $t('all.distance'),
        value: tmpOdometer.presets[store.state.presets.CITY].dst_m/1000,
        name_value: $t('all.km'),
        minValue: 1,
        maxValue: 15,
        stepValue: 1,
        scaleStep: 7,
        sacaleSubSteps: 2,
        icon: "icon-route",
        rangeChange: (e)=>{
          tmpOdometer.presets[store.state.presets.CITY].dst_m = e * 1000
          let arr = mapSettings.get('presets')
          mapSettings.set("presets", [tmpOdometer.presets[store.state.presets.CITY], (arr)?arr[1]:null, (arr)?arr[2]:null]);
          store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      },
      { // Количество
        title: $t('all.count'),
        value: tmpOdometer.presets[store.state.presets.CITY].num,
        minValue: 1,
        maxValue: 8,
        stepValue: 1,
        scaleStep: 7,
        scaleSubSteps: 1,
        icon: "icon-drop",
        rangeChange: (e)=>{
          tmpOdometer.presets[store.state.presets.CITY].num = e
          let arr = mapSettings.get('presets')
          mapSettings.set("presets", [tmpOdometer.presets[store.state.presets.CITY], (arr)?arr[1]:null, (arr)?arr[2]:null]);
          //store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      }],
      /* ТРАССА */
      [{ // Расстояние
        title: $t('all.distance'),
        value: tmpOdometer.presets[store.state.presets.WAY].dst_m/1000,
        name_value: $t('all.km'),
        minValue: 2,
        maxValue: 20,
        stepValue: 1,
        scaleStep: 9,
        icon: "icon-route",
        rangeChange: (e)=>{
          tmpOdometer.presets[store.state.presets.WAY].dst_m = e * 1000
          let arr = mapSettings.get('presets')
          mapSettings.set("presets", [(arr)?arr[0]:null, tmpOdometer.presets[store.state.presets.WAY], (arr)?arr[2]:null]);
          store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      },
      { // Количество
        title:  $t('all.count'),
        value: tmpOdometer.presets[store.state.presets.WAY].num,
        minValue: 1,
        maxValue: 5,
        stepValue: 1,
        scaleStep: 4,
        scaleSubSteps: 1,
        icon: "icon-drop",
        rangeChange: (e)=>{
          tmpOdometer.presets[store.state.presets.WAY].num = e
          let arr = mapSettings.get('presets')
          mapSettings.set("presets", [(arr)?arr[0]:null, tmpOdometer.presets[store.state.presets.WAY], (arr)?arr[2]:null]);
          //store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      },
      { // Скорость
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
          mapSettings.set("smart", tmpOdometer.smart);
          //store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      }],
      /* ОФФРОАД */
      [{ // Расстояние
        title: $t('all.distance'),
        value: tmpOdometer.presets[store.state.presets.OFFROAD].dst_m/1000,
        name_value: $t('all.km'),
        minValue: 1,
        maxValue: 7,
        stepValue: 1,
        scaleStep: 6,
        sacaleSubSteps: 1,
        icon: "icon-route",
        rangeChange: (e)=>{
          tmpOdometer.presets[store.state.presets.OFFROAD].dst_m = e * 1000
          let arr = mapSettings.get('presets')
          mapSettings.set("presets", [(arr)?arr[0]:null, (arr)?arr[1]:null, tmpOdometer.presets[store.state.presets.OFFROAD]]);
          store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      },
      { // Количество
        title:  $t('all.count'),
        value: tmpOdometer.presets[store.state.presets.OFFROAD].num,
        minValue: 1,
        maxValue: 8,
        stepValue: 1,
        scaleStep: 7,
        scaleSubSteps: 1,
        icon: "icon-drop",
        rangeChange: (e)=>{
          tmpOdometer.presets[store.state.presets.OFFROAD].num = e
          let arr = mapSettings.get('presets')
          mapSettings.set("presets", [(arr)?arr[0]:null, (arr)?arr[1]:null, tmpOdometer.presets[store.state.presets.OFFROAD]]);
          //store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      },
      { // Циклы
        title: $t('all.count.cycles'),
        value: tmpOdometer.presets[store.state.presets.OFFROAD].cycles,
        minValue: 0,
        maxValue: 10,
        stepValue: 1,
        scaleStep: 5,
        scaleSubSteps: 2,
        icon: "icon-repeat",
        rangeChange: (e)=>{
          tmpOdometer.presets[store.state.presets.OFFROAD].cycles = e
          let arr = mapSettings.get('presets')
          mapSettings.set("presets", [(arr)?arr[0]:null, (arr)?arr[1]:null, tmpOdometer.presets[store.state.presets.OFFROAD]]);
          //store.dispatch('calcDistance', tmpOdometer);
          store.dispatch('sendDistance', tmpOdometer);
          log(mapSettings)
        }
      }]
    ]

  function pageAfteOut() {
    //console.log('pageAfterOut', tmpOdometer);
    //store.dispatch('calcDistance', tmpOdometer)
    //store.dispatch('sendDistance', tmpOdometer)
  }

</script>
