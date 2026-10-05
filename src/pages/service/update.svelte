<Page
  name="update"
  class={`page`}
  pageContent={true}>

  <Navbar title={$t('service.update.title')} />
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
        <Button outline large onClick={selectFile}>{nameFile}</Button>
      </div>
      <div>
        <Button disabled={!files || !f_connected} fill onClick={update} class={`margin-top__20px`}>{$t('button.update')}</Button>
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
      // Скачивание прошивки с cosmoiler.ru удалено — не вызывалось.
      useStore
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';
    import { f7 } from 'framework7-svelte';
    import { request } from '../../js/http.js';
    import { deviceUrl } from '../../js/store.js';
    import log from '../../js/debug.js';

    let connected = useStore('connected', (value) => connected = value);

    let files;
    let browseInput;
    let nameFile;

    $:  f_connected = connected

    $: if (files) {
        nameFile = files[0].name
    } else nameFile = $t('service.update.file.title')

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
      // Адрес блока — как у остальных запросов (deviceUrl): раньше здесь стоял
      // http://192.168.4.1, и обновление не работало при другом адресе (?ws=, STA).
      xhr.open("POST", deviceUrl('/update'), true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.send(files[0]);
    }

    function clickReset() {
      //logger("Button")
      f7.dialog.confirm($t('service.update.cnfg.confirm.text'), "Cosmoiler",
        () => {
          //store.dispatch('cmdReset')
          f7.preloader.show();
          request(deviceUrl('/reset/cnfg'))
          .then((res) => {
              f7.preloader.hide()
              log('/reset/cnfg', res.data)
          })
          .catch((err) => {
            log(err)
            // Без hide() индикатор ожидания оставался поверх страницы навсегда.
            f7.preloader.hide()
            f7.dialog.alert($t('service.update.cnfg.confirm.error'), "Cosmoiler")
          })
        })
    }

    function selectFile() {
      browseInput.click()
    }

</script>
