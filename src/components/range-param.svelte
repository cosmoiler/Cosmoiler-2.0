<BlockTitle class="display-flex justify-content-space-between">
    <span>{title}</span>
    {#if name_value}
      <span style="color: var(--f7-theme-color-change-text)">{value} {name_value}</span>
<!--       <Input class={`settings-main__list-item`}
      type="text"
      placeholder="Введите имя"
      bind:value={value}
    >
    </Input>

    <span style="color: var(--f7-theme-color-change-text)">{name_value}</span> -->
    {/if}
  </BlockTitle>
  <List simpleList>
    <ListItem style="background-color: var(--f7-theme-color-bg-tint-color)">
      <div class="item-cell width-auto flex-shrink-0">
        <Icon icon={icon} style="font-size: 30px" />
      </div>
      <!--
        ! item-cell--grow — не украшение, а необходимость.
        !
        ! Раньше здесь стоял класс flex-shrink-3 (он есть и в F7 9), но он задаёт
        ! только flex-shrink: 3 при flex-grow: 0. Ячейка без собственной ширины и
        ! без роста сжималась в НОЛЬ, а .range-slider внутри имеет width: 100% —
        ! шкала схлопывалась в вертикальную полоску у правого края строки
        ! (замер до правки: ячейка 0x20, flex: 0 3 auto, width: 0px).
        ! item-cell--grow объявлен в css/app.less и занимает остаток строки.
        !
        ! item-cell--scale добавляется только когда рисуется шкала с подписями:
        ! именно там нужна увеличенная высота, иначе ползунок перекрывает подписи.
        ! У шкалы без подписей (например, яркость светодиода) высота остаётся
        ! штатной, и строки не растут без причины.
      -->
      <div class="item-cell item-cell--grow" class:item-cell--scale={scale}>
        <!--
          ! Проп color УБРАН. В F7 он добавляет класс вида color-<значение>, а у
          ! нас туда передавалось имя CSS-класса (range__color) — получался
          ! бессмысленный класс `color-range__color`. В 9-й версии MD-тема
          ! навешивает токены Material 3 на всё, что подходит под селектор
          ! `.md [class*='color-']`, и этот класс ловил правило
          ! `--f7-range-bar-bg-color: var(--f7-md-secondary-container)` — уже НА
          ! САМОМ элементе, где перебить его из :root невозможно. Незаполненная
          ! часть шкалы становилась сиреневой.
          ! Цвет шкалы и так задаёт наш класс range__color (css/app.less).
        -->
        <Range class="range__color !range__margin-bottom"
        min={minValue}
        max={maxValue}
        label={true}
        step={stepValue}
        value={value}
        scale={scale}
        scaleSteps={scaleStep}
        scaleSubSteps={scaleSubSteps}
        formatScaleLabel={frmtScaleLabel}
        onRangeChange={rangeChange}
        />
      </div>
      {#if icon2}
        <div class="item-cell width-auto flex-shrink-0">
          <Icon icon={icon2} style="font-size: 30px" />
        </div>
      {/if}
      {#if toggle}
        <div class="item-cell width-auto flex-shrink-0">
          <Toggle checked={toggleCheck} onToggleChange={onCtrlToggle} />
        </div>
      {/if}
<!--       <div class="item-cell width-auto flex-shrink-0">
        <Stepper small bind:value={value} buttonsOnly min={minValue} max={maxValue} step={stepValue} style="color: var(--f7-theme-color-change-text)"></Stepper>
      </div> -->

    </ListItem>
  </List>

  <script>
    // ! ListItemCell удалён в Framework7 9: в новом списке item-cell остался
    // только LESS-миксином (.item-cell() = display:block + align-self:center),
    // а класса такого нет. Разметка заменена на <div class="item-cell">,
    // а сам класс объявлен в css/app.less с теми же свойствами.
    import {
    List,
    ListItem,
    BlockTitle,
    Range,
    Icon,
    Toggle
  } from 'framework7-svelte';

  export let title = ""
  export let value = 0
  export let name_value = ""
  export let view_value = true
  export let icon = undefined
  export let minValue = 0
  export let maxValue = 10
  export let stepValue = 1
  export let scaleStep = undefined
  export let scaleSubSteps = undefined
  export let frmtScaleLabel = undefined
  export let rangeChange = undefined
  export let scale = true
  export let icon2 = undefined

  export let toggle = false
  export let toggleCheck = undefined
  export let onCtrlToggle = undefined
</script>
