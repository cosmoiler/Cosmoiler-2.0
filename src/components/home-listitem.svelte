<!--
  ! Framework7 9 перешёл на сниппеты Svelte 5: содержимое ListItem передаётся
  ! НЕ через slot="title"/slot="media"/..., а пропсами-сниппетами с теми же
  ! именами (title, subtitle, text, after, media). Старое slot="..." в 9-й версии
  ! просто игнорируется — элемент списка рендерился ПУСТЫМ.
  ! События тоже стали callback-пропсами: on:toggleChange → onToggleChange.
-->

{#snippet titleSlot()}
  <div class="home-list-item__title home-list-item__title_up-color">
    {title}
  </div>
{/snippet}

{#snippet subtitleSlot()}
  <div class="home-list-item__subtitle-text home-list-item__subtitle-text_color">{subtitle}</div>
  {#if gnss}
    <div transition:fade={{ delay: 500, duration: 600 }}></div>
  {/if}
{/snippet}

{#snippet textSlot()}
  <div class="home-list-item__text home-list-item__text_margin-1rem">
    <div class="row-equal">
      <!--
        ! Класс ячейки задаётся значком: param-col--city, param-col--way,
        ! param-col--off-road. По нему css/app.less ставит колонку сетки.
        ! Так значок оказывается ПОД таким же значком соседнего режима:
        ! у пробега три группы (город, трасса, бездорожье), у таймера две —
        ! без этого «бездорожье» таймера встало бы под «трассой» пробега.
      -->
      {#each icons as {name, text}}
        <div class={`param-col--${name.replace('icon-', '')}`}>
          <Icon icon={name} size="20px" class={`col-param__logo`}/>
          <span>{text}</span>
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet afterSlot()}
  <Toggle checked={toggleCheck} onToggleChange={onSelectModeToggle} />
{/snippet}

{#snippet mediaSlot()}
  {#if gnss}
    <div>
      <Icon icon={gpsIcon} size={25} class={`home-media__icon2`}/>
    </div>
  {/if}
  <div><Icon icon={titleIcon} size={36} /></div>
{/snippet}

<ListItem class={`home-list-item`}
  title={titleSlot}
  subtitle={subtitleSlot}
  text={textSlot}
  after={afterSlot}
  media={mediaSlot}
/>

<script>
    // ! Row и Col удалены в Framework7 9: сетка переписана на CSS Grid
    // (.grid / .grid-cols-N), а прежние flex-классы .row/.col исчезли вместе
    // с Svelte-компонентами. Ряд равных колонок заменён на класс .row-equal
    // (объявлен в css/app.less) — он сделан на CSS Grid, как и требует 9-я версия.
    import {
        Icon,
        ListItem,
        Toggle,
    } from 'framework7-svelte';
    import { fade } from 'svelte/transition';


    export let gnss = false
    export let title = ""
    export let subtitle = ""
    export let titleIcon = undefined
    export let gpsIcon = undefined
    export let icons = undefined
    export let toggleCheck = false
    export let onSelectModeToggle = undefined


</script>
