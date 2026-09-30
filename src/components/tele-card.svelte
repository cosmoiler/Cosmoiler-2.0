{#if title != undefined}
<!-- <div transition:fade="{{delay: 100, duration: 200}}"> -->
<Card class='elevation-3' >
    <CardHeader class={`card-header-tele`} >
      <span>{title}</span>
    </CardHeader>
    {#if gauge.length != 0}
    <CardContent padding={true}>
      <!--
        ! Градиент дуги приборов — как у шкалы остатка масла (oil-level.svelte):
        ! слева (0) --f7-theme-color-change-text с прозрачностью 0.35, справа
        ! (100 %) #5e3e29 без прозрачности. Цвет и прозрачность концов —
        ! stop-color / stop-opacity у <stop offset="0"> и <stop offset="1">.
        ! Gauge рисует дугу целиком и прячет
        ! лишнее stroke-dasharray, поэтому градиент в долях рамки дуги
        ! (objectBoundingBox) стоит на месте: цвет — по положению на шкале.
        ! Цвета — через style: CSS-переменные в атрибутах SVG не работают.
        ! Не display:none — в нём градиент может не найтись по url(#…).
      -->
      <svg class="gauge-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient id="csm-gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style="stop-color: var(--f7-theme-color-change-text); stop-opacity: 0.80" />
            <stop offset="1" style="stop-color: #5e3e29; stop-opacity: 1" />
          </linearGradient>
        </defs>
      </svg>

      <div class="row-equal">
<!--         {#each gauge as {value, valueText, labelText, text}}
            <div class="text-align-center">
                <Gauge
                    type="semicircle"
                    value={value}
                    valueText={valueText}
                    valueFontSize="34"
                    valueTextColor=var(--f7-theme-color-subtitle-text)
                    borderColor=var(--f7-theme-color)
                    labelText={labelText}
                    labelFontSize = "18"
                    labelTextColor=var(--f7-theme-color-change-text) />
                <span style="color: #888888" >{text}</span>
            </div>
        {/each} -->
        {#each gauge as {value, valueText, labelText, text, units}}
        <div class="text-align-center">
            <span style="color: #888888" >{text}</span>
            <Gauge
                type="semicircle"
                value={value}
                valueText={valueText}
                valueFontSize="34"
                valueTextColor=var(--f7-theme-color-subtitle-text)
                borderColor="url(#csm-gauge-grad)"
                labelText={labelText}
                labelFontSize = "18"
                labelTextColor=var(--f7-theme-color-change-text) />
            <span style="color: #888888" >{units}</span>
        </div>
        {/each}
      </div>

    </CardContent>
    {/if}
    <CardFooter class="card-footer-tele">
        {#each icons as icon}
        {#if icon}
            <div class="card-footer-tele__icon-text">
                <!--
                  ! Цвет значка — модификатором класса (css/app.less):
                  ! alarm (тревога, например напряжение) — красный; state ('ok' |
                  ! 'warn' | 'bad') — состояние значка GPS по вердикту ГНСС.
                -->
                <Icon icon={icon.icon} class={`card-footer-tele__icon${iconMod(icon)}`} />
                <!-- <Icon icon={icon.icon} size=var(--card-footer-icon-size) class={`card-footer-tele__icon`}/> -->
                <span class="card-footer-tele__text">{icon.value}</span>
            </div>
        {/if}
        {/each}
    </CardFooter>
</Card>
<!-- </div> -->
{/if}

<script>
    // ! Row и Col удалены в Framework7 9 (сетка переписана на CSS Grid) —
    // ряд равных колонок заменён классом .row-equal из css/app.less.
    import {
        Card,
        CardHeader,
        CardContent,
        CardFooter,
        Gauge,
        Icon
    } from 'framework7-svelte';

    export let title = undefined
    export let gauge = undefined
    export let icons = undefined

    // Модификатор цвета значка: тревога важнее состояния.
    const iconMod = (icon) => {
        if (icon.alarm) return ' card-footer-tele__icon--bad'
        if (icon.state) return ` card-footer-tele__icon--${icon.state}`
        return ''
    }

/*     let visbl = true

    setInterval(() => {
      visbl = !visbl
    }, 1000) */

</script>
