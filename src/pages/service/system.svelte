<Page
    name="system"
    class={`page`}
    pageContent={true}
    on:pageBeforeIn={pageBeforeIn}
    on:pageAfterOut={pageAfteOut} >

    <Navbar title={$t('service.system.title')} backLink="Back" />

    {#if connected}
        <BlockTitle ><span>{$t('service.system.pumping.title')}</span></BlockTitle>
        <List >
            <ListItem style="background-color: var(--f7-theme-color-bg-tint-color)">
                <ListItemCell class="width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.pumping.text_toggle')}</ListItemCell>
                <ListItemCell class="width-auto flex-shrink-4"><Toggle bind:checked={ctrlpump}  /></ListItemCell>
            </ListItem>
        </List>

    <!-- Управление яркостью светодиода -->
        {#each rangeValues[0] as rangeValue}
        <Ranges {...rangeValue} />
        {/each}

    <!-- Управление обучением включения выключения -->
        <BlockTitle ><span>{$t('service.system.onoff.title')}</span></BlockTitle>
        <Block mediumInset>
          <p><i>
            Осуществляет подбор параметров для функции автоматического включения и выключения смазчика.<br>
            </i>
          </p>
          <p><i style="font-weight: 600">ВНИМАНИЕ!</i> <i>Для правильной работы функции при обучении строго
            следуйте инструкции.</i></p>
        </Block>
        <List >
            <ListItem style="background-color: var(--f7-theme-color-bg-tint-color)">
              {#if !AItraining}
                <ListItemCell class="width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.onoff.text_toggle1')}</ListItemCell>
              {:else}
                <ListItemCell class="width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.onoff.text_toggle2')}</ListItemCell>
              {/if}
                <ListItemCell class="width-auto flex-shrink-4"><Toggle bind:checked={AItraining} bind:disabled={disabled}  /></ListItemCell>
            </ListItem>
        </List>

        <!-- Управление режимом определения Fake GPS -->
        <BlockTitle ><span>{$t('service.system.fakegps.title')}</span></BlockTitle>
        <Block mediumInset>
          <p><i>
            Включает возможность обнаружения спуффинга сигнала GPS и интеллектуального переключения между
            режимами работы "Одометр" и "Таймер".<br>
            </i>
          </p>
          <p><i style="font-weight: 600">ПРЕДУПРЕЖДЕНИЕ!</i> <i>Функция экспериментальная.</i></p>
        </Block>
        <List >
            <ListItem style="background-color: var(--f7-theme-color-bg-tint-color)">
                <ListItemCell class="width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.fakegps.text_toggle')}</ListItemCell>
                <ListItemCell class="width-auto flex-shrink-4"><Toggle bind:checked={fakegps}  /></ListItemCell>
            </ListItem>
        </List>
    {/if}

</Page>

<script>
    import {
      Page,
     // Button,
      Block,
      List,
      ListItem,
      ListItemCell,
      Navbar,
      BlockTitle,
      Toggle,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import Ranges from '../../components/range-param.svelte'
    import store from '../../js/store.js';
    import log from '../../js/debug.js';


    let connected = useStore('connected', (value) => connected = value);
    let system = useStore('system', (value) => system = value);
    let mapSettings = useStore('mapSettings', (value) => mapSettings = value);
    let ver = useStore('ver', (value) => ver = value);

    let tmpSystem = system
    let ctrlpump = false
    let AItraining = false
    let disabled = false
    let fakegps = tmpSystem.fake;

    let Tdpms = 0
    $: {
      if (ver.hw[0] == 'B') Tdpms = 1000
      if (ver.hw[0] == 'C') Tdpms = 1000 // 10 секунд работает насос
      if (ver.hw[0] == 'd') Tdpms = 1000 // hw: dev - 10 секунд работает насос
    }


    $: if (!connected) document.location.reload()
    $: {
      if (ctrlpump) store.dispatch('modeWork', store.state.OILER_PUMPING)
      else store.dispatch('modeWork', store.state.OILER_AUTO)
      store.dispatch('ctrlPump', [ctrlpump, 0, {dpms: Tdpms, dpdp: 1}])
    }

    $: store.dispatch('fakeGPS', fakegps)

    $: rangeValues = [
      [{
        title: $t('service.system.led.title'),
        value: tmpSystem.bright * 100 / 255,
       // name_value: "%",
        minValue: 1,
        maxValue: 100,
        stepValue: 1,
        scale: false,
        icon: "icon-light",
        icon2: "icon-light-fill",
        rangeChange: (e)=>{
          tmpSystem.bright = Math.trunc(e * 255 / 100)
          store.dispatch('ctrlBright', tmpSystem.bright)
        },
        toggle: false,
      }],
    ]

    $: if (AItraining) store.dispatch('modeWork', store.state.OILER_TRAINING)
    $: disabled = AItraining || ctrlpump

    function pageBeforeIn() {
      /* включить режим настройки вязкости */
      //store.dispatch('modeWork', store.state.OILER_PUMPING)
    }

    function pageAfteOut() {
      /* включить автоматический режим работы смазчика */
      store.dispatch('modeWork', store.state.OILER_AUTO)
      mapSettings.set("bright", tmpSystem.bright)
      store.dispatch('sendSystem', tmpSystem)
    }

</script>
