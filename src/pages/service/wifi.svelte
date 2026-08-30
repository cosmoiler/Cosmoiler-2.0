<Page
  name="wifi"
  class={`page`}
  pageContent={true}
  on:pageAfterOut={pageAfteOut}>

  <Navbar title={$t('service.wifi.title')} backLink="Back" />

  <BlockTitle><span>{$t('service.wifi.ap.title')}</span></BlockTitle>
  <List class={`settings-main__list-item`}>
    <ListInput class={`settings-main__list-item`}
      type="text"
      placeholder={$t('service.wifi.ap.ssid.plchldr')}
      bind:value={system.ap.ssid}
      clearButton
    >
      <div slot='label' class="list-input__label list-input__label-text_color">SSID</div>
    </ListInput>
    <ListInput class={`settings-main__list-item`}
      type="password"
      placeholder={$t('service.wifi.ap.psw.plchldr')}
      bind:value={system.ap.psw}
      clearButton
    >
      <div slot='label' class="list-input__label list-input__label-text_color">{$t('service.wifi.ap.psw.title')}</div>
    </ListInput>
    <ListItem class={`settings-main__list-item`}>
      <div slot='title' class="list-input__label list-input__label-text_color">{$t('service.wifi.ap.alwson.title')}</div>
      <span slot="after">
        <Toggle bind:checked={system.ap.pwr}  />
      </span>
    </ListItem>
  </List>

  {#if false}
  <BlockTitle><span>{$t('service.wifi.sta.title')}</span></BlockTitle>
  <List>
    <ListInput class={`settings-main__list-item`}
      type="text"
      placeholder="Введите имя"
      bind:value={system.sta.ssid}
    >
      <div slot='label' class="list-input__label list-input__label-text_color">SSID</div>
    </ListInput>
    <ListInput class={`settings-main__list-item`}
      type="password"
      placeholder="Введите пароль"
      bind:value={system.sta.psw}>
      <div slot='label' class="list-input__label list-input__label-text_color">Пароль</div>
    </ListInput>
  </List>
  {/if}
</Page>

<script>
    import {
      Page,
      List,
      ListItem,
      ListInput,
      Navbar,
      BlockTitle,
      Toggle,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import store from '../../js/store.js';
    import log from '../../js/debug.js'

    let connected = useStore('connected', (value) => connected = value);
    let system = useStore('system', (value) => system = value);
    let mapSettings = useStore('mapSettings', (value) => mapSettings = value);

    $: if (!connected) document.location.reload()

    function pageAfteOut() {
      mapSettings.set("ap", system.ap)
     // mapSettings.set("sta", system.sta)
      log(mapSettings)
      store.dispatch('sendSystem', system)
    }
  </script>
