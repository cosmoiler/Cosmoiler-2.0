<Page
  name="diag"
  class={`page`}
  pageContent={true}>

  <Navbar title={$t('service.diag.title')} />

<!-- Диагностика -->
<List accordionList>
  <!-- ! Framework7 9: аккордеон собран из AccordionItem / AccordionToggle /
       AccordionContent. Старая схема «ListItem accordionItem + AccordionContent
       внутри» в 9-й версии НЕ работает: ListItem подставляет {@render children}
       только когда нет swipeout/accordionItem, то есть вложенный контент просто
       отбрасывается. Заголовок передаётся сниппетом в проп title. -->
  {#snippet diagTitle1()}
    <div class={`list-input__label list-input__label-text_color`}>
      <span>{$t('service.diag.acord.title1')}</span>
    </div>
  {/snippet}
  <AccordionItem>
    <AccordionToggle>
      <ListItem link class={`settings-main__list-item`} title={diagTitle1} />
    </AccordionToggle>
    <AccordionContent>
      <Block>
        <p><b>{$t('service.diag.nowifi.title')}</b></p>
        <p> - {$t('service.diag.nowifi.p1')}</p>
        <p> - {$t('service.diag.nowifi.p2')}</p>
      </Block>
    </AccordionContent>
  </AccordionItem>
</List>

</Page>

<script>
    // Скачивание прошивки с cosmoiler.ru и всегда скрытые разделы
    // «Обратная связь» / «Обновление» удалены (этап 3, 05.10.2026): они не
    // показывались, а код загрузки файлов прошивки нигде не вызывался.
    import {
      Page,
      Navbar,
      Block,
      List,
      ListItem,
      AccordionItem,
      AccordionToggle,
      AccordionContent,
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
</script>
