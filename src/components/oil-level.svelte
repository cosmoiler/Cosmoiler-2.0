<!--
  ! Индикатор остатка масла в бачке — сегменты, как указатель топлива (E — F).
  ! Данные — params[6] телеметрии (firmware docs/oil.md), стили — .oil-level в
  ! css/app.less, описание — firmware docs/web-frontend.md §11.
-->
<div
    class="oil-level"
    role="meter"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={level}>
    <span class="oil-level__label">E</span>
    {#each segments as i}
        <span class={segClass(i, lit, low)} style={i < lit ? segColor(i) : ''}></span>
    {/each}
    <span class="oil-level__label">F</span>
</div>

<script>
    export let oil = 0   // остаток, %
    export let low = 0   // 1 — «мало масла» (остаток < COSMOILER_OIL_LOW_PCT)

    import { onMount } from 'svelte'

    const SEGMENTS = 10
    // Прозрачность сегмента у «E»; у «F» — 1.0.
    const ALPHA_EMPTY = 0.25

    const segments = [...Array(SEGMENTS).keys()]

    $: level = Math.min(Math.max(Number(oil) || 0, 0), 100)

    // ! Пока масло есть, горит хотя бы один сегмент: при 3 % округление дало бы
    //   пустую шкалу, хотя бачок ещё не пуст.
    $: lit = level > 0 ? Math.max(1, Math.round(level / (100 / SEGMENTS))) : 0

    /*
     * ! Цвет — градиент по положению сегмента (решение пользователя 30.09.2026):
     *   у «F» (100 %) — цвет темы #5e3e29 без прозрачности, к «E» — переход к
     *   --f7-theme-color-change-text с затуханием прозрачности до ALPHA_EMPTY.
     *   Сегмент раскрашен по своему месту на шкале, а не по уровню масла:
     *   с опустошением бачка гаснут сегменты у «F», остаются светлые у «E».
     */
    const FULL = [0x5e, 0x3e, 0x29]
    let empty = [0xc8, 0x71, 0x37] // --f7-theme-color-change-text по умолчанию

    onMount(() => {
        // Берём фактическое значение переменной темы (app.less), если оно #rrggbb.
        const v = getComputedStyle(document.documentElement)
            .getPropertyValue('--f7-theme-color-change-text').trim()
        const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(v)
        if (m) empty = [1, 2, 3].map((k) => parseInt(m[k], 16))
    })

    // empty — параметр, чтобы разметка пересчиталась после onMount.
    $: segColor = (i) => {
        const t = i / (SEGMENTS - 1) // 0 — у «E», 1 — у «F»
        const [r, g, b] = FULL.map((c, k) => Math.round(empty[k] + (c - empty[k]) * t))
        const a = (ALPHA_EMPTY + (1 - ALPHA_EMPTY) * t).toFixed(2)
        return `background-color: rgba(${r}, ${g}, ${b}, ${a})`
    }

    // При «мало масла» мигает последний горящий сегмент.
    const segClass = (i, lit, low) => {
        if (i >= lit) return 'oil-level__seg'
        const blink = (low == 1 && i == lit - 1) ? ' oil-level__seg--blink' : ''
        return `oil-level__seg oil-level__seg--on${blink}`
    }
</script>
