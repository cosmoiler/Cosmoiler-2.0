<Page
  name="root"
  class={`page`}>

    <Views
        init={true}
        tabs
        class="safe-areas">

        <Toolbar tabbar labels bottom>
          {#each itemsToolbar as {link, icon, text, active}}
            <Link tabLink={link} icon={icon} text={text} tabLinkActive={active} />
          {/each}
        </Toolbar>

        {#each itemsViews as {id, name, main, tab, tabActive, url}}
          <View id={id} name={name} main={main} tab={tab} tabActive={tabActive} url={url} animate={true} class="safe-areas"/>
        {/each}
    </Views>
</Page>


<script>
    import {
        Views,
        View,
        Toolbar,
        Page,
        Link,
        useStore
    } from 'framework7-svelte';
    import {t} from '../services/i18n.js';


    let connected = useStore('connected', (value) => connected = value);

    let itemsToolbar = [
        {link: '#view-home',      text: $t('Cosmoiler'),      icon: "icon-rocket",            tabLinkActive: true},
        {link: '#view-telemetry', text: $t('home.telemetry'), icon: "icon-telemetry-outline", tabLinkActive: false},
        {link: '#view-settings',  text: $t('home.settings'),  icon: "icon-settings",          tabLinkActive: false},
        {link: '#view-service',   text: $t('home.service'),   icon: "icon-service",           tabLinkActive: false},
    ]

    $: itemsViews = [
      {id: 'view-home',                         name: 'main',       url: '/',           main: true,   tab: true, tabActive: true},
      {id: (connected) ? 'view-telemetry' : '', name: 'telemetry',  url: '/telemetry/', main: false,  tab: true, tabActive: false},
      {id: (connected) ? 'view-settings'  : '', name: 'settings',   url: '/settings/',  main: false,  tab: true, tabActive: false},
      {id: 'view-service',                      name: 'service',    url: '/service/',   main: false,  tab: true, tabActive: false},
    ]

</script>
