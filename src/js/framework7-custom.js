
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
 *   - из `framework7/lite` пропал экспорт `request` (в 9-й версии его нет
 *     вовсе — обмен с устройством идёт через src/js/http.js).
 */
import Framework7, { utils, getDevice, createStore } from 'framework7/lite';
import Accordion from 'framework7/components/accordion';
import Card from 'framework7/components/card';
import Dialog from 'framework7/components/dialog';
import Gauge from 'framework7/components/gauge';
import Grid from 'framework7/components/grid';
import Input from 'framework7/components/input';
import Preloader from 'framework7/components/preloader';
import Progressbar from 'framework7/components/progressbar';
import PullToRefresh from 'framework7/components/pull-to-refresh';
import Radio from 'framework7/components/radio';
import Range from 'framework7/components/range';
import Skeleton from 'framework7/components/skeleton';
import Tabs from 'framework7/components/tabs';
import Toggle from 'framework7/components/toggle';
import Typography from 'framework7/components/typography';

Framework7.use([
  Accordion,
  Card,
  Dialog,
  Gauge,
  Grid,
  Input,
  Preloader,
  Progressbar,
  PullToRefresh,
  Radio,
  Range,
  Skeleton,
  Tabs,
  Toggle,
  Typography,
]);

export default Framework7;
export { utils, getDevice, createStore };
