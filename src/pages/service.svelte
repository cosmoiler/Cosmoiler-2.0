<!-- ! Framework7 9: вместо slot="title"/"subtitle"/"text"/"media" — сниппеты
     с теми же именами, переданные пропсами (см. components/home-listitem.svelte). -->
{#snippet serviceTitle()}
  <div class="home-list-item__title home-list-item__title_up-color">
    COSMOILER
  </div>
{/snippet}

{#snippet serviceSubtitle()}
  <div class="home-list-item__subtitle-text home-list-item__subtitle-text_color">FW: {ver.fw}   HW: {ver.hw}</div>
{/snippet}

{#snippet serviceText()}
  <div class="home-list-item__text">S/N: {ver.sn}</div>
{/snippet}

{#snippet serviceMedia()}
  <img src="icon.png" width="64" alt="" />
{/snippet}

<Page
  name="service"
  class={`page`}
  pageContent={true}>

  <Navbar title={$t('service.title')} />

  {#if !connected}
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
  {/if}

  <!--
    ! Карточка устройства — тот же .section-card, что и на других страницах
    ! (стили в css/app.less). Было: отдельный inset-список с elevation-3 и
    ! инлайновым border-radius: 6px — единственная карточка приложения с
    ! радиусом 6px вместо 16px и со своей инлайновой тенью.
    !
    ! Теперь радиус, тень и отступы общие с карточками страниц System / Датчик /
    ! Насос, поэтому страница читается как часть приложения.
    !
    ! Класс settings-main__list-item убран: он даёт бежевый фон #f8f8f3, то есть
    ! карточка была бы залита ровно тем же цветом, что шапки других карточек, и
    ! не читалась бы как карточка (белое тело — признак тела, а не шапки).
  -->
  <div class="section-card">
    <List mediaList>
      <ListItem
        title={serviceTitle}
        subtitle={serviceSubtitle}
        text={serviceText}
        media={serviceMedia}
      />
    </List>
  </div>

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
