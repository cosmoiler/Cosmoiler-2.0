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
    // ! Интеграция роутера с историей браузера.
    //
    // Зачем: стрелку «назад» в навбаре убрали, назад возвращает ШТАТНАЯ кнопка
    // телефона. Но сама по себе она не работает — приложение не создавало
    // записей в истории (замер до правки: history.length остаётся 1 при
    // переходах по страницам), и системный «назад» уводил из приложения.
    //
    // С включённой опцией F7 кладёт маршрут в адресную строку (разделитель
    // по умолчанию '#!/' — hash в сеть не уходит, устройство отдаёт тот же
    // index.html) и сам слушает popstate: системный «назад» превращается
    // в router.back(). На iOS дополнительно работает штатный свайп от края.
    //
    // router — верхний уровень (вкладки), view — вложенные страницы
    // (например /settings/pump/): истории у них свои, поэтому опция задана обоим.
    //
    // ⚠️ browserHistoryOnLoad: false обязателен. По умолчанию он true, и тогда
    // при загрузке F7 разбирает адрес и раздаёт его ВСЕМ представлениям: без
    // хэша в адресе начальным маршрутом для каждой вкладки становится '/', и во
    // всех четырёх оказывается одна и та же страница home (проверено — вкладка
    // «Настройки» показывала содержимое главной, а её собственные страницы
    // не загружались вовсе). С false адрес только ЗАПИСЫВАЕТСЯ при переходах,
    // а начальные маршруты берутся из url каждого представления, как раньше.
    router: { browserHistory: true, browserHistoryOnLoad: false },
    view: { browserHistory: true, browserHistoryOnLoad: false },
    // App routes
    routes: routes,
  };

  onMount(() => {

    f7ready(() => {
      // Call F7 APIs here
      store.dispatch('init')
    });
  })

</script>
