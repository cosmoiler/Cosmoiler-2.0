<Page
  name="wifi"
  class={`page`}
  pageContent={true}
  onPageAfterOut={pageAfterOut}>

  <Navbar title={$t('service.wifi.title')} />

  <!--
    ! Секция «Точка доступа» — карточка .section-card, как на страницах System /
    ! Датчик / Насос (стили в css/app.less): шапка-полоса #f8f8f3, белое тело,
    ! бежевая нижняя строка с тумблером.
    !
    ! Класс settings-main__list-item у строк убран: он даёт бежевый #f8f8f3, то
    ! есть тело карточки слилось бы с её шапкой. Тумблеру «Всегда включено»
    ! вместо него поставлен .row-tint — тот же нижний бежевый ряд, что у карточки
    ! «Прокачка» на странице System.
  -->
  <div class="section-card">
    <BlockTitle><span>{$t('service.wifi.ap.title')}</span></BlockTitle>
    <List>
      {#snippet ssidLabel()}<div class="list-input__label list-input__label-text_color">SSID</div>{/snippet}
      <ListInput
        type="text"
        placeholder={$t('service.wifi.ap.ssid.plchldr')}
        bind:value={system.ap.ssid}
        label={ssidLabel}
        clearButton
      />
      {#snippet pswLabel()}<div class="list-input__label list-input__label-text_color">{$t('service.wifi.ap.psw.title')}</div>{/snippet}
      <ListInput
        type="password"
        placeholder={$t('service.wifi.ap.psw.plchldr')}
        bind:value={system.ap.psw}
        label={pswLabel}
        clearButton
      />
      {#snippet alwTitle()}<div class="list-input__label list-input__label-text_color">{$t('service.wifi.ap.alwson.title')}</div>{/snippet}
      {#snippet alwAfter()}<Toggle bind:checked={system.ap.pwr} />{/snippet}
      <ListItem class={`row-tint`}
        title={alwTitle}
        after={alwAfter}
      />
    </List>
  </div>

</Page>

<script>
    import {
      Page,
      List,
      ListItem,
      ListInput,
      Navbar,
      BlockTitle,
      Toggle,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import store from '../../js/store.js';

    let connected = useStore('connected', (value) => connected = value);
    let system = useStore('system', (value) => system = value);
    let pending = useStore('pending', (value) => pending = value);

    // ! Без location.reload при потере связи (этап 2, firmware docs/web-frontend.md §13):
    //   без связи — надпись «Нет связи», как раньше; после восстановления вкладки
    //   возвращаются к началу и настройки перечитываются (store.js onLinkUp).

    function pageAfterOut() {
      pending.system.set("ap", system.ap)
      store.dispatch('sendSystem', system)
    }
  </script>
