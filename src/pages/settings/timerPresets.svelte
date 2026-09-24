<Page
  name="timepresets"
  class={`page`}>

  <Navbar title={$t('settings.presets.title')} />

  <Toolbar top tabbar >
    <Link tabLink="#tab-city-time" tabLinkActive>{$t('settings.presets.city')}</Link>
    <Link tabLink="#tab-rain">{$t('settings.presets.user')}</Link>
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
    <Tab id="tab-rain">
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
  import log from '../../js/debug.js'

  let connected = useStore('connected', (value) => connected = value);
  let timer = useStore('timer', (value) => timer = value);
  let mapSettings = useStore('mapSettings', (value) => mapSettings = value);

  let tmpTimer = timer;

/*   const presets = {
    CITY: 0,
    OFFROAD: 2,
  } */

  $: if (!connected) document.location.reload()

  $: rangeValues = [
    /* ГОРОД */
    [{
      title: "Таймер",
      value: tmpTimer.presets[store.state.presets.CITY].time,
      name_value: "сек",
      minValue: 10,
      maxValue: 600,
      stepValue: 10,
      scaleStep: 4,
      sacaleSubSteps: 2,
      icon: "icon-clock",
      frmtScaleLabel: outScaleLabel,
      rangeChange: (e)=>{
        tmpTimer.presets[store.state.presets.CITY].time = e
        let arr = mapSettings.get('presets')
        mapSettings.set("presets", [tmpTimer.presets[store.state.presets.CITY], (arr)?arr[store.state.presets.OFFROAD]:null]);
        store.dispatch('sendTime', tmpTimer)
        log(mapSettings)
      }
    },
    {
      title: $t('all.count'),
      value: tmpTimer.presets[store.state.presets.CITY].num,
      minValue: 1,
      maxValue: 5,
      stepValue: 1,
      scaleStep: 4,
      scaleSubSteps: 1,
      icon: "icon-drop",
      rangeChange: (e)=>{
        tmpTimer.presets[store.state.presets.CITY].num = e
        let arr = mapSettings.get('presets')
        mapSettings.set("presets", [tmpTimer.presets[store.state.presets.CITY], (arr)?arr[store.state.presets.OFFROAD]:null]);
        store.dispatch('sendTime', tmpTimer)
        log(mapSettings)
      }
    }],
    /* ОФФРОАД */
    [{
      title: "Таймер",
      value: tmpTimer.presets[store.state.presets.OFFROAD].time,
      name_value: "сек",
      minValue: 10,
      maxValue: 600,
      stepValue: 10,
      scaleStep: 3,
      sacaleSubSteps: 2,
      icon: "icon-clock",
      frmtScaleLabel: outScaleLabel,
      rangeChange: (e)=>{
        tmpTimer.presets[store.state.presets.OFFROAD].time = e
        let arr = mapSettings.get('presets')
        mapSettings.set("presets", [(arr)?arr[store.state.presets.CITY]:null, tmpTimer.presets[store.state.presets.OFFROAD]]);
        store.dispatch('sendTime', tmpTimer);
      log(mapSettings)
      }
    },
    {
      title: $t('all.count'),
      value: tmpTimer.presets[store.state.presets.OFFROAD].num,
      minValue: 1,
      maxValue: 5,
      stepValue: 1,
      scaleStep: 4,
      scaleSubSteps: 1,
      icon: "icon-drop",
      rangeChange: (e)=>{
        tmpTimer.presets[store.state.presets.OFFROAD].num = e
        let arr = mapSettings.get('presets')
        mapSettings.set("presets", [(arr)?arr[store.state.presets.CITY]:null, tmpTimer.presets[store.state.presets.OFFROAD]]);
        store.dispatch('sendTime', tmpTimer);
      log(mapSettings)
      }
    },
    {
      title: "Количество циклов",
      value: tmpTimer.presets[store.state.presets.OFFROAD].cycles,
      minValue: 0,
      maxValue: 10,
      stepValue: 1,
      scaleStep: 5,
      scaleSubSteps: 2,
      icon: "icon-repeat",
      rangeChange: (e)=>{
        tmpTimer.presets[store.state.presets.OFFROAD].cycles = e
        let arr = mapSettings.get('presets')
        mapSettings.set("presets", [(arr)?arr[store.state.presets.CITY]:null, tmpTimer.presets[store.state.presets.OFFROAD]]);
        store.dispatch('sendTime', tmpTimer);
      log(mapSettings)
      }
    }]
  ]


  function outScaleLabel(e) {
    return Math.round(e/10) * 10
  }

</script>
