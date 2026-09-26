<Page
    name="system"
    class={`page`}
    pageContent={true}
    onPageBeforeIn={pageBeforeIn}
    onPageAfterOut={pageAfteOut} >

    <Navbar title={$t('service.system.title')} />

    {#if connected}
    <!--
      ! Секции страницы — карточки .section-card (стили в css/app.less).
      !
      ! Раньше секции разделяли только отступ и подпись, а строка с тумблером
      ! видимого фона вообще не имела (инлайн-цвет #ecece060 совпадал с фоном
      ! страницы — замер: и страница, и строка #ECECE0).
      !
      ! Стало: заголовок, строка с тумблером и текст-инструкция лежат в одной
      ! карточке. Длинные тексты свёрнуты — в карточке остаётся строка
      ! «Инструкция», текст раскрывается по тапу. Страница стала вдвое короче:
      ! 1507px -> 738px при ширине 360px.
    -->
    <!-- Управление прокачкой системы -->
        <div class="section-card">
            <BlockTitle ><span>{$t('service.system.pumping.title')}</span></BlockTitle>
            <List >
                <ListItem class="row-tint">
                    <div class="item-cell width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.pumping.text_toggle')}</div>
                    <div class="item-cell width-auto flex-shrink-4"><Toggle bind:checked={ctrlpump}  /></div>
                </ListItem>
            </List>
        </div>

    <!-- Управление яркостью светодиода -->
        <!-- Шапкой секции становится BlockTitle внутри <Ranges> -->
        <div class="section-card">
            {#each rangeValues[0] as rangeValue}
            <Ranges {...rangeValue} />
            {/each}
        </div>

    <!-- Управление обучением включения выключения -->
        <div class="section-card">
            <BlockTitle ><span>{$t('service.system.onoff.title')}</span></BlockTitle>
            <!--
              ! Текст свёрнут: в карточке остаются только заголовок и тумблер.
              ! Состояние показывает шеврон (см. .section-more в css/app.less).
            -->
            <button class="section-more" class:is-open={instrOnoff} aria-expanded={instrOnoff} onclick={() => instrOnoff = !instrOnoff}>
              <span>{$t('service.system.instr.title')}</span>
              <span class="section-more__chev">▾</span>
            </button>
            {#if instrOnoff}
            <Block mediumInset>
              <p><i>{$t('service.system.onoff.block.p1')}<br></i></p>
              <p><i style="font-weight: 600">{$t('attention.title').toUpperCase()}</i>
                <i>{$t('service.system.onoff.block.p2')}</i>
              </p>
              <p>{$t('service.system.onoff.block.p3')}</p>
              <p>{$t('service.system.onoff.block.p4')}</p>
              <p>{$t('service.system.onoff.block.p5')}</p>
              <p>{$t('service.system.onoff.block.p6')}</p>
              <p>{$t('service.system.onoff.block.p7')}</p>
            </Block>
            {/if}
            <List >
                <ListItem class="row-tint">
                  {#if !AItraining}
                    <div class="item-cell width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.onoff.text_toggle1')}</div>
                  {:else}
                    <div class="item-cell width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.onoff.text_toggle2')}</div>
                  {/if}
                    <div class="item-cell width-auto flex-shrink-4"><Toggle bind:checked={AItraining} bind:disabled={disabled}  /></div>
                </ListItem>
            </List>
        </div>

        <!-- Управление режимом определения Fake GPS -->
        {#if (locale === "ru" || locale === "RU")}
        <div class="section-card">
            <BlockTitle ><span>{$t('service.system.fakegps.title')}</span></BlockTitle>
            <button class="section-more" class:is-open={instrFakegps} aria-expanded={instrFakegps} onclick={() => instrFakegps = !instrFakegps}>
              <span>{$t('service.system.instr.title')}</span>
              <span class="section-more__chev">▾</span>
            </button>
            {#if instrFakegps}
            <Block mediumInset>
              <p><i>{$t('service.system.fakegps.title')}
                Включает возможность обнаружения спуффинга сигнала GPS и интеллектуального переключения между
                режимами работы "Одометр" и "Таймер".<br>
                </i>
              </p>
              <p><i>
                При обнаружении спуффинга или глушения сигнала GPS иконка  <Icon icon="icon-gps" style='color: red;'/> во вкладке "Телеметрия" будет отображаться красным цветом.
              </i>
              </p>
              <p><i style="font-weight: 600">ПРЕДУПРЕЖДЕНИЕ!</i> <i>Функция экспериментальная.</i></p>
            </Block>
            {/if}
            <List >
                <ListItem class="row-tint">
                    <div class="item-cell width-auto flex-shrink-0 list-input__label list-input__label-text_color">{$t('service.system.fakegps.text_toggle')}</div>
                    <div class="item-cell width-auto flex-shrink-4"><Toggle bind:checked={tmpSystem.fake}  /></div>
                </ListItem>
            </List>
        </div>
        {/if}
    {/if}

</Page>

<script>
    import {
      Page,
     // Button,
      Block,
      List,
      ListItem,
      // ! ListItemCell удалён в Framework7 9 (в списке остался только
      // LESS-миксин .item-cell()); заменён на <div class="item-cell">.
      Navbar,
      BlockTitle,
      Toggle,
      Icon,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import Ranges from '../../components/range-param.svelte'
    import store from '../../js/store.js';
    import log from '../../js/debug.js';


    let connected = useStore('connected', (value) => connected = value);
    let system = useStore('system', (value) => system = value);
    let mapSettings = useStore('mapSettings', (value) => mapSettings = value);
    let pump = useStore('pump', (value) => pump = value);
    //let locale = useStore('locale', (value) => locale = value);
    let locale = "ru"

    let tmpSystem = system
    let ctrlpump = false
    let AItraining = false
    let disabled = false

    /**
     * ! Тексты-инструкции секций свёрнуты по умолчанию (см. разметку выше).
     *
     * Два отдельных флага, а не объект: в Svelte 5 правка поля объекта не считается
     * изменением состояния — его пришлось бы переприсваивать целиком.
     */
    let instrOnoff = false;
    let instrFakegps = false;
    //let fakegps = false;

    // ! Длительность импульса прокачки — по типу насоса PMP.type (поле type
    //   ответа /settings/pump), а не по первой букве ver.hw: там версия платы
    //   («13.5B»), и для неё Tdpms оставалось 0 — при прокачке насос не
    //   включался. Мембранному насосу (C) — 3 с, остальным — 1 с.
    let Tdpms = 1000
    $: Tdpms = (pump && pump.type && pump.type[0] == 'C') ? 3000 : 1000


    $: if (!connected) document.location.reload()
    $: {
      const pumpParams = {dpms: Tdpms, dpdp: 1000}
      if (ctrlpump) {
        // ! Команду насоса — только после ответа на /state/pumping: прошивка
        // выполняет её лишь в режиме прокачки, а два запроса подряд могут
        // прийти в любом порядке (docs/modes.md, решение 11).
        store.dispatch('modeWork', store.state.OILER_PUMPING)
          .then(() => store.dispatch('ctrlPump', [true, 0, pumpParams]))
        setTimeout(() => {
            ctrlpump = false
        }, 180000)
      }
      else {
        // Выключение: насос прошивка останавливает и сама при выходе из
        // прокачки, поэтому порядок этих двух запросов не важен.
        store.dispatch('ctrlPump', [false, 0, pumpParams])
        store.dispatch('modeWork', store.state.OILER_AUTO)
      }
    }

    $: store.dispatch('fakeGPS', tmpSystem.fake)

    $: rangeValues = [
      [{
        title: $t('service.system.led.title'),
        value: tmpSystem.bright * 100 / 255,
       // name_value: "%",
        minValue: 1,
        maxValue: 100,
        stepValue: 1,
        scale: false,
        icon: "icon-light",
        icon2: "icon-light-fill",
        rangeChange: (e)=>{
          tmpSystem.bright = Math.trunc(e * 255 / 100)
          store.dispatch('ctrlBright', tmpSystem.bright)
        },
        toggle: false,
      }],
    ]

    $: if (AItraining) store.dispatch('modeWork', store.state.OILER_TRAINING)
    $: disabled = AItraining || ctrlpump

    function pageBeforeIn() {
      /* включить режим настройки вязкости */
      //store.dispatch('modeWork', store.state.OILER_PUMPING)
    }

    function pageAfteOut() {
      /* включить автоматический режим работы смазчика */
      store.dispatch('modeWork', store.state.OILER_AUTO)
      mapSettings.set("bright", tmpSystem.bright)
      store.dispatch('sendSystem', tmpSystem)
    }

</script>
