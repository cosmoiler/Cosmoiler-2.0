<Page
  name="diag"
  class={`page`}
  pageContent={true}>

  <Navbar title={$t('service.diag.title')} backLink="Back" />
<!--
  <Navbar backLink="Back">
    <NavTitle>
      {$t('service.diag.title')}
    </NavTitle>
    <NavRight>
      <span class={`nav-title-noconnection__text`}>{$t('home.noconnect')}</span>
    </NavRight>
  </Navbar> -->

  {#if !connected}
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
  {/if}



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
        <p><b>Отсутствует Wi-Fi блока.</b></p>
        <p> - выключите и включите зажигание. В течение 60 сек подключитесь к блоку;</p>
        <p> - возможно включение Wi-Fi с помощью кнопки управления без выключения зажигания:
          сделайте 4 или более коротких нажатия на кнопку.</p>
      </Block>
      {#if false}
      <Block>
        <p><b>1. Плавное погасание и зажигание светодиода или название точки доступа блока "Cosmoiler_NA" или только цифры</b></p>
        <p> - выполните пп. 1-5 раздела "Обратная связь";</p>
        <p> - настройте в смартфоне точку доступа с именем <b>сosmoiler</b> и паролем <b>12345678</b>;</p>
        <p> - выполните команду id;</p>
        <p> - если частое миагание светодиода сохраняется, см. "Руководство по эксплуатации", либо свяжитесь с разработчиками.</p>
        <p><b>1.1. Отсуствие связи с блоком управления</b></p>
        <p> - настройте точку доступа в устройстве, через которое планируется обновление, с именем <b>cosmoiler</b> и паролем <b>12345678</b>;</p>
        <p> - выключите питание блока;</p>
        <p> - нажмите и удерживайте кнопку (при отсутствии кнопки замкните 2 и 3 контакты на разъеме);</p>
        <p> - включите питание блока;</p>
        <p> - после погасания светодиода, выключите питание блока;</p>
        <p> - включите питание блока;</p>
        <p> - после погасания светодиода отпустите кнопку (размкните контакты 2 и 3 разъема);</p>
        <p> - светодиод должен начать мигать короткими вспышками;</p>
        <p> - после установления соединения с сервером обновления светодиод начнет мигать хаотично;</p>
        <p> - при успешном обновлении (через 1-2 минуты) светодиод загорится, погаснет и снова загорится, аналогично процессу при включении блока;</p>
        <p> - при ошибке обновления светодиод будет постоянно мигать, повторите процесс обновления или обратитесь к разработчикам;</p>
        <p><b>2. Отсутствует Wi-Fi блока (не является неисправностью, см. "Руководство по эксплуатации").</b></p>
        <p> - выключите и включите зажигание. В течение 60 сек подключитесь к блоку;</p>
        <p> - возможно включение Wi-Fi с помощью кнопки управления без выключения зажигания:
          сделайте 4 или более коротких нажатия на кнопку.</p>
      </Block>
      {/if}
    </AccordionContent>
  </AccordionItem>
  <!-- ! ВНИМАНИЕ: блоки ниже сознательно отключены через {#if false} и остались
       в старом синтаксисе Framework7 6 (slot='title' + ListItem accordionItem).
       При включении их нужно перевести на сниппеты так же, как элемент выше. -->
  {#if false}
  <ListItem accordionItem class={`settings-main__list-item`}>
    <div slot='title' class={`list-input__label list-input__label-text_color`}>
      <span>{$t('service.diag.acord.title2')}</span>
    </div>
    <AccordionContent>
      <Block>
        <p>1. Установите приложение Mobile Telnet (MT) через Google Play.</p>
        <p>2. В меню MT выберите Telnet Settings и установите следующие значения: Remote Host Name or IP - 192.168.4.1, Telnet Port - 23.</p>
        <p>3. Подключитесь к точке доступа Wi-Fi блока управления.</p>
        <p>4. В меню MT выберите Connect.</p>
        <p>5. Введите пароль 123 и нажмите Send</p>
        <p>6. В MT скопируте текст и отправьте, указав серийный номер Вашего смазчика в теме письма, на e-mail: cosmoiler@gmail.com</p>
      </Block>
    </AccordionContent>
  </ListItem>
  {/if}
  {#if false}
  <ListItem accordionItem class={`settings-main__list-item`}>
    <div slot='title' class={`list-input__label list-input__label-text_color`}>
      <span>{$t('service.diag.acord.title3')}</span>
    </div>
    <AccordionContent>
      <Block>
        <p>Для обновления ПО блока управления выполните следующие действия:</p>
        <p>1. Включите передачу данных (интернет) </p>
        <p>2. Скачайте и сохраните в смартфоне файл(ы) прошивки. </p>
        <Button outline lager onClick={downloadFW}>Скачать файлы</Button>
        <p>3. Подключитесь к блоку управления </p>
        <p>4. В разделе <Link href="/service/update/"><b>Обновление</b></Link> выполните следующие действия: </p>
        <p>- выберете сохраненный файл spiffs_ESP32@*.img (при наличии) и нажмите кнопку "Обновить"</p>
        <p>- выберете сохраненный файл firmware_ESP32@*.bin (при наличии) и нажмите кнопку "Обновить"</p>
        <p><b>Примечание:</b> * - версия файла.</p>
        <!-- <Button outline lager href="http://cosmoiler.ru/download/stable/ESP32/" external>Скачать файлы</Button> -->

        <!-- <Button outline lager href = "http://cosmoiler.ru/services/download?sn={ver.sn}&verfw={ver.fw}" external>Скачать файлы</Button> -->
<!--         <p></p>
        <p>2. В разделе <Link href="/service/update/"><b>Обновление</b></Link> выполнить следующие действия: </p>
        <p>- выбрать сохраненный файл spiffs_ESP32@Zm.img и нажать кнопку "Обновить"</p>
        <p>- выбрать сохраненный файл firmware_ESP32@XYYZm.bin и нажать кнопку "Обновить"</p>
        <p><b>Примечание: </b>Кроме полного обновления также возможно обновление прошивки или настроек отдельно.</p> -->
        <p></p>
      </Block>
    </AccordionContent>
  </ListItem>
  {/if }
</List>

</Page>

<script>
    import {
      Page,
      Navbar,
      BlockTitle,
      Block,
      List,
      ListItem,
      Link,
      Button,
      AccordionItem,
      AccordionToggle,
      AccordionContent,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import { f7 } from 'framework7-svelte';
   // import store from '../../js/store';
    import { request } from '../../js/http.js';
    import log from '../../js/debug.js';

    let ver = useStore('ver', (value) => ver = value);
    let connected = useStore('connected', (value) => connected = value);
    //let system = useStore('system', (value) => system = value);

    let statusFW = 0
    let statusFS = 0

    /** Отдаёт blob браузеру под именем, которое вернул сервер. */
    function saveBlob(blob, fileName) {
      if (!fileName) {
        // Заголовок Filename не читается: сервер не отдал его в
        // Access-Control-Expose-Headers. Раньше в этом случае файл сохранялся
        // под именем «null» — молча и без расширения.
        log("! Ответ без заголовка Filename: имя файла неизвестно")
      }
      var url = window.URL || window.webkitURL;
      const link = document.createElement('a');
      link.href = url.createObjectURL(blob);
      const downloadFileName = fileName ? decodeURIComponent(escape(fileName)) : 'download'
      log(downloadFileName)
      link.setAttribute('download', downloadFileName);
      link.click();
      url.revokeObjectURL(link.href)
    }

    /**
     * Скачивание файла с сервера обновлений.
     *
     * Это запрос В ИНТЕРНЕТ, а не к устройству, поэтому timeout: 0 — файл
     * прошивки заведомо скачивается дольше любого лимита для ESP32 (в http.js
     * по умолчанию 8 с).
     *
     * @returns {Promise<number>} HTTP-статус; 0 — запрос не удался.
     */
    async function downloadFromServer(params) {
      try {
        const res = await request('http://cosmoiler.ru/services/download', {
          data: params,
          timeout: 0,
          responseType: 'blob',
        })
        log("Succes request: ", res.status)
        saveBlob(res.data, res.headers.get('Filename'))
        return res.status
      } catch (err) {
        log("Error connection", err)
        return 0
      }
    }

    async function downloadFW() {
      // Проверка связи с сервером обновлений: сам файл не нужен.
      try {
        await request('http://cosmoiler.ru/services/', { timeout: 0 })
      } catch (err) {
        f7.dialog.alert("Нет связи с сервером обновлений. Включите интернет и попробуйте снова.", "Cosmoiler")
        return
      }

      // Прошивка и файловая система скачиваются последовательно и независимо:
      // отказ одного не мешает второму. Раньше второй запрос жил во вложенном
      // complete первого — то же поведение, но на 3 уровнях вложенности.
      statusFW = await downloadFromServer({sn: ver.sn, verfw: ver.fw})
      statusFS = await downloadFromServer({sn: ver.sn, verfs: ver.fw.slice(-2)})

      if ((statusFW != 200) && (statusFS != 200))
        f7.dialog.alert("Текущая версия последняя", "Cosmoiler")
    }

</script>
