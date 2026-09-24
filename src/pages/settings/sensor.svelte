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
                //mapSettings.set("sensor", tmpOdometer.sensor);
                //log(mapSettings)
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
<!-- Импульсов на оборот -->
        <ListInput
        label={$t('settings.sensor.imprev')}
        type="number"
        required
        bind:value={tmpOdometer.sensor.imp}
        clearButton
        onInputClear={clearImp}
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
        bind:value={tmpOdometer.wheel.w}
        onChange={() =>{
            if (!tmpOdometer.sensor.gnss) mapSettings.set("wheel", tmpOdometer.wheel)
            store.dispatch('sendDistance', tmpOdometer)
        }}
        class={`sensor__list-item`}>
        </ListInput>
<!-- Профиль -->
        <ListInput
        label={$t('settings.sensor.wheel.height')}
        type="select"
        bind:value={tmpOdometer.wheel.h}
        onChange={() => {
            if (!tmpOdometer.sensor.gnss) mapSettings.set("wheel", tmpOdometer.wheel)
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
        bind:value={tmpOdometer.wheel.d}
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
    let mapSettings = useStore('mapSettings', (value) => mapSettings = value);

    let interval
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


    $: if (!connected) document.location.reload()

    function clearImp() {
        tmpOdometer.sensor.imp = 0
        store.dispatch('modeWork', store.state.OILER_VISCOSITY)
        //store.dispatch('requestTelemetryStart')
        interval = setInterval(() => {
            //store.dispatch('requestTelemetry')
            tmpOdometer.sensor.imp = telemetry.params[0].sp
            //trip = trip
            log('clearImp ', tmpOdometer)
        }, 1500);
    }

    function pageAfterOut () {
        if (!gnssPresent.gps) {
            log('pageAfterOut', tmpOdometer);
            clearInterval(interval)
            //store.dispatch('requestTelemetryStop')
            store.dispatch('modeWork', store.state.OILER_AUTO)
            if (tmpOdometer.sensor.imp == 0) tmpOdometer.sensor.imp = 16
            store.dispatch('calcDistance', tmpOdometer)
            mapSettings.set("sensor", tmpOdometer.sensor)
            mapSettings.set("wheel", tmpOdometer.wheel)
            store.dispatch('sendDistance', tmpOdometer)
            //log(tmpOdometer);
        }
    }

</script>
