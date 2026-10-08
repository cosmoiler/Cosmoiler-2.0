<Page
    name="sensor"
    class={`page`}
    onPageAfterOut={pageAfterOut}>

    <Navbar title={$t('settings.sensor.title')} />

    <!--
      ! Карточки страницы — как на других страницах настроек (.section-card
      ! в css/app.less). Первая карточка: тип датчика. Вторая появляется только
      ! при выборе импульсного датчика — её строки (импульсы на оборот, ширина,
      ! профиль и диаметр колеса) относятся именно к нему.
    -->
    <div class="section-card">
        <BlockTitle>{$t('settings.sensor.type')}</BlockTitle>

        <List>
        {#if gnssPresent.gps} <!-- если модуль GNSS установлен -->
            <ListItem
            radio
            name="sensor"
            value="gps"
            title={$t('settings.sensor.gnss')}
            checked={fGPS}
            onChange={() => {
                tmpOdometer.sensor.gnss = true
                // ! Svelte 5: правка поля объекта не считается изменением состояния,
                // поэтому ссылку переприсваиваем — иначе карточка настроек импульсного
                // датчика не переключится.
                tmpOdometer = tmpOdometer
            }}
            class={`sensor__list-item`}>
            </ListItem>
        {/if}
       <!--  {:else} -->
            <ListItem
                radio
                name="sensor"
                value="imp"
                title={$t('settings.sensor.impulse')}
                checked={fIMP}
                onChange={() => {
                    tmpOdometer.sensor.gnss = false
                    tmpOdometer = tmpOdometer
                }}
                class={`sensor__list-item`}>
            </ListItem>
        <!-- {/if} -->
        </List>
    </div>


<!--   Настройки импульсного режима -->
    {#if fIMP}
    <div class="section-card">
        <BlockTitle>{$t('settings.sensor.imp.settings')}</BlockTitle>
        <List noHairlinesMd >
<!--
      ! Значения полей — value={…} + колбэк, а не bind:value: у ListInput
      ! Framework7 9 value объявлен без $bindable, и bind:value передаёт значение
      ! только вниз (firmware docs/web-frontend.md §6, таблица ловушек F7 9).
      ! Набранное руками число оставалось внутри поля, а при уходе со страницы
      ! сохранялось прежнее — 16 или результат замера (замечание пользователя
      ! 08.10.2026). Поле отдаёт строку — в состояние кладётся число (toNumber).
    -->
<!-- Импульсов на оборот -->
        <ListInput
        label={$t('settings.sensor.imprev')}
        type="number"
        required
        value={tmpOdometer.sensor.imp}
        clearButton
        onInputClear={clearImp}
        onInput={onImpInput}
        info={calibrating ? $t('settings.sensor.imprev.calib') : undefined}
        class={`sensor__list-item`}>
        </ListInput>
<!-- Ширина -->
        <ListInput
        label={$t('settings.sensor.wheel.width')}
        type="number"
        placeholder={`[${$t('all.mm')}]`}
        required
        clearButton
        validate
        value={tmpOdometer.wheel.w}
        onInput={(e) => {
            // Пусто или 0 — ширину не меняем: поле обязательное.
            const w = toNumber(e.target.value)
            if (w > 0) tmpOdometer.wheel.w = w
        }}
        onChange={() =>{
            if (!tmpOdometer.sensor.gnss) pending.trip.set("wheel", tmpOdometer.wheel)
            store.dispatch('sendDistance', tmpOdometer)
        }}
        class={`sensor__list-item`}>
        </ListInput>
<!-- Профиль -->
        <ListInput
        label={$t('settings.sensor.wheel.height')}
        type="select"
        value={tmpOdometer.wheel.h}
        onChange={(e) => {
            tmpOdometer.wheel.h = toNumber(e.target.value)
            if (!tmpOdometer.sensor.gnss) pending.trip.set("wheel", tmpOdometer.wheel)
            store.dispatch('sendDistance', tmpOdometer)
        }}
        class={`sensor__list-item`}>
            {#each height as value}
                <option value={value}>{`${value}`}</option>
            {/each}
        </ListInput>
<!-- Диаметр -->
        <ListInput
        label={$t('settings.sensor.wheel.rimdia')}
        type="select"
        value={tmpOdometer.wheel.d}
        onChange={(e) => { tmpOdometer.wheel.d = toNumber(e.target.value) }}
        class={`sensor__list-item`}>
            {#each dia as value}
            <option value={value}>{`${value}"`}</option>
            {/each}
        </ListInput>
    </List>
    </div>
    {/if}
</Page>

<script>
    import {
        Page,
        Navbar,
        List,
        ListInput,
        ListItem,
        BlockTitle,
        useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import store from '../../js/store.js';
    import log from '../../js/debug.js';

    const height = [22, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100] // профиль шины
    const dia = [16, 17, 18, 19, 21]  // диаметр

    let connected = useStore('connected', (value) => connected = value);
    let gnssPresent = useStore('gnssPresent', (value) => gnssPresent = value);
    let odometer = useStore('odometer', (value) => odometer = value);
    let telemetry = useStore('telemetry', (value) => telemetry = value);
    let pending = useStore('pending', (value) => pending = value);

    let tmpOdometer = odometer

    /*
     * ! Тип датчика — по ВЫБОРУ пользователя (tmpOdometer.sensor.gnss), а не только
     * по наличию модуля ГНСС.
     *
     * Раньше здесь было fGPS = gnssPresent.gps, fIMP = !gnssPresent.gps: карточка
     * настроек импульсного датчика показывалась лишь когда модуля ГНСС нет вовсе,
     * и на плате с ГНСС выбор «Импульсный» ничего не раскрывал.
     */
    $: fGPS = (tmpOdometer.sensor.gnss && gnssPresent.gps) ? true : false
    $: fIMP = (!tmpOdometer.sensor.gnss || !gnssPresent.gps) ? true : false


    // ! Без location.reload при потере связи (этап 2, firmware docs/web-frontend.md §13):
    //   без связи — надпись «Нет связи», как раньше; после восстановления вкладки
    //   возвращаются к началу и настройки перечитываются (store.js onLinkUp).
    // Копия — тот же объект стора; после перечитывания настроек — новый объект.
    $: tmpOdometer = odometer

    /*
     * ! Калибровка «крестиком» (задача пользователя 05.10.2026, firmware
     *   docs/web-frontend.md §15): крестик → поле 0 → пользователь проворачивает
     *   колесо на один оборот → в поле число импульсов датчика за этот оборот.
     *
     *   Блок отдаёт в /telemetry/get накопительный счётчик импульсов на входе
     *   SPEED_IN — params[0].cnt (с включения, при любом выбранном датчике).
     *   Первое значение после крестика — база, в поле — cnt − база. Телеметрия
     *   на этой странице опрашивается тем же опросом, что и на вкладке
     *   «Телеметрия» (store.js requestTelemetryStart). Смазчик на время замера —
     *   на паузе (/state/ctrl). Замер заканчивается уходом со страницы (решение
     *   пользователя 07.10) или ручным вводом числа (onImpInput); pageAfterOut
     *   сохраняет то, что в поле, — замер или набранное руками.
     *
     *   Раньше: раз в 1,5 с в поле писался params[0].sp — но телеметрию здесь
     *   никто не опрашивал, а sp у прошивки — импульсы за последние 500 мс.
     *   Прошивка без cnt — поле просто остаётся 0 (ввод вручную).
     */
    let calibrating = false
    let calibStart = null   // объект телеметрии на момент крестика (устаревший)
    let calibBase = null    // cnt первой свежей телеметрии после крестика

    function clearImp() {
        tmpOdometer.sensor.imp = 0
        calibStart = telemetry
        calibBase = null
        calibrating = true
        store.dispatch('modeWork', store.state.OILER_VISCOSITY)
        store.dispatch('requestTelemetryStart')
    }

    function stopCalibration() {
        if (!calibrating) return
        calibrating = false
        store.dispatch('requestTelemetryStop')
    }

    // Число из поля ввода: DOM отдаёт строку, а прошивка ждёт в JSON число —
    // строку («"imp":"48"») она не примет и оставит прежнее значение. Пусто или
    // не число — 0.
    function toNumber(text) {
        const v = parseInt(text, 10)
        return Number.isFinite(v) && v > 0 ? v : 0
    }

    // Ручной ввод числа импульсов: замер «крестиком» заканчивается, в поле —
    // набранное число. Стёртое поле остаётся пустым (0 в нём мешал бы набирать
    // новое число), при уходе со страницы пустое станет 16 — как замер без
    // импульсов (решение пользователя 07.10). Крестик тоже даёт событие ввода
    // (пустое), а сразу за ним — onInputClear, который начинает новый замер.
    function onImpInput(e) {
        stopCalibration()
        const text = e.target.value
        tmpOdometer.sensor.imp = text === '' ? '' : toNumber(text)
    }

    // Каждый ответ /telemetry/get — новый объект стора; ответ, бывший в сторе до
    // крестика, пропускается (иначе база взялась бы из старых данных).
    $: if (calibrating && telemetry !== calibStart) {
        const cnt = telemetry && telemetry.params && telemetry.params[0]
            ? telemetry.params[0].cnt : undefined
        if (typeof cnt === 'number') {
            if (calibBase === null) calibBase = cnt
            // Беззнаковая разность: счётчик uint32 может переполниться.
            tmpOdometer.sensor.imp = (cnt - calibBase) >>> 0
            log('калибровка: cnt %d, база %d', cnt, calibBase)
        }
    }

    /**
     * ! Выход со страницы сохраняет датчик ВСЕГДА.
     *
     * Раньше всё тело стояло под if (!gnssPresent.gps): на плате с модулем ГНСС
     * выбор «GPS / Импульсный» (sensor.gnss), число импульсов и диаметр колеса
     * до блока не доходили, интервал замера из clearImp() не снимался (и
     * продолжал писать в состояние стора), а режим оставался /state/ctrl.
     * Колесо нужно только импульсному датчику — его и шлём только тогда.
     */
    function pageAfterOut () {
        log('pageAfterOut', tmpOdometer);
        stopCalibration()
        store.dispatch('modeWork', store.state.OILER_AUTO)
        // 0 (замер без импульсов) или пустое поле — заводское 16; дальше в JSON
        // уходит число (calcDistance для импульсного датчика тоже переводит в Number).
        if (!(Number(tmpOdometer.sensor.imp) > 0)) tmpOdometer.sensor.imp = 16
        else tmpOdometer.sensor.imp = Number(tmpOdometer.sensor.imp)
        pending.trip.set("sensor", tmpOdometer.sensor)
        if (fIMP) {
            store.dispatch('calcDistance', tmpOdometer)
            pending.trip.set("wheel", tmpOdometer.wheel)
        }
        store.dispatch('sendDistance', tmpOdometer)
    }

</script>
