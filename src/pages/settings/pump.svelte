<Page
  name="pump"
  class={`page`}
  on:pageBeforeIn={pageBeforeIn}
  on:pageAfterOut={pageAfterOut}
  >
    <Navbar title={$t('settings.pump.title')} backLink="Back" />

<!--     <BlockTitle>Настройка насоса под вязкость залитого масла</BlockTitle> -->
    <BlockTitle class='block-title-text_settings'>
        {$t('settings.pump.type')}
    </BlockTitle>
    <List>
        <ListItem
          radio
          name="std"
          value="std"
          title={$t('settings.pump.type.std')}
          checked={fStd}
          on:change={() => {
            tmpPump.usr = false
            store.dispatch('sendPump', tmpPump);
            //mapSettings.set("sensor", tmpOdometer.sensor);
            //log(mapSettings)
          }}
          class={`sensor__list-item`}>
        </ListItem>
        <ListItem
          radio
          name="user"
          value="usr"
          title={$t('settings.pump.type.nonstd')}
          checked={fUsr}
          on:change={() => {
            tmpPump.usr = true
            store.dispatch('sendPump', tmpPump);
            //mapSettings.set("sensor", tmpOdometer.sensor);
            //log(mapSettings)
          }}
          class={`sensor__list-item`}>
        </ListItem>
    </List>


    {#if !tmpPump.usr}
    <BlockTitle class='block-title-text_settings'>
      {$t('settings.pump.std.viscosity')}
    </BlockTitle>
    <Block mediumInset>
      <p><i>
        {$t('settings.pump.std.viscosity.block.p1')}
        </i>
      </p>
    </Block>
        <List>
          <ListItem
            radio
            name="atf"
            value="atf"
            title={$t('settings.pump.std.viscosity.liquid')}
            checked={is_atf}
            on:change={() => {
              Oil = typesOil.ATF
             // T = 500
              localStorage.setItem('oil', Oil)
            }}
            class={`sensor__list-item`}>
          </ListItem>
          <ListItem
            radio
            name="tad17"
            value="tad17"
            title={$t('settings.pump.std.viscosity.thick')}
            checked={is_tad17}
            on:change={() => {
              Oil = typesOil.TAD
             // T = 2000
              localStorage.setItem('oil', Oil)
            }}
            class={`sensor__list-item`}>
          </ListItem>
      </List>
      <BlockTitle class='block-title-text_settings'>
        {$t('settings.pump.std.volume')}
      </BlockTitle>
      <Block mediumInset>
        <i>
          {$t('settings.pump.std.volume.block.p1')}
          </i>
      </Block>
      {#if is_atf}
        <Ranges {...rangeValues[0][0]} />
      {:else if is_tad17}
        <Ranges {...rangeValues[0][1]} />
      {/if}
    {:else}
    <Block>
      <p>
        {$t('settings.pump.nonstd.block.p1')}
      </p>
    </Block>
      {#each rangeValues[1] as rangeValue}
        <Ranges {...rangeValue} />
      {/each}
    {/if}

</Page>

  <script>
    import {
      Block,
      BlockTitle,
      Page,
      Navbar,
      List,
      ListItem,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import Ranges from '../../components/range-param.svelte'
    import store from '../../js/store.js';
    import log from '../../js/debug'

    let connected = useStore('connected', (value) => connected = value);
    let pump = useStore('pump', (value) => pump = value);
    let ver = useStore('ver', (value) => ver = value);

    //console.log('connect:', connected)
/* TODO: максимальный объем выдаваемый насосом 2 мл/мин для KAMOER */

    const typesOil = {ATF: 0, TAD: 1}
    let Oil// = typesOil.ATF
    //let T = pump.period // используется для режима настройки - пауза между каплями (фиксированное)
    let T = 0
    let tmpPump = pump
    let fToggle = false
    let fOnOffPump = false
    let is_atf// = true
    let is_tad17// = false
    const maxProcentT = 98

    $: if (!connected) document.location.reload()

    $: fStd = (!tmpPump.usr)? true : false
    $: fUsr = (tmpPump.usr)? true : false

    $: is_atf = (Oil == typesOil.ATF)? true : false
    $: is_tad17 = (Oil == typesOil.TAD)? true : false

    $: {
      if (ver.hw[0] == 'B') T = 5000 // перистальтический насос
      if (ver.hw[0] == 'A') T = 500 //  самодельный насос (устаревшее)
      if (ver.hw[0] == 'C') { // мембранный насос с клапаном
        T = 1000
        if (is_atf) T = 500
        if (is_tad17) T = 2000
      }
    }
    //$: if ((is_atf) && (ver.hw[0] == 'C')) T = T/2
    //$: if ((is_tad17) && (ver.hw[0] == 'C')) T = T*2

    //$: if ()
    $: rangeValues = [
      [{

        value: (tmpPump.dpms * 100 / T > maxProcentT)? maxProcentT : tmpPump.dpms * 100 / T,
       // name_value: "%",
        minValue: 0, //(ver.hw[0] == 'C')? 2 : 1,
        maxValue: 100,
        stepValue: 5,
        scale: false,
        scaleStep: 4,
        icon: "icon-drop",
        icon2: "icon-dropfill",
        rangeChange: (e)=>{
          if (e == 0) e = 1;
          tmpPump.dpms = T * e/100;
          store.dispatch('sendPump', tmpPump);
        },
        toggle: true,
        toggleCheck: fOnOffPump,
        onCtrlToggle: (e) => {
          log(e.detail[0])
          fToggle = e.detail[0]
        }
      },
      {
/*         title: "Объем масла", */
        value: (tmpPump.dpms * 100 / T > maxProcentT)? maxProcentT : tmpPump.dpms * 100 / T,
       // name_value: "%",
        minValue: 0, //(ver.hw[0] == 'C')? 2 : 1,
        maxValue: 100,
        stepValue: 5,
        scale: false,
        icon: "icon-drop",
        icon2: "icon-dropfill",
        rangeChange: (e)=>{
          if (e == 0) e = 1;
          tmpPump.dpms = T * e/100;
          store.dispatch('sendPump', tmpPump);
        },
        toggle: true,
        toggleCheck: fOnOffPump,
        onCtrlToggle: (e) => {
          log(e.detail[0])
          fToggle = e.detail[0]
        }
      },],
      [{
        title: "Время вкл.",
        value: tmpPump.dpms,
        name_value: $t('ms'),
        minValue: 0,
        maxValue: 5000,
        stepValue: 50,
        scale: true,
/*         scaleStep: 6,
        sacaleSubSteps: 2, */
/*         icon: "icon-drop",
        icon2: "icon-dropfill", */
        rangeChange: (e)=>{
          if (e == 0) e = 10;
          tmpPump.dpms = e;
          store.dispatch('sendPump', tmpPump);
        },
        toggle: true,
        toggleCheck: fOnOffPump,
        onCtrlToggle: (e) => {
          log(e.detail[0])
          fToggle = e.detail[0]
        }
      },
      {
        title: "Время выкл.",
        value: tmpPump.dpdp,
        name_value: $t('ms'),
       // name_value: "%",
        minValue: 0,
        maxValue: 1000,
        stepValue: 50,
        scale: true,
/*         icon: "icon-drop",
        icon2: "icon-dropfill", */
        rangeChange: (e)=>{
          if (e == 0) e = 10;
          tmpPump.dpdp = e;
          store.dispatch('sendPump', tmpPump);
        },
      }],
    ]

    let Tdpdp = 2000
    $: if (tmpPump.usr) Tdpdp = tmpPump.dpdp
    $: store.dispatch('ctrlPump', [fToggle, 0, {dpms: tmpPump.dpms, dpdp: Tdpdp}])
    //$: if (!tmpPump.usr) Tdpdp = 2000

    function pageBeforeIn() {
      /* включить режим настройки вязкости */
      store.dispatch('modeWork', store.state.OILER_VISCOSITY)
      Oil = localStorage.getItem('oil')
/*       if (Oil == typesOil.ATF) {
        is_atf = true;
        is_tad17 = false;
      }
      if (Oil == typesOil.TAD) {
        is_atf = false;
        is_tad17 = true;
      } */
      //log('[TmpPump = ]', pump.period)
      //tmpPump = pump
    }

    function pageAfterOut() {
      fOnOffPump = false
      /* Отключить режим управления насосом */
      store.dispatch('ctrlPump', [false, 0, {dpms: tmpPump.dpms, dpdp: 800}])
      /* включить автоматический режим работы смазчика */
      store.dispatch('modeWork', store.state.OILER_AUTO)
      /* сохранить настройки */
      //store.dispatch('sendPump', tmpPump)
    }
  </script>
