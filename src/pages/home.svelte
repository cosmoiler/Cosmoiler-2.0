<Page
  name="home"
  class={`page`}
  ptr
  on:ptrRefresh={loadMore}
  on:pageTabShow={pageTabShow}>

  <!-- Top Navbar -->
  <Navbar sliding={true}>
    <div sliding slot="title" class="navbar-title">
      <span>Cosmoiler</span>
      <span class="navbar-title__ver"></span>
    </div>
  </Navbar>

  {#if connected}
    <BlockTitle style='background-color: var( --f7-theme-color-bg-color)'>{$t('home.selectmode')}</BlockTitle>
    <!-- <Button on:click={() => { store.state.connect =  !store.state.connect}}>Connect = {store.state.connect}</Button> -->
  {:else}
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
    <!-- <Button on:click={() => { store.state.connect =  !store.state.connect}}>Connect = {store.state.connect}</Button> -->
  {/if}

  {#if !connected}
  <!--  <div transition:fade="{{delay: 1, duration: 1}}"> -->
    <div in:fade="{{delay: 300, duration: 300}}" out:fly="{{duration: 300}}">
      <List mediaList class={`skeleton-text skeleton-effect-wave`}>
        {#each [1,2] as n}
          <ListItem class={`home-list-item`} >
            <div slot='title' class="home-list-item__title home-list-item__title_up-color">
              <SkeletonBlock tag="div" width="80px" height="20px" borderRadius="8px" />
            </div>
            <div slot="subtitle" class="home-list-item__text home-list-item__text_margin-03rem">
              <SkeletonBlock tag="div" width="195px" height="14px" borderRadius="7px" />
            </div>
            <div slot='text' class="home-list-item__text home-list-item__text_margin-03rem">
              <SkeletonBlock tag="div" width="250px" height="20px" borderRadius="10px" />
            </div>
            <div slot='media'>
              <SkeletonBlock width="36px" height="36px" borderRadius="50%" />
            </div>
            <div slot="after">
              <SkeletonBlock tag="div" width="36px" height="18px" borderRadius="10px" />
            </div>
          </ListItem>
        {/each}
      </List>
    </div>
  {:else}
    <!-- <div transition:fade="{{delay: 250, duration: 300}}"> -->
    <div in:fade="{{delay: 300, duration: 300}}" out:fly="{{duration: 300}}">
      <List mediaList class='elevation-0'>
          <ModeItem {...items[0]} />
          <ModeItem {...items[1]} />
      </List>
    </div>
  {/if}

</Page>

<script>
  import {
    Page,
    Navbar,
    BlockTitle,
    List,
    ListItem,
    useStore,
    SkeletonBlock
  } from 'framework7-svelte';
  import { f7 } from 'framework7-svelte';
  import {t} from '../services/i18n.js';
  import store from '../js/store';
  import ModeItem from '../components/home-listitem.svelte'
  import { fade, fly } from 'svelte/transition';
  import log from '../js/debug.js'


  let gnssPresent = useStore('gnssPresent', (value) => gnssPresent = value);
  $: connected = useStore('connected', (value) => connected = value);
  let odometer = useStore('odometer', (value) => odometer = value);
  let timer = useStore('timer', (value) => timer = value);
  let mode = useStore('mode', (value) => mode = value);

  let fmodeOdometer
  let fmodeTimer

  $: if (connected) {
      //console.log('Home -> connected: %s', gnssPresent)
      log('Home -> connected: %s', gnssPresent.gps)
      fmodeOdometer = (mode.m === 1) ? true : false
      fmodeTimer = (mode.m === 2) ? true : false
  }

  $: items = [
    /**
     * ! Одометер
    */
      {
        title: $t("home.trip.title").toUpperCase(),
        subtitle: $t("home.trip.subtitle"),
        titleIcon: "icon-route",
        gpsIcon: "icon-gps",
        gnss: gnssPresent.gps,
        icons: [
          {name: "icon-city", text: $t('home.setting.trip', {values: {p: odometer.presets[store.state.presets.CITY].dst_m / 1000}})},
          {name: "icon-way", text: $t('home.setting.trip', {values: {p: odometer.presets[store.state.presets.WAY].dst_m / 1000}})},
          {name: "icon-off-road", text: $t('home.setting.trip', {values: {p: odometer.presets[store.state.presets.OFFROAD].dst_m / 1000}})},
         /*  {name: "icon-gps", text: ""}, */
        ],
        toggleCheck: fmodeOdometer,
        onSelectModeToggle: (e) => {
          fmodeOdometer = e.detail[0]
          if (fmodeOdometer) {
            fmodeTimer = false
          }
        }
      },
      /**
       * ! Таймер
      */
      {
        title: $t("home.time.title").toUpperCase(),
        subtitle: $t("home.time.subtitle"),
        titleIcon: "icon-timer",
        icons: [
          {name: "icon-city", text: $t('home.setting.time', {values: {p: timer.presets[store.state.presets.CITY].time}})},
         /*  {name: "icon-way", text: $t('home.setting.time', {values: {p: time.presets[1].dp_time}})}, */
          {name: "icon-off-road", text: $t('home.setting.time', {values: {p: timer.presets[store.state.presets.OFFROAD].time}})},
        ],
        toggleCheck: fmodeTimer,
        onSelectModeToggle: (e) => {
          fmodeTimer = e.detail[0]
          if (fmodeTimer) {
            fmodeOdometer = false
          }
        }
      },
    ]

    let tmpMode = {m: undefined, p: undefined};

    $: {
      /**
       * ! Управление переключением режимов
      */
      if (connected) {
        if (!fmodeOdometer && !fmodeTimer) tmpMode.m = 0
        else if (fmodeOdometer) tmpMode.m = 1
        else tmpMode.m = 2
        if (mode.m != tmpMode.m)
          store.dispatch('sendMode', tmpMode)
      }
    }
    $: {
      if (connected) store.dispatch('getMode')
    }
  function pageTabShow() {
    if (store.state.fChngSettings.status) {
      store.state.fChngSettings.status = false
      store.state.fChngSettings.id = []
    }
  }

  function loadMore(e, done) {
    document.location.reload()
    setTimeout(() => {
      f7.ptr.done()
    }, 2000)
  }

</script>

<style>

</style>
