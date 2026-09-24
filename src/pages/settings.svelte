<!--
  ! Верхний Toolbar вынесен в fixedContent страницы.
  !
  ! Framework7 9 отводит место под верхний тулбар селектором-«соседом»:
  !     .toolbar-top ~ * { --f7-page-toolbar-top-offset: var(--f7-toolbar-height) }
  ! то есть тулбар обязан лежать на уровне .page РЯДОМ с .page-content, а
  ! отступ считает сам .page-content (page.less).
  !
  ! framework7-svelte 9 по умолчанию заворачивает всё содержимое <Page> в
  ! .page-content, поэтому тулбар оказывался ВНУТРИ него: переменная
  ! выставлялась элементам-соседям по содержимому, а не самому .page-content,
  ! и первый элемент списка уезжал под тулбар (наложение 32px при высоте 56px).
  ! В F7 6 этой проблемы не было — там структура страницы была другой.
  !
  ! fixedContent рендерится вне .page-content (page.svelte), поэтому селектор
  ! `~ *` снова работает. Внутри — {#if}, чтобы при отсутствии связи тулбара
  ! не было вовсе (его вкладки живут в ветке {:else}).
-->
{#snippet settingsToolbar()}
  {#if connected}
    <Toolbar top tabbar >
      <Link tabLink="#tab-trip" tabLinkActive>{$t('settings.tab.odo.title')}</Link>
      <Link tabLink="#tab-time">{$t('settings.tab.tmr.title')}</Link>
      <Link tabLink="#tab-manual">{$t('settings.tab.man.title')}</Link>
    </Toolbar>
  {/if}
{/snippet}

<Page
  name="settings"
  class={`page`}
  onPageBeforeIn={refreshSensorMark}
  fixedContent={settingsToolbar}>

<Navbar title={$t('home.settings')} />

{#if !connected}
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
{:else}

    <Tabs >
      <Tab id="tab-trip" tabActive >
        <List>
          {#each items_odo.slice(0,2) as {link, title, icon, size, footer}}
            <!-- ! Сниппеты объявлены внутри {#each}: они захватывают переменные
                 цикла, поэтому для каждого элемента получается своё содержимое.
                 Это замена slot="media" / slot="footer" из Framework7 6. -->
            {#snippet mediaSlot()}<Icon icon={icon} style="font-size: {size}px" />{/snippet}
            {#snippet footerSlot()}{footer}{/snippet}
            <ListItem link={link} {title} class={`settings-main__list-item`}
              media={mediaSlot} footer={footerSlot} />
          {/each}
          {#snippet odoMediaSlot()}<Icon icon={items_odo[2].icon} style="font-size: {items_odo[2].size}px" />{/snippet}
          {#snippet odoAfterSlot()}<span>{sensorMark}</span>{/snippet}
          <ListItem title={items_odo[2].title} link={items_odo[2].link} class={`settings-main__list-item`}
            media={odoMediaSlot} after={odoAfterSlot} footer={items_odo[2].footer}/>
        </List>
      </Tab>
      <Tab id="tab-time" >
        <List>
          {#each items_timer as {link, title, icon, size, footer}}
            {#snippet mediaSlot()}<Icon icon={icon} style="font-size: {size}px" />{/snippet}
            {#snippet footerSlot()}{footer}{/snippet}
            <ListItem link={link} {title} class={`settings-main__list-item`}
              media={mediaSlot} footer={footerSlot} />
          {/each}
        </List>
      </Tab>
      <Tab id="tab-manual" >
        <List>
          {#each items_manual as {link, title, icon, size, footer}}
            {#snippet mediaSlot()}<Icon icon={icon} style="font-size: {size}px" />{/snippet}
            {#snippet footerSlot()}{footer}{/snippet}
            <ListItem link={link} {title} class={`settings-main__list-item`}
              media={mediaSlot} footer={footerSlot} />
          {/each}
        </List>
      </Tab>
    </Tabs>
{/if}

</Page>

<script>
  import {
    Page,
    Navbar,
    List,
    ListItem,
    Toolbar,
    Link,
    Tabs,
    Tab,
    Icon,
    BlockTitle,
    useStore
  } from 'framework7-svelte';
  import {t} from '../services/i18n.js';
  //import store from '../js/store.js';

  let connected = useStore('connected', (value) => connected = value);
  let odometer = useStore('odometer', (value) => odometer = value);
  let gnssPresent = useStore('gnssPresent', (value) => gnssPresent = value);


  let items_odo = [
    {
      link: '/settings/odometer/presets/',
      title: $t('settings.presets.title'),
      footer: $t('settings.presets.odo.description'),
      icon: 'icon-preset',
      size: 24
    },
    {
      link: '/settings/pump/',
      title: $t('settings.pump.title'),
      footer: $t('settings.pump.description'),
      icon: 'icon-pump', size: 28
    },
    //{link: '#', title: 'Датчик',  footer: "", icon: 'icon-sensor', size: 28},
    {
      link: '/settings/odometer/sensor/',
      title: $t('settings.sensor.title'),
      footer: $t('settings.sensor.description'),
      icon: 'icon-sensor',
      size: 28
    },
  ]

  let items_timer = [
    {
      link: '/settings/timer/presets/',
      title: $t('settings.presets.title'),
      footer: $t('settings.presets.tmr.description'),
      icon: 'icon-preset',
      size: 24
    },
    {
      link: '/settings/pump/',
      title: $t('settings.pump.title'),
      footer: $t('settings.pump.description'),
      icon: 'icon-pump',
      size: 28
    },
  ]

  let items_manual = [
    {
      link: '/settings/manual/',
      title: $t('settings.presets.title'),
      footer: $t('settings.presets.manual.description'),
      icon: 'icon-preset', size: 24},
  ]

  /**
   * ! Пометка выбранного датчика в строке «Датчик» (сниппет odoAfterSlot): GPS или IMP.
   *
   * Источник — ВЫБОР пользователя (odometer.sensor.gnss), а не gnssPresent.gps
   * («модуль ГНСС установлен»): иначе в строке всегда стояло GPS, даже когда выбран
   * импульсный датчик. Условие повторяет fGPS страницы датчика (sensor.svelte).
   *
   * Значение пересчитывается при КАЖДОМ показе страницы (onPageBeforeIn), а не
   * реактивно: страница датчика меняет поле sensor.gnss прямо в объекте состояния
   * стора, подписчики стора об этом не уведомляются, и реактивное значение осталось
   * бы прежним. Сам объект берём из подписки useStore — это тот же объект состояния,
   * что и у приложения.
   *
   * ! Прямой import store тут не годится: в режиме разработки Vite подменяет модуль
   * при HMR (store.js?t=...), и второй импорт получает ДРУГОЙ экземпляр стора со
   * значениями по умолчанию — проверено замером: строка всегда показывала GPS.
   *
   * «GPS» и «IMP» — сокращения-маркеры, поэтому в локали не выносятся.
   */
  let sensorMark = ''
  function refreshSensorMark() {
    sensorMark = (odometer?.sensor?.gnss && gnssPresent?.gps) ? "GPS" : "IMP"
  }

</script>
