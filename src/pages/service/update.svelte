<Page
  name="update"
  class={`page`}
  pageContent={true}>

  <Navbar title={$t('service.update.title')} backLink="Back" />
  {#if !f_connected}
    <BlockTitle class={`block-title-noconnection__text`} >{$t('home.noconnect')}</BlockTitle>
  {/if}
  <BlockTitle ><span>{$t('service.update.fw.title2')}</span></BlockTitle>
  <Block strong style="background-color: var(--f7-theme-color-bg-tint-color)">
      <div>
        <input
          type='file'
          accept='.bin'
          bind:files
          bind:this={browseInput}
          class={`hidden`}
          />
        <Button outline lager onClick={selectFile}>{nameFile}</Button>
      </div>
      <div>
        <Button disabled={!files | !f_connected} fill onClick={update} class={`margin-top__20px`}>{$t('button.update')}</Button>
      </div>
  </Block>

  <BlockTitle ><span>{$t('service.update.cnfg.title')}</span></BlockTitle>
  <Block strong style="background-color: var(--f7-theme-color-bg-tint-color)">
    <Button disabled={!f_connected} fill small onClick={clickReset}>{$t('service.update.cnfg.button.title')}</Button>
  </Block>

</Page>

<script>
    import {
      Page,
      Navbar,
      Block,
      BlockTitle,
      Button,
      // Col удалён в Framework7 9 (сетка переписана на CSS Grid).
      // Здесь он всё равно ничего не делал: <Block> не flex-контейнер, поэтому
      // вложенные «колонки» и раньше шли друг под другом. Заменён на <div>.
     // Progressbar,
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import { f7 } from 'framework7-svelte';
    import { request } from '../../js/http.js';
    import log from '../../js/debug.js';

    let connected = useStore('connected', (value) => connected = value);
    let ver = useStore('ver', (value) => ver = value);
    //let system = useStore('system', (value) => system = value);

    let files;
    let browseInput;
    let nameFile;

   // $: if (!connected) document.location.reload()
    $:  f_connected = connected

    $: if (files) {
        nameFile = files[0].name
    } else nameFile = $t('service.update.file.title')

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
     * Скачивание файла прошивки с сервера обновлений.
     *
     * Это запрос В ИНТЕРНЕТ, а не к устройству, поэтому timeout: 0 — файл
     * заведомо скачивается дольше любого лимита для ESP32 (в http.js
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
        log("Succes request FW: ", res.status)
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

      statusFW = await downloadFromServer({sn: ver.sn, verfw: ver.fw})

      if ((statusFW != 200))
        f7.dialog.alert("Текущая версия последняя", "Cosmoiler")
    }

    function update() {
      //var progress_dialog = f7.dialog.progress("Обновление...");
      var preload_dialog = f7.dialog.preloader($t('service.update.fw.preload'));

      const xhr = new XMLHttpRequest();

      xhr.onload = xhr.onerror = function() {
        if (this.status == 200) {
          log("success");
          preload_dialog.close()
          f7.dialog.alert($t('service.update.fw.success'), "Cosmoiler")
        } else {
          log(this.status)
          preload_dialog.close()
          f7.dialog.alert($t('service.update.fw.error'), "Cosmoiler")
        }
      };
      xhr.open("POST", "http://192.168.4.1/update", true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.send(files[0]);
    }

    function clickReset() {
      //logger("Button")
      f7.dialog.confirm($t('service.update.cnfg.confirm.text'), "Cosmoiler",
        () => {
          //store.dispatch('cmdReset')
          f7.preloader.show();
          request('http://192.168.4.1/reset/cnfg')
          .then((res) => {
              f7.preloader.hide()
              log('192.168.4.1/status', res.data)
          })
          .catch((err) => {
            log(err)
            f7.dialog.alert($t('service.update.cnfg.confirm.error'), "Cosmoiler")
          })
        })
    }

    function selectFile() {
      browseInput.click()
    }

</script>
