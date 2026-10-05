<Page
  name="pump"
  class={`page`}
  onPageBeforeIn={pageBeforeIn}
  onPageAfterOut={pageAfterOut}
  >
    <Navbar title={$t('settings.pump.title')} />

<!--     <BlockTitle>Настройка насоса под вязкость залитого масла</BlockTitle> -->
    <!--
      ! Карточки страницы — как на странице System (.section-card в css/app.less).
      !
      ! Карточек три: «Тип насоса», «Вязкость масла», «Объем масла». Вязкость нужна
      ! только штатному насосу — у дополнительного (клапана) выдачу задают времена
      ! вкл/выкл, поэтому при его выборе карточка «Вязкость масла» исчезает
      ! ({#if !tmpPump.usr}), а содержимое третьей карточки зависит от типа:
      ! штатному — шкала объема, дополнительному — времена вкл/выкл. Это не
      ! разные карточки: времена тоже задают объем выдаваемого масла, что и
      ! написано в подсказке settings.pump.nonstd.block.p1.
    -->
    <div class="section-card">
        <BlockTitle class='block-title-text_settings'>
            {$t('settings.pump.type')}
        </BlockTitle>
        <List>
            <ListItem
              radio
              name="std"
              value="std"
              title={$t('settings.pump.type.std')}
              checked={fStd}
              onChange={() => {
                tmpPump.usr = false
                applyPump();
              }}
              class={`sensor__list-item`}>
            </ListItem>
            <ListItem
              radio
              name="user"
              value="usr"
              title={$t('settings.pump.type.nonstd')}
              checked={fUsr}
              onChange={() => {
                tmpPump.usr = true
                applyPump();
              }}
              class={`sensor__list-item`}>
            </ListItem>
        </List>
    </div>

    {#if !tmpPump.usr}
    <div class="section-card">
        <BlockTitle class='block-title-text_settings'>
          {$t('settings.pump.std.viscosity')}
        </BlockTitle>
        <Block mediumInset>
          <p><i>
            {$t('settings.pump.std.viscosity.block.p1')}
            </i>
          </p>
        </Block>
        <List>
            <ListItem
              radio
              name="atf"
              value="atf"
              title={$t('settings.pump.std.viscosity.liquid')}
              checked={is_atf}
              onChange={() => {
                Oil = typesOil.ATF
               // T = 500
                localStorage.setItem('oil', Oil)
              }}
              class={`sensor__list-item`}>
            </ListItem>
            <ListItem
              radio
              name="tad17"
              value="tad17"
              title={$t('settings.pump.std.viscosity.thick')}
              checked={is_tad17}
              onChange={() => {
                Oil = typesOil.TAD
               // T = 2000
                localStorage.setItem('oil', Oil)
              }}
              class={`sensor__list-item`}>
            </ListItem>
        </List>
    </div>
    {/if}

    <div class="section-card">
        <BlockTitle class='block-title-text_settings'>
          {$t('settings.pump.std.volume')}
        </BlockTitle>
        {#if !tmpPump.usr}
          <Block mediumInset>
            <i>
              {$t('settings.pump.std.volume.block.p1')}
              </i>
          </Block>
          <!-- Шкала одна на обе вязкости; {#key} пересоздаёт её при смене масла
               (другой предел T), как раньше две отдельные шкалы. -->
          {#if is_atf || is_tad17}
            {#key Oil}
              <Ranges {...volumeRange} />
            {/key}
          {/if}
        {:else}
          <Block mediumInset>
            <p>
              {$t('settings.pump.nonstd.block.p1')}
            </p>
          </Block>
          {#each timeRanges as rangeValue}
            <Ranges {...rangeValue} />
          {/each}
        {/if}
    </div>

</Page>

  <script>
    import {
      Block,
      BlockTitle,
      Page,
      Navbar,
      List,
      ListItem,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import Ranges from '../../components/range-param.svelte'
    import store from '../../js/store.js';
    import log from '../../js/debug'
    import {pumpMaxDpMs, typesOil} from '../../js/pumpType.js'

    let connected = useStore('connected', (value) => connected = value);
    let pump = useStore('pump', (value) => pump = value);

    //console.log('connect:', connected)
/* TODO: максимальный объем выдаваемый насосом 2 мл/мин для KAMOER */

    let Oil// = typesOil.ATF
    //let T = pump.period // используется для режима настройки - пауза между каплями (фиксированное)
    let T = 0
    let tmpPump = pump
    let fToggle = false
    let fOnOffPump = false
    let is_atf// = true
    let is_tad17// = false
    const maxProcentT = 98

    // ! Без location.reload при потере связи (этап 2, firmware docs/web-frontend.md §13):
    //   без связи — надпись «Нет связи», как раньше; после восстановления вкладки
    //   возвращаются к началу и настройки перечитываются (store.js onLinkUp).
    // Копия — тот же объект стора; после перечитывания настроек — новый объект.
    $: tmpPump = pump

    $: fStd = (!tmpPump.usr)? true : false
    $: fUsr = (tmpPump.usr)? true : false

    $: is_atf = (Oil == typesOil.ATF)? true : false
    $: is_tad17 = (Oil == typesOil.TAD)? true : false

    // ! Предел времени включения T (100 % шкалы объёма) — по типу насоса
    //   PMP.type: прошивка отдаёт его в поле type ответа /settings/pump.
    //   Раньше тип брался из первой буквы ver.hw, но там версия платы, а буква
    //   типа дописана в КОНЕЦ («13.5B»): T оставалось 0, шкала стояла на 98 %,
    //   а любое её движение отправляло dpms = 0.
    //   Неизвестный тип — как 'A' (то же правило у прошивки, pumpDefaultDpMs):
    //   самый короткий предел, лишнего масла насос не подаст.
    //   Правило общее со страницей ручного режима — js/pumpType.js.
    $: T = pumpMaxDpMs(pump && pump.type, Oil)

    // Объём масла штатного насоса — доля предела T, % (до maxProcentT).
    $: volumeRange = {
        value: (tmpPump.dpms * 100 / T > maxProcentT)? maxProcentT : tmpPump.dpms * 100 / T,
        minValue: 0,
        maxValue: 100,
        stepValue: 5,
        scale: false,
        icon: "icon-drop",
        icon2: "icon-dropfill",
        rangeChange: (e)=>{
          if (e == 0) e = 1;
          tmpPump.dpms = T * e/100;
          applyPump();
        },
        // ! Тумблер строкой НАД шкалой (подпись «Управление насосом»), а не справа.
        toggleLabel: $t('settings.pump.control'),
        toggle: true,
        toggleCheck: fOnOffPump,
        // ! F7 9: onToggleChange получает булево состояние, а не событие.
        // Было e.detail[0] — TypeError и тумблер не работал.
        onCtrlToggle: (checked) => {
          log(checked)
          fToggle = checked
          sendCtrl()
        }
    }

    // Дополнительный насос: время включения и паузы, мс.
    $: timeRanges = [{
        title: $t('settings.pump.time.on'),
        value: tmpPump.dpms,
        name_value: $t('ms'),
        minValue: 0,
        maxValue: 5000,
        stepValue: 50,
        scale: true,
        rangeChange: (e)=>{
          if (e == 0) e = 10;
          tmpPump.dpms = e;
          applyPump();
        },
        // ! Тумблер строкой НАД шкалой: в карточке объёма он общий для пары
        //   «время вкл/выкл», поэтому подпись та же, что у шкалы объёма.
        toggleLabel: $t('settings.pump.control'),
        toggle: true,
        toggleCheck: fOnOffPump,
        onCtrlToggle: (checked) => {
          log(checked)
          fToggle = checked
          sendCtrl()
        }
      },
      {
        title: $t('settings.pump.time.off'),
        value: tmpPump.dpdp,
        name_value: $t('ms'),
        minValue: 0,
        maxValue: 1000,
        stepValue: 50,
        scale: true,
        rangeChange: (e)=>{
          if (e == 0) e = 10;
          tmpPump.dpdp = e;
          applyPump();
        },
      }]

    // ! Команда насоса — только из обработчиков (тумблер, шкалы, тип насоса), не
    //   из `$:`. Раньше реактивный ctrlPump уходил при каждом открытии страницы и
    //   на каждый шаг шкалы, даже с выключенным тумблером. Пауза у штатного
    //   насоса — 2 с, у дополнительного — его dpdp.
    function sendCtrl() {
      const dpdp = tmpPump.usr ? tmpPump.dpdp : 2000
      store.dispatch('ctrlPump', [fToggle, 0, {dpms: tmpPump.dpms, dpdp}])
    }

    // Сохранить настройки насоса; если насос включён тумблером — перезапустить
    // его с новыми параметрами.
    function applyPump() {
      store.dispatch('sendPump', tmpPump)
      if (fToggle) sendCtrl()
    }

    function pageBeforeIn() {
      /* включить режим настройки вязкости */
      store.dispatch('modeWork', store.state.OILER_VISCOSITY)
      Oil = localStorage.getItem('oil')
    }

    function pageAfterOut() {
      fOnOffPump = false
      /* Отключить режим управления насосом */
      store.dispatch('ctrlPump', [false, 0, {dpms: tmpPump.dpms, dpdp: 800}])
      /* включить автоматический режим работы смазчика */
      store.dispatch('modeWork', store.state.OILER_AUTO)
      /* сохранить настройки */
      //store.dispatch('sendPump', tmpPump)
    }
  </script>
