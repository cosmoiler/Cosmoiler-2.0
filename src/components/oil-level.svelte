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
    aria-valuenow={level}
    style={`--oil-level-alpha: ${alpha}`}>
    <span class="oil-level__label">E</span>
    {#each segments as i}
        <span class={segClass(i, lit, low)}></span>
    {/each}
    <span class="oil-level__label">F</span>
</div>

<script>
    export let oil = 0   // остаток, %
    export let low = 0   // 1 — «мало масла» (остаток < COSMOILER_OIL_LOW_PCT)

    const SEGMENTS = 10
    // Прозрачность горящих сегментов: полный бачок — 1.0, пустой — ALPHA_EMPTY.
    const ALPHA_EMPTY = 0.35

    const segments = [...Array(SEGMENTS).keys()]

    $: level = Math.min(Math.max(Number(oil) || 0, 0), 100)

    // ! Пока масло есть, горит хотя бы один сегмент: при 3 % округление дало бы
    //   пустую шкалу, хотя бачок ещё не пуст.
    $: lit = level > 0 ? Math.max(1, Math.round(level / (100 / SEGMENTS))) : 0

    // ! Цвет — только тема (#5e3e29): по мере опустошения бачка сегменты
    //   приглушаются, а не меняют цвет (решение пользователя 30.09.2026).
    $: alpha = (ALPHA_EMPTY + (1 - ALPHA_EMPTY) * level / 100).toFixed(2)

    // При «мало масла» мигает последний горящий сегмент.
    const segClass = (i, lit, low) => {
        if (i >= lit) return 'oil-level__seg'
        const blink = (low == 1 && i == lit - 1) ? ' oil-level__seg--blink' : ''
        return `oil-level__seg oil-level__seg--on${blink}`
    }
</script>
