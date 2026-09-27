<Page
    name="route-cfg"
    class={`page`}
    pageContent={true}
    onPageAfterIn={refreshInfo}>

    <Navbar title={$t('route.cfg.title')} />

    {#if !connected}
        <BlockTitle class={`block-title-noconnection__text`}>{$t('home.noconnect')}</BlockTitle>
    {/if}

    <!--
      ! Параметры классификатора «трасса / город» (NVS ODO.SMR.*, прошивка —
      ! docs/route.md §3.1). Страница открывается только адресом /route/cfg:
      ! ссылок на неё в интерфейсе нет, она для калибровки (appview.svelte).
      !
      ! Значения в форме — те же целые, что в NVS и JSON ("route" в
      ! /settings/trip): пороги балла в %, времена в секундах. Исключение —
      ! веса: в NVS они ×10, здесь показываются как есть (3.0, 1.5 …).
      !
      ! Сохранение — только по кнопке, одним запросом {"route":{…}}: прошивка
      ! проверяет набор целиком (routeCfgValid) и недопустимый отклоняет.
    -->
    <div class="section-card">
        <BlockTitle>{$t('route.cfg.speed')}</BlockTitle>
        <List noHairlinesMd>
            {#each speedFields as f}
            <ListInput
                label={`${$t(f.label)}, ${$t(f.unit)}`}
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={form[f.key]}
                onInput={(e) => setField(f.key, e.target.value)}
                class={`sensor__list-item`}>
            </ListInput>
            {/each}
        </List>
    </div>

    <div class="section-card">
        <BlockTitle>{$t('route.cfg.decision')}</BlockTitle>
        <List noHairlinesMd>
            {#each decisionFields as f}
            <ListInput
                label={`${$t(f.label)}, ${$t(f.unit)}`}
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={form[f.key]}
                onInput={(e) => setField(f.key, e.target.value)}
                class={`sensor__list-item`}>
            </ListInput>
            {/each}
        </List>
    </div>

    <div class="section-card">
        <BlockTitle>{$t('route.cfg.weights')}</BlockTitle>
        <List noHairlinesMd>
            {#each weightFields as f}
            <ListInput
                label={$t(f.label)}
                type="number"
                min="0"
                max="25"
                step="0.5"
                value={form[f.key]}
                onInput={(e) => setField(f.key, e.target.value)}
                class={`sensor__list-item`}>
            </ListInput>
            {/each}
        </List>
    </div>

    <Block>
        <Button fill large disabled={!connected || saving} onClick={save}>{$t('route.cfg.save')}</Button>
        <p></p>
        <Button outline large onClick={setDefaults}>{$t('route.cfg.defaults')}</Button>
    </Block>

    <!-- Текущее состояние и калибровочный журнал (docs/route.md §7–8) -->
    <div class="section-card">
        <BlockTitle>{$t('route.cfg.state')}</BlockTitle>
        <List noHairlinesMd>
            <ListItem title={$t('route.cfg.state.now')} after={info ? info.state : '—'} />
            <ListItem title={$t('route.cfg.state.z')} after={info ? Number(info.z).toFixed(2) : '—'} />
            <ListItem title={$t('route.cfg.state.dist')}
                      after={info ? `${km(info.city_m)} / ${km(info.hwy_m)} / ${km(info.unknown_m)}` : '—'} />
            <ListItem title={$t('route.cfg.state.windows')} after={info ? `${info.windows} / ${info.switches}` : '—'} />
            <ListItem title={$t('route.cfg.state.log')} after={info ? `${info.log}` : '—'} />
        </List>
        <Block>
            <Button outline onClick={refreshInfo}>{$t('route.cfg.refresh')}</Button>
            <p></p>
            <Button outline external href={logUrl}>{$t('route.cfg.log')}</Button>
            <p></p>
            <Button outline color="red" onClick={clearLog}>{$t('route.cfg.clear')}</Button>
        </Block>
    </div>
</Page>

<script>
    import {
        Page,
        Navbar,
        Block,
        BlockTitle,
        List,
        ListInput,
        ListItem,
        Button,
        useStore,
        f7
    } from 'framework7-svelte';
    import {t} from '../services/i18n.js';
    import store, { ROUTE_DEFAULTS, routeCfgError, deviceUrl } from '../js/store.js';
    import log from '../js/debug.js';

    // Поля формы. Порядок и подписи — как в docs/route.md §3.1.
    const speedFields = [
        { key: 'vstp', label: 'route.cfg.vstp', unit: 'route.cfg.unit.kmh', min: 1, max: 60,  step: 1 },
        { key: 'vgo',  label: 'route.cfg.vgo',  unit: 'route.cfg.unit.kmh', min: 2, max: 80,  step: 1 },
        { key: 'vhi',  label: 'route.cfg.vhi',  unit: 'route.cfg.unit.kmh', min: 3, max: 250, step: 1 },
    ];
    const decisionFields = [
        { key: 'thwy',  label: 'route.cfg.thwy',  unit: 'route.cfg.unit.pct', min: 1,   max: 100,   step: 1 },
        { key: 'tcty',  label: 'route.cfg.tcty',  unit: 'route.cfg.unit.pct', min: 0,   max: 99,    step: 1 },
        { key: 'cnfw',  label: 'route.cfg.cnfw',  unit: 'route.cfg.unit.pcs', min: 1,   max: 10,    step: 1 },
        { key: 'dwell', label: 'route.cfg.dwell', unit: 'route.cfg.unit.s',   min: 0,   max: 3600,  step: 10 },
        { key: 'stdst', label: 'route.cfg.stdst', unit: 'route.cfg.unit.m',   min: 0,   max: 20000, step: 100 },
        { key: 'trip',  label: 'route.cfg.trip',  unit: 'route.cfg.unit.m',   min: 0,   max: 20000, step: 100 },
        { key: 'park',  label: 'route.cfg.park',  unit: 'route.cfg.unit.s',   min: 10,  max: 3600,  step: 10 },
        { key: 'wdst',  label: 'route.cfg.wdst',  unit: 'route.cfg.unit.m',   min: 100, max: 10000, step: 100 },
        { key: 'wtm',   label: 'route.cfg.wtm',   unit: 'route.cfg.unit.s',   min: 10,  max: 1800,  step: 10 },
    ];
    const weightFields = [
        { key: 'wcrs', label: 'route.cfg.wcrs' },
        { key: 'wnst', label: 'route.cfg.wnst' },
        { key: 'wstb', label: 'route.cfg.wstb' },
        { key: 'wrun', label: 'route.cfg.wrun' },
        { key: 'wsdn', label: 'route.cfg.wsdn' },
    ];
    const WEIGHT_KEYS = weightFields.map((f) => f.key);

    // Форма в «человеческих» единицах: веса — дробные (в NVS ×10).
    function toForm(route) {
        const r = Object.assign({}, ROUTE_DEFAULTS, route || {});
        const f = { ...r };
        for (const k of WEIGHT_KEYS) f[k] = r[k] / 10;
        return f;
    }

    function fromForm(f) {
        const r = {};
        for (const k of Object.keys(ROUTE_DEFAULTS))
            r[k] = WEIGHT_KEYS.includes(k) ? Math.round(Number(f[k]) * 10) : Math.round(Number(f[k]));
        return r;
    }

    let form   = toForm(null);
    let dirty  = false; // пользователь правил форму — не затирать ответом устройства
    let saving = false;
    let info   = null;  // GET /route/get
    const logUrl = deviceUrl('/route/log');

    // Подписка — после объявления формы: обработчик сразу её обновляет.
    let connected = useStore('connected', (value) => connected = value);
    let odometer  = useStore('odometer', (value) => { odometer = value; syncFromDevice(); });
    syncFromDevice();

    // Настройки одометра приходят асинхронно (store init). Прошивка без объекта
    // "route" (старая) — в форме остаются заводские значения.
    function syncFromDevice() {
        if (!dirty && odometer) form = toForm(odometer.route);
    }

    // ! Svelte 5: правка поля объекта не считается изменением состояния —
    //   объект переприсваивается.
    function setField(key, value) {
        form[key] = value;
        form = form;
        dirty = true;
    }

    function setDefaults() {
        form = toForm(ROUTE_DEFAULTS);
        dirty = true;
    }

    async function save() {
        const route = fromForm(form);
        const err = routeCfgError(route);
        if (err) {
            f7.dialog.alert($t(err), 'Cosmoiler');
            return;
        }
        saving = true;
        const ok = await store.dispatch('sendRoute', route);
        saving = false;
        log('route cfg saved:', ok, route);
        if (ok) {
            dirty = false;
            syncFromDevice();
            f7.toast.show({ text: $t('route.cfg.saved'), closeTimeout: 2000, position: 'center' });
        } else {
            f7.dialog.alert($t('route.cfg.err.save'), 'Cosmoiler');
        }
    }

    async function refreshInfo() {
        try {
            info = await store.dispatch('routeInfo');
        } catch (err) {
            info = null;
        }
    }

    function clearLog() {
        f7.dialog.confirm($t('route.cfg.clear.confirm'), 'Cosmoiler', async () => {
            try {
                await store.dispatch('routeClear');
            } catch (err) { /* нет связи — отразится в refreshInfo */ }
            refreshInfo();
        });
    }

    const km = (m) => (Number(m) / 1000).toFixed(1);
</script>
