// Main pages
import HomePage from '../pages/home.svelte';
import TelemetryPage from '../pages/telemetry.svelte';
import SettingsPage from '../pages/settings.svelte';
import ServicePage from '../pages/service.svelte';
// Settings pages
import TripPresetsPage from '../pages/settings/tripPresets.svelte';
import TimerPresetsPage from '../pages/settings/timerPresets.svelte';
import ManualPage from  '../pages/settings/manual.svelte';
import PumpPage from '../pages/settings/pump.svelte';
import SensorPage from '../pages/settings/sensor.svelte';
import OilPage from '../pages/settings/oil.svelte';
// Service pages
import WifiPage from '../pages/service/wifi.svelte';
import SystemPage from '../pages/service/system.svelte';
import UpdatePage from '../pages/service/update.svelte';
import AboutPage from '../pages/service/about.svelte';
import DiagPage from '../pages/service/diag.svelte';
// Отдельная страница (открывается только адресом /route/cfg, см. appview.svelte)
import RoutePage from '../pages/route.svelte';

import NotFoundPage from '../pages/404.svelte';

var routes = [
  {
    path: '/',
    component: HomePage
  },
  {
    path: '/telemetry/',
    component: TelemetryPage,
  },
  {
    path: '/settings/',
    component: SettingsPage,
  },
  {
    path: '/service/',
    component: ServicePage,
  },
  {
    path: '/settings/odometer/presets',
    component: TripPresetsPage,
  },
  {
    path: '/settings/odometer/sensor/',
    component: SensorPage
  },
  {
    path: '/settings/timer/presets',
    component: TimerPresetsPage,
  },
  {
      path: '/settings/manual/',
      component: ManualPage,
  },
  {
      path: '/settings/pump/',
      component: PumpPage
  },
  {
      // Масло: ручка дозы и макс. скорость (firmware docs/oil.md) — с вкладки «Одометр».
      path: '/settings/oil/',
      component: OilPage
  },
  {
      // То же с вкладки «Таймер»: без макс. скорости — скорость в этом режиме неизвестна.
      path: '/settings/oil/timer/',
      component: OilPage,
      options: { props: { timer: true } }
  },
  {
    path: '/service/wifi',
    component: WifiPage,
  },
  {
    path: '/service/system',
    component: SystemPage,
  },
  {
    path: '/service/update',
    component: UpdatePage,
  },
  {
    path: '/service/diag',
    component: DiagPage,
  },
  {
    path: '/service/about',
    component: AboutPage,
  },
  {
    // Параметры классификатора «трасса / город». Ссылок на страницу в
    // интерфейсе нет: она для калибровки (docs/route.md §8).
    path: '/route/cfg/',
    component: RoutePage,
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;
