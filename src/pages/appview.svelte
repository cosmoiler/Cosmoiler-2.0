<Page
  name="root"
  class={`page`}>

    <Views
        init={true}
        tabs
        class="safe-areas">

        <!--
          ! Подписи в таббаре на узких экранах.
          tabbar--compact — подписи не влезают совсем, вместо них крупные иконки.
          --f7-tabbar-label-size — подобранный размер подписи.
          Оба значения ставятся по ФАКТУ ЗАМЕРА, см. скрипт ниже.
        -->
        <Toolbar
            tabbar
            labels
            bottom
            class={iconOnly ? 'tabbar--compact' : ''}
            style={labelSize ? `--f7-tabbar-label-size: ${labelSize}px` : ''}>
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
    import { onMount } from 'svelte';
    import {t} from '../services/i18n.js';


    let connected = useStore('connected', (value) => connected = value);

    /**
     * ! Узкий экран: подписи в таббаре не умещаются.
     *
     * Решение в два шага:
     *   1) подпись уменьшается ровно настолько, чтобы влезть, но не ниже
     *      MIN_LABEL_SIZE (мельче — уже нечитаемо);
     *   2) если и этого мало — подписи прячутся, а иконки увеличиваются.
     *
     * Почему замером, а не media-запросом по ширине экрана: не хватит места или
     * нет — зависит не только от ширины, но и от длины подписи (она приходит из
     * перевода) и от системного шрифта устройства. При одной ширине экрана на
     * разных телефонах результат получается разный.
     *
     * Замеры при штатном шрифте 17px (наследуется от iOS-темы):
     *     ширина экрана  вкладке достаётся  «Cosmoiler» занимает
     *         320px             60px               75px   -> не влезает
     *         360px             70px               75px   -> не влезает
     *         412px             83px               75px   -> влезает
     * ⚠️ Штатный размер оказался 17px, а не 13px: переменная
     * --f7-tabbar-label-font-size из app.less не работает — Framework7 применяет
     * её только под классом .tabbar-icons, которого у нас нет.
     *
     * Подобранный размер отдаётся в CSS переменной --f7-tabbar-label-size, поэтому
     * замер не зависит от того, что уже применено: базовый шрифт всегда читается
     * у ССЫЛКИ (.tab-link), а не у подписи, которую мы перекраиваем.
     */
    const MIN_LABEL_SIZE = 12;   // px — мельче подпись уже нечитаема

    let labelSize = 0;      // 0 — подписи умещаются в штатном размере
    let iconOnly = false;   // true — не влезают совсем, показываем одни иконки

    onMount(() => {
        const ctx = document.createElement('canvas').getContext('2d');
        let frame = 0;

        const check = () => {
            frame = 0;
            const bar = document.querySelector('.tabbar');
            if (!bar) return;
            const links = [...bar.querySelectorAll('.tab-link')];
            if (links.length !== itemsToolbar.length) return;

            // Базовый шрифт берём у ссылки: подпись его наследует, а саму подпись
            // мы переопределяем — читать размер у неё значило бы зациклиться.
            const base = getComputedStyle(links[0]);
            const baseSize = parseFloat(base.fontSize);
            ctx.font = `${base.fontStyle} ${base.fontWeight} ${baseSize}px ${base.fontFamily}`;

            // Насколько в худшем случае не хватает места (>1 — не влезает).
            let worst = 0;
            for (let i = 0; i < links.length; i++) {
                const need = ctx.measureText(itemsToolbar[i].text).width;
                const avail = links[i].clientWidth - 2;
                if (avail > 0) worst = Math.max(worst, need / avail);
            }

            let nextSize = 0;
            let nextIconOnly = false;
            if (worst > 1) {
                const fits = Math.floor(baseSize / worst);
                if (fits >= MIN_LABEL_SIZE) nextSize = fits;
                else nextIconOnly = true;
            }

            // Присваиваем только при изменении: иначе наблюдатель за размерами
            // будил бы сам себя.
            if (nextSize !== labelSize) labelSize = nextSize;
            if (nextIconOnly !== iconOnly) iconOnly = nextIconOnly;
        };

        // Измерение читает layout — делаем это не чаще одного раза за кадр.
        const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };

        schedule();
        const observer = new ResizeObserver(schedule);
        observer.observe(document.documentElement);
        window.addEventListener('orientationchange', schedule);

        return () => {
            observer.disconnect();
            window.removeEventListener('orientationchange', schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    });

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
