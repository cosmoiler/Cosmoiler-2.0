# Cosmoiler

TODO:
1. Реализовать ограничение работы насоса не более 1 мин 30 сек.

## Framework7 CLI Options

Framework7 app created with following options:

```
{
  "cwd": "d:\\Cosmoiler\\Prog\\Frontend\\aaaa",
  "type": [
    "web"
  ],
  "name": "My App aaa",
  "framework": "svelte",
  "template": "tabs",
  "bundler": "webpack",
  "cssPreProcessor": "less",
  "theming": {
    "customColor": false,
    "color": "#007aff",
    "darkTheme": false,
    "iconFonts": true,
    "fillBars": true
  },
  "customBuild": true,
  "customBuildConfig": {
    "rtl": false,
    "darkTheme": true,
    "lightTheme": true,
    "themes": [
      "ios",
      "md",
      "aurora"
    ],
    "components": [
      "appbar",
      "dialog",
      "popup",
      "login-screen",
      "popover",
      "actions",
      "sheet",
      "toast",
      "preloader",
      "progressbar",
      "sortable",
      "swipeout",
      "accordion",
      "contacts-list",
      "virtual-list",
      "list-index",
      "timeline",
      "tabs",
      "panel",
      "card",
      "chip",
      "form",
      "input",
      "checkbox",
      "radio",
      "toggle",
      "range",
      "stepper",
      "smart-select",
      "grid",
      "calendar",
      "picker",
      "infinite-scroll",
      "pull-to-refresh",
      "lazy",
      "data-table",
      "fab",
      "searchbar",
      "messages",
      "messagebar",
      "swiper",
      "photo-browser",
      "notification",
      "autocomplete",
      "tooltip",
      "gauge",
      "skeleton",
      "menu",
      "color-picker",
      "treeview",
      "text-editor",
      "area-chart",
      "pie-chart",
      "elevation",
      "typography"
    ]
  },
  "webpack": {
    "developmentSourceMap": true,
    "productionSourceMap": false,
    "hashAssets": false,
    "preserveAssetsPaths": false,
    "inlineAssets": true
  },
  "pkg": "io.framework7.myapp"
}
```
## Update formware

Загрузить файл самой последней версии в ручном режиме: `http://cosmoiler.ru/services/download?sn=&verfw=0[&verfs=0]`

## NPM Scripts

* 🔥 `start` - run development server
* 🔧 `dev` - run development server
* 🔧 `build` - build web app for production (см. также файл package.json)
* 🔧 `sync` - скопировать результат сборки в `firmware/main/Core/WebCore/Data` (см. build/sync-firmware.js)
* 🔧 `build:led` - `build` + `sync`; штатное действие после правок интерфейса

## WebPack

There is a webpack bundler setup. It compiles and bundles all "front-end" resources. You should work only with files located in `/src` folder. Webpack config located in `build/webpack.config.js`.

Webpack has specific way of handling static assets (CSS files, images, audios). You can learn more about correct way of doing things on [official webpack documentation](https://webpack.js.org/guides/asset-management/).

## Capacitor — удалён

Capacitor в проекте больше не используется: интерфейс вшивается в прошивку и
отдаётся прямо с ESP32, а открывается в браузере телефона (см.
`docs/web-frontend.md`).

Удалены: зависимости `@capacitor/core|android|ios`, `@capacitor/cli`,
`cordova-res`, файл `capacitor.config.json`, каталоги `android/`, `ios/`,
`resources/` и `src/js/capacitor-app.js`. Заодно убран мёртвый plumbing в сборке:
`process.env.TARGET` и ветка `isCordova` (`build/build.js`,
`build/webpack.config.js`).

## Assets

Assets (icons, splash screens) source images located in `assets-src` folder. To generate your own icons and splash screen images, you will need to replace all assets in this directory with your own images (pay attention to image size and format), and run the following command in the project directory:

```
framework7 assets
```

Or launch UI where you will be able to change icons and splash screens:

```
framework7 assets --ui
```

## Documentation & Resources

* [Framework7 Core Documentation](https://framework7.io/docs/)


* [Framework7 Svelte Documentation](https://framework7.io/svelte/)
* [Framework7 Icons Reference](https://framework7.io/icons/)
* [Community Forum](https://forum.framework7.io)

## Support Framework7

Love Framework7? Support project by donating or pledging on patreon:
https://patreon.com/vladimirkharlampidi


## CHANGES:

v5.0.0

1. Добавлена возможность обучения системы для определения параметров напряжения для обеспечения правильного вкл/выкл.
