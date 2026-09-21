<Page
  name="wifi"
  class={`page`}
  pageContent={true}
  onPageAfterOut={pageAfteOut}>

  <Navbar title={$t('service.wifi.title')} backLink="Back" />

  <BlockTitle><span>{$t('service.wifi.ap.title')}</span></BlockTitle>
  <List class={`settings-main__list-item`}>
    {#snippet ssidLabel()}<div class="list-input__label list-input__label-text_color">SSID</div>{/snippet}
    <ListInput class={`settings-main__list-item`}
      type="text"
      placeholder={$t('service.wifi.ap.ssid.plchldr')}
      bind:value={system.ap.ssid}
      label={ssidLabel}
      clearButton
    />
    {#snippet pswLabel()}<div class="list-input__label list-input__label-text_color">{$t('service.wifi.ap.psw.title')}</div>{/snippet}
    <ListInput class={`settings-main__list-item`}
      type="password"
      placeholder={$t('service.wifi.ap.psw.plchldr')}
      bind:value={system.ap.psw}
      label={pswLabel}
      clearButton
    />
    {#snippet alwTitle()}<div class="list-input__label list-input__label-text_color">{$t('service.wifi.ap.alwson.title')}</div>{/snippet}
    {#snippet alwAfter()}<Toggle bind:checked={system.ap.pwr} />{/snippet}
    <ListItem class={`settings-main__list-item`}
      title={alwTitle}
      after={alwAfter}
    />
  </List>

  {#if false}
  <BlockTitle><span>{$t('service.wifi.sta.title')}</span></BlockTitle>
  <List>
    {#snippet staSsidLabel()}<div class="list-input__label list-input__label-text_color">SSID</div>{/snippet}
    <ListInput class={`settings-main__list-item`}
      type="text"
      placeholder="Введите имя"
      bind:value={system.sta.ssid}
      label={staSsidLabel}
    />
    {#snippet staPswLabel()}<div class="list-input__label list-input__label-text_color">Пароль</div>{/snippet}
    <ListInput class={`settings-main__list-item`}
      type="password"
      placeholder="Введите пароль"
      bind:value={system.sta.psw}
      label={staPswLabel} />
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
