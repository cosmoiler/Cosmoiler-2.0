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
// Service pages
import WifiPage from '../pages/service/wifi.svelte';
import SystemPage from '../pages/service/system.svelte';
import UpdatePage from '../pages/service/update.svelte';
import AboutPage from '../pages/service/about.svelte';
import DiagPage from '../pages/service/diag.svelte';

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
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;
