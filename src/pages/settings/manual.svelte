<Page
  name="manual"
  class={`page`}>

  <Navbar title={$t('settings.pump.title')} />

  <!--
    ! Каждый параметр — своя карточка, как на страницах пресетов и System
    ! (.section-card в css/app.less): <Ranges> уже отдаёт заголовок (BlockTitle)
    ! и строку со шкалой, карточке достаточно обёртки. Иначе шкалы висели на
    ! фоне страницы без границ и читались как один общий список.
  -->
  {#each rangeValues as rangeValue}
    <div class="section-card">
      <Ranges {...rangeValue} />
    </div>
  {/each}
</Page>

<script>
  import {
    Page,
    Navbar,
    useStore
  } from 'framework7-svelte';
  import {t} from '../../services/i18n.js';
  import Ranges from '../../components/range-param.svelte'
  import store from '../../js/store.js';
  import log from '../../js/debug.js'
  import {pumpMaxDpMs} from '../../js/pumpType.js'


  let connected = useStore('connected', (value) => connected = value);
  let manual = useStore('manual', (value) => manual = value);
  let pump = useStore('pump', (value) => pump = value);

  let tmpManual = manual

  // ! Шкала объёма — время включения dpms в процентах от предела T по типу насоса,
  //   как на странице насоса (js/pumpType.js: B — 5000 мс, C — 1000/500/2000,
  //   A и неизвестный — 500). Раньше это была доля от «таймера» dpdp (5…90 %), и
  //   насос B нельзя было настроить дольше 1,8 с, а значение с устройства
  //   (MAN.PMP.dp=1000 при dpdp=800 — 125 %) уводило ползунок за правый край.
  //   Показ ограничен пределами шкалы; время включения от «таймера» не зависит.
  $: T = pumpMaxDpMs(pump && pump.type, localStorage.getItem('oil'))
  const volMin = 5
  const volMax = 100

  // ! Без location.reload при потере связи (этап 2, firmware docs/web-frontend.md §13):
  //   без связи — надпись «Нет связи», как раньше; после восстановления вкладки
  //   возвращаются к началу и настройки перечитываются (store.js onLinkUp).
  // Копия — тот же объект стора; после перечитывания настроек — новый объект.
  $: tmpManual = manual

  $: rangeValues = [
      {
          title: $t('settings.manual.oilvolume'),
          value: Math.min(Math.max(Math.round(tmpManual.pump.dpms * 100 / T), volMin), volMax),
          name_value: "%",
          minValue: volMin,
          maxValue: volMax,
          stepValue: 5, // 0.05
          // sacaleSubSteps: 1,
          scale: false,
          // frmtScaleLabel: outScaleLabel,
          /*         scaleStep: ,
          sacaleSubSteps: 2, */
          icon: "icon-drop",
          icon2: "icon-dropfill",
          rangeChange: (e)=>{
            tmpManual.pump.dpms = Math.round(T * e / 100);
            store.dispatch('sendManual', tmpManual);
          }
      },
      {
          title: $t('all.timer'),
          value: tmpManual.pump.dpdp/1000, //Math.round(/10) * 10,
          name_value: $t('all.seconds'),
          minValue: 0.500,
          maxValue: 2.000,
          stepValue: 0.100,
          scale: true,
          //frmtScaleLabel: outScaleLabel,
          /*          scaleStep: 5,
          sacaleSubSteps: 2, */
          icon: "icon-clock",
          /*        icon2: "icon-drop", */
          rangeChange: (e)=>{
              tmpManual.pump.dpdp = Math.trunc(e * 1000)//.toFixed(0);
              store.dispatch('sendManual', tmpManual);
          }
      }
  ]

  function outScaleLabel(e) {
    return Math.round(e/10) * 10
  }

</script>
