<Page
  name="settings"
  class={`page`}>



{#if !connected}
    <Navbar title={$t('home.settings')} />
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
{:else}

    <Navbar title={$t('home.settings')} />

    <Toolbar top tabbar >
      <Link tabLink="#tab-trip" tabLinkActive>{$t('settings.tab.odo.title')}</Link>
      <Link tabLink="#tab-time">{$t('settings.tab.tmr.title')}</Link>
      <Link tabLink="#tab-manual">{$t('settings.tab.man.title')}</Link>
    </Toolbar>

    <Tabs >
      <Tab id="tab-trip" tabActive >
        <List>
          {#each items_odo.slice(0,2) as {link, title, icon, size, footer}}
            <ListItem link={link} title={title} class={`settings-main__list-item`}>
              <div slot='media'><Icon icon={icon} style="font-size: {size}px" /></div>
              <div slot='footer'>{footer}</div>
            </ListItem>
          {/each}
          <ListItem title={items_odo[2].title} link={items_odo[2].link} class={`settings-main__list-item`}>
            <div slot='media'><Icon icon={items_odo[2].icon} style="font-size: {items_odo[2].size}px" /></div>
            <div slot='after'><span>{gnss}</span></div>
            <!-- <div slot='after'><span>GPS</span></div> -->
          </ListItem>
        </List>
      </Tab>
      <Tab id="tab-time" >
        <List>
          {#each items_timer as {link, title, icon, size, footer}}
            <ListItem link={link} title={title} class={`settings-main__list-item`}>
              <div slot='media'><Icon icon={icon} style="font-size: {size}px" /></div>
              <div slot='footer'>{footer}</div>
            </ListItem>
          {/each}
        </List>
      </Tab>
      <Tab id="tab-manual" >
        <List>
          {#each items_manual as {link, title, icon, size}}
            <ListItem link={link} title={title} class={`settings-main__list-item`}>
              <div slot='media'><Icon icon={icon} style="font-size: {size}px" /></div>
            </ListItem>
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
  //let odometer = useStore('odometer', (value) => odometer = value);
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
      title: 'Насос',
      footer: $t('settings.pump.description'),
      icon: 'icon-pump', size: 28
    },
    //{link: '#', title: 'Датчик',  footer: "", icon: 'icon-sensor', size: 28},
    {
      link: '/settings/odometer/sensor/',
      title: 'Датчик',
      footer: "",
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
      title: 'Насос',
      footer: $t('settings.pump.description'),
      icon: 'icon-pump',
      size: 28
    },
  ]

  let items_manual = [
    {link: '/settings/manual/', title: $t('settings.presets.title'), icon: 'icon-preset', size: 24},
  ]

  $: gnss = (gnssPresent.gps) ? "GPS" : $t("settings.sensor.impulse")

</script>
