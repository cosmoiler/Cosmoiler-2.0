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
    {/if}

</Page>

<script>
    import {
      Page,
     // Button,
     // Block,
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

    let Tdpms = 0
    $: {
      if (ver.hw[0] == 'B') Tdpms = 1000
      if (ver.hw[0] == 'C') Tdpms = 1000 // 10 секунд работает насос
    }


    $: if (!connected) document.location.reload()
    $: store.dispatch('ctrlPump', [ctrlpump, 0, {dpms: Tdpms, dpdp: 1}])

    $: rangeValues = [
      [{
        title: "Яркость светодиода",
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

    function pageBeforeIn() {
      /* включить режим настройки вязкости */
      store.dispatch('modeWork', store.state.OILER_PUMPING)
    }

    function pageAfteOut() {
      /* включить автоматический режим работы смазчика */
      store.dispatch('modeWork', store.state.OILER_AUTO)
      mapSettings.set("bright", tmpSystem.bright)
      store.dispatch('sendSystem', tmpSystem)
    }

</script>
