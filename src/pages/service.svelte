<Page
  name="service"
  class={`page`}
  pageContent={true}>

  <Navbar title={$t('service.title')} />

  {#if !connected}
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
  {/if}

  <List mediaList inset class='elevation-3' style="border-radius: 6px;">
    <ListItem class={`settings-main__list-item`}>

      <div slot='title' class="home-list-item__title home-list-item__title_up-color">
        COSMOILER
      </div>
      <div slot="subtitle">
        <div class="home-list-item__subtitle-text home-list-item__subtitle-text_color">FW: {ver.fw}   HW: {ver.hw}</div>
      </div>
      <div slot='text' class="home-list-item__text">S/N: {ver.sn}</div>
      <img slot="media" src="icon.png" width="64" />
    </ListItem>
  </List>

  <List>
    {#each items as {link, title, view}}
      {#if view}
        <ListItem link={link} title={title} class={`settings-main__list-item`}></ListItem>
      {/if}
    {/each}
  </List>

</Page>

<script>
  import {
    Page,
    List,
    ListItem,
    Navbar,
    BlockTitle,
    useStore
  } from 'framework7-svelte';
  import {t} from '../services/i18n.js';

  let connected = useStore('connected', (value) => connected = value);
  $: ver = useStore('ver', (value) => ver = value);

  $: items = [
    {link: '/service/wifi/',    title: $t('service.wifi.title'),    view: connected},
    {link: '/service/system/',  title: $t('service.system.title'),  view: connected},
    {link: '/service/update/',  title: $t('service.update.title'),  view: true},
    {link: '/service/diag/',    title: $t('service.diag.title'),    view: true},
    {link: '/service/about/',   title: $t('service.about.title'),   view: true},
  ]

</script>
