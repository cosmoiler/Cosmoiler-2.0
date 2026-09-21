// Import Framework7
import Framework7 from './framework7-custom.js';

// Import Framework7-Svelte Plugin
import Framework7Svelte from 'framework7-svelte';

// ! Svelte 5: монтирование выполняется функцией mount(), конструктор
// `new App({ target })` из 4-й версии больше не поддерживается и падал с
// component_api_invalid_new.
import { mount } from 'svelte';

// Import Framework7 Styles
import '../css/framework7-custom.less';

// Import Icons and App Custom Styles
//import '../css/icons.css';
import '../css/app.less';
import '../css/fontello-embedded.css';

// Import App Component
import App from '../components/app.svelte';
import {setupi18n} from '../services/i18n.js';

// Init F7 Svelte Plugin
Framework7.use(Framework7Svelte)

setupi18n();

// Service worker здесь не регистрируется сознательно: кэш оболочки пережил бы
// обновление прошивки, и клиент открывал бы старый интерфейс (см. удалённый
// src/js/sw.js).

// Mount Svelte App
const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;
