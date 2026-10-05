
/**
 * Экземпляр Framework7 с набором компонентов Cosmoiler.
 *
 * Здесь регистрируются ТОЛЬКО компоненты с JS-поведением. Разметочные
 * компоненты (page, navbar, toolbar, subnavbar, list, list-item, block, card,
 * link, icon, badge, button) регистрации не требуют: в 9-й версии они часть
 * ядра, а их стили подключает css/framework7-custom.less.
 *
 * ! ЧТО ИЗМЕНИЛОСЬ ОТНОСИТЕЛЬНО Framework7 6:
 *   - `appbar` УДАЛЁН (его роль давно выполняет navbar) — соответствующий
 *     `import 'framework7/components/appbar'` в 9-й версии отсутствует в
 *     package.exports и валит сборку;
 *   - `elevation` УДАЛЁН вместе с классами elevation-N;
 *   - добавлен `gauge` — на нём держатся карточки телеметрии;
 *   - Grid и Progressbar не регистрируются (этап 3, 05.10.2026): классов .grid
 *     в разметке нет (ряд колонок — свой .row-equal в app.less), а
 *     f7.dialog.progress не вызывается;
 *   - из `framework7/lite` пропал экспорт `request` (в 9-й версии его нет
 *     вовсе — обмен с устройством идёт через src/js/http.js).
 *
 * ! Toast — не часть ядра lite: без регистрации f7.toast не существует, и
 *   f7.toast.show() падал с TypeError после «Заправки» (service/system.svelte)
 *   и сохранения /route/cfg (route.svelte). Стили — в css/framework7-custom.less.
 */
import Framework7, { utils, getDevice, createStore } from 'framework7/lite';
import Accordion from 'framework7/components/accordion';
import Card from 'framework7/components/card';
import Dialog from 'framework7/components/dialog';
import Gauge from 'framework7/components/gauge';
import Input from 'framework7/components/input';
import Preloader from 'framework7/components/preloader';
import PullToRefresh from 'framework7/components/pull-to-refresh';
import Radio from 'framework7/components/radio';
import Range from 'framework7/components/range';
import Skeleton from 'framework7/components/skeleton';
import Tabs from 'framework7/components/tabs';
import Toast from 'framework7/components/toast';
import Toggle from 'framework7/components/toggle';
import Typography from 'framework7/components/typography';

Framework7.use([
  Accordion,
  Card,
  Dialog,
  Gauge,
  Input,
  Preloader,
  PullToRefresh,
  Radio,
  Range,
  Skeleton,
  Tabs,
  Toast,
  Toggle,
  Typography,
]);

export default Framework7;
export { utils, getDevice, createStore };
