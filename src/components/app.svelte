<App { ...f7params } >

  <Main/>

</App>

<script>
  import { onMount } from 'svelte';
  import {
    f7ready,
    App,
  } from 'framework7-svelte';

  import routes from '../js/routes';
  import store from '../js/store';
  import Main from '../pages/appview.svelte';

  // Framework7 Parameters
  let f7params = {
    name: 'Cosmoiler 2.0', // App name
    theme: 'auto', // Automatic theme detection

    id: 'com.cosmoiler.app', // App bundle ID
    // App store
    store: store,
    // App routes
    routes: routes,
  };

  onMount(() => {

    f7ready(() => {
      // Call F7 APIs here
      store.dispatch('init')
    });
  })

</script>
