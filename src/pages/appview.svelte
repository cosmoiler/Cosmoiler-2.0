<Page
  name="root"
  class={`page`}>

    <Views
        init={true}
        tabs
        class="safe-areas">

        <Toolbar tabbar labels bottom>
          {#each itemsToolbar as {link, icon, text, tabLinkActive}}
            <!--
              ! Иконка — свой <span>, а НЕ проп icon у Link.

              В MD-теме Framework7 9 псевдоэлемент ::before у иконки таббара занят
              подложкой-«пилюлей» активной вкладки:
                  .md .tabbar i.icon::before { content: ''; ... opacity: 0 }
                  .md .tabbar .tab-link-active i.icon::before { opacity: 1 }
              Из-за content: '' глиф fontello ПРОПАДАЕТ (у этого селектора
              специфичность выше, чем у .icon-rocket:before), а при выборе вкладки
              видно саму «пилюлю» — это и был артефакт.

              Перекрыть контент нельзя: код глифа у каждой иконки свой. Поэтому
              иконка вынесена в <span class="icon ..."> — под селектор `i.icon`
              он не попадает, а глиф рисуется правилом fontello как обычно.
              Своё содержимое <Link> рендерит через {\@render children}.
            -->
            <Link tabLink={link} tabLinkActive={tabLinkActive} text={text} tabbarLabel={true}>
              <span class={`icon ${icon}`}></span>
            </Link>
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
