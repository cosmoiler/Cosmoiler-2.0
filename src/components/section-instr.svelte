<!--
  ! Подвал карточки .section-card со свёрнутой инструкцией.

  ! Единый вид карточек с инструкцией (решение пользователя 30.09.2026), образец —
  ! карточка «Масло → Макс. скорость»: заголовок и настройки (тумблер, шкала,
  ! кнопка) — на бежевом, ниже на белом — строка «Инструкция ▾», по тапу
  ! раскрывается текст. Раньше строка «Инструкция» стояла то между заголовком и
  ! тумблером («Обучение», «Спуффинг GPS»), то в самом низу («Заправка», «Доза»),
  ! а текст был курсивом другого цвета.

  ! Текст — шрифтом и цветом подписей строк карточки («Бачок был почти пуст»):
  ! 14px, --color-subtitle-text. Стили — .section-card__instr в css/app.less.
  ! Компонент ставится ПОСЛЕДНИМ в карточке.
-->
<div class="section-card__footer">
  <button class="section-more" class:is-open={open} aria-expanded={open} onclick={() => open = !open}>
    <span>{title || $t('service.system.instr.title')}</span>
    <span class="section-more__chev">▾</span>
  </button>
  {#if open}
  <div class="section-card__instr">
    <slot />
  </div>
  {/if}
</div>

<script>
  import {t} from '../services/i18n.js';

  /** Подпись строки; по умолчанию «Инструкция». */
  export let title = undefined

  let open = false
</script>
