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
  <ListItem accordionItem class={`settings-main__list-item`}>
    <div slot='title' class={`list-input__label list-input__label-text_color`}>
      <span>{$t('service.diag.acord.title1')}</span>
    </div>
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
  </ListItem>
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
        <Button outline lager on:click = {downloadFW}>Скачать файлы</Button>
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
      AccordionContent,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import { f7 } from 'framework7-svelte';
   // import store from '../../js/store';
    import log from '../../js/debug.js';

    let ver = useStore('ver', (value) => ver = value);
    let connected = useStore('connected', (value) => connected = value);
    //let system = useStore('system', (value) => system = value);

    let statusFW = 0
    let statusFS = 0

    function downloadFW() {
      let fEndDownloadFW = false
      let fTestConnection = false
      f7.request({
        url: 'http://cosmoiler.ru/services/',
        method: 'GET',
        async: true,
        cache: false,
        success: (resp, status) => {
          fTestConnection = true
        },
        error: () => {
          f7.dialog.alert("Нет связи с сервером обновлений. Включите интернет и попробуйте снова.", "Cosmoiler")
          fTestConnection = false
        },
        complete: () => {
          if (fTestConnection) {
              f7.request({
                  url: 'http://cosmoiler.ru/services/download',
                  method: 'GET',
                  data: {sn: ver.sn, verfw: ver.fw},
                  async: true,
                  cache: false,
                  xhrFields: {responseType: "blob"},
                  success: function(response, status, xhr) {
                    log("Succes request FW")
                    var url = window.URL || window.webkitURL;
                    const link = document.createElement('a');
                    var blob = new Blob([response])
                    link.href = url.createObjectURL(blob);
                    const fileName = xhr.getResponseHeader('Filename')
                    const downloadFileName = decodeURIComponent(escape(fileName))
                    log(downloadFileName)
                    link.setAttribute('download', downloadFileName);
                    link.click();
                    statusFW = status
                  },
                  error: function(xhr, status) {
                    log("Error connection", status)
                    statusFW = status
                  },
                  complete: function() {
                    fEndDownloadFW = true;
                    log("Complete request FW")
                    f7.request({
                        url: 'http://cosmoiler.ru/services/download',
                        method: 'GET',
                        data: {sn: ver.sn, verfs: ver.fw.slice(-2)},
                        async: true,
                        cache: false,
                        xhrFields: {responseType: "blob"},
                        success: function(response, status, xhr) {
                          log("Succes request FS")
                          var url = window.URL || window.webkitURL;
                          const link = document.createElement('a');
                          var blob = new Blob([response])
                          link.href = url.createObjectURL(blob);
                          const fileName = xhr.getResponseHeader('Filename')
                          const downloadFileName = decodeURIComponent(escape(fileName))
                          log(downloadFileName)
                          link.setAttribute('download', downloadFileName);
                          link.click();
                          statusFS = status
                        },
                        error: function(xhr, status) {
                          statusFS = status
                          log(status)
                        },
                        complete: function() {
                          fEndDownloadFW = true;
                          log("Complete request FS: ", statusFS)
                          if ((statusFW != 200) && (statusFS != 200))
                            f7.dialog.alert("Текущая версия последняя", "Cosmoiler")
                        }
                      })
                  }
              })
          }
        }
      })
    }

</script>
