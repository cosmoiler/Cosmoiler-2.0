<App { ...f7params } >

  <Main/>

</App>

<script>
  import { onMount } from 'svelte';
  import {
    f7ready,
    App,
  } from 'framework7-svelte';

  import routes from '../js/routes';
  import store from '../js/store';
  import { initBackButton } from '../js/backButton.js';
  import { initTabReset } from '../js/tabReset.js';
  import { initKeepAwake } from '../js/keepAwake.js';
  import Main from '../pages/appview.svelte';

  // Framework7 Parameters
  let f7params = {
    name: 'Cosmoiler 2.0', // App name
    // ! ПРОБА: включена тема iOS.
    // Штатное значение — 'auto': Framework7 сам выбирает iOS или Material по
    // устройству. Здесь тема задана жёстко, чтобы посмотреть на iOS-оформление
    // на десктопе. Вернуть — заменить 'ios' на 'auto'.
    theme: 'ios',

    id: 'com.cosmoiler.app', // App bundle ID
    // App store
    store: store,
    // ! История браузера роутером НЕ ведётся (browserHistory: false — умолчание F7).
    //
    // Стрелки «назад» в навбаре нет, назад возвращает ШТАТНАЯ кнопка телефона.
    // Раньше для этого был включён browserHistory: F7 клал каждый маршрут в адрес
    // (…/#!/settings/pump/), и в истории браузера копились адреса страниц.
    // Теперь кнопку «назад» обслуживает ../js/backButton.js: запись в истории
    // на каждый переход вглубь остаётся, но с тем же адресом (см. описание в модуле).
    //
    // ⚠️ Если browserHistory когда-нибудь вернут — только вместе с
    // browserHistoryOnLoad: false (иначе при загрузке все вкладки получают
    // маршрут '/' и показывают главную) и без backButton.js (обработчики
    // popstate будут мешать друг другу).
    // App routes
    routes: routes,
  };

  onMount(() => {

    f7ready((f7) => {
      // Call F7 APIs here
      store.dispatch('init')
      initBackButton(f7)
      // Смена вкладки закрывает вложенную страницу (её выход: сохранение, /state/auto)
      initTabReset(f7)
      // Экран телефона не гаснет, пока открыт интерфейс (с первого касания)
      initKeepAwake()
    });
  })

</script>
