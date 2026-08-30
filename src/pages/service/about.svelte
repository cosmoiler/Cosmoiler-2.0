<Page
  name="about"
  class={`page`}
  pageContent={true}>

  <Navbar title={$t('service.about')} backLink="Back" />

  <Block strong class={`settings-main__list-item`}>
    <Block>
      <p align="center"><b>{$t('service.about.block1')}</b></p>
    </Block>

    <Block>
      <p>{$t('service.about.block2')}</p>
    </Block>

    <Block>
      <p>{$t('service.about.block3')}<Link href="https://vk.com/cosmoiler" external>Cosmoiler</Link></p>
    </Block>
  </Block>

</Page>

<script>
    import {
      Page,
      Link,
      Navbar,
      Block,
    } from 'framework7-svelte';
    import {t} from '../../services/i18n.js';

    function Save() {

    }
</script>
