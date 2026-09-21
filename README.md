# Cosmoiler — веб-интерфейс

Интерфейс смазчика Cosmoiler. Собирается в статику и **вшивается в прошивку ESP32**
(файловой системы на устройстве нет), открывается в браузере телефона после подключения
к точке доступа блока.

TODO:
1. Реализовать ограничение работы насоса не более 1 мин 30 сек.

## Стек

| Слой | Чем | Версия |
|---|---|---|
| Сборщик | **Vite** (`vite.config.mjs`) | 5.x |
| UI-фреймворк | Framework7 + framework7-svelte | **9.1.3** |
| Компоненты | Svelte | **5.x** |
| Локализация | svelte-i18n | 4.x |
| Стили | Less (+ postcss-preset-env) | |
| Сеть | нативный `fetch` (`src/js/http.js`) | |

⚠️ История: до 21.09.2026 сборка была на webpack 5 + svelte-loader + babel, затем
проект переведён на Vite (Svelte 4). Обновление Framework7 6.3.17 → 9.1.3 и
Svelte 4 → 5 сделано 22.09.2026.

⚠️ Конфиг Vite обязан быть **`.mjs`**: в `package.json` нет `type: module`,
поэтому `.js`-конфиг грузится через `require`, а `@sveltejs/vite-plugin-svelte`
существует только как ES-модуль.

⚠️ Версия плагина привязана к Vite: `@sveltejs/vite-plugin-svelte@4` требует
Vite 5 (это и выбрано), `@5` — Vite 6, `@7` — уже Vite 8. Переход на новые Vite
делать отдельным шагом вместе с повышением версии плагина.

### Что важно знать про Framework7 9

Версия 9 сломала совместимость заметно сильнее, чем обычный мажор — при правке
интерфейса это надо держать в голове:

* **`slot="..."` больше не работает.** Содержимое передаётся **сниппетами**
  Svelte 5, а имена пропсов те же: `title`, `text`, `media`, `subtitle`,
  `after`, `footer`, `label`. Пример — `src/components/home-listitem.svelte`.
  Старый `slot="title"` в 9-й версии **молча игнорируется**, а не падает:
  элемент списка просто рендерится пустым.
* **События — callback-пропсы, а не `on:`**: `on:ptrRefresh` → `onPtrRefresh`,
  `on:toggleChange` → `onToggleChange`, `on:click` → `onClick`, `on:change` →
  `onChange`. Старые `on:` тоже не падают, а просто никогда не срабатывают.
* **Удалены компоненты**: `Appbar` (его роль выполняет navbar), `Elevation`
  (классы `elevation-N`), `ListItemCell`/`ListItemRow`, `Row`/`Col`.
  * `navbar`, `toolbar`, `subnavbar`, `list`, `block`, `link`, `icon`, `badge`,
    `button`, `page`, `view` переехали в **ядро** — отдельно не подключаются;
  * сетка переписана на **CSS Grid** (`.grid` / `.grid-cols-N`), прежних
    flex-классов `.row`/`.col` нет;
  * `--f7-theme-color*` тема больше не задаёт — их обязан объявить проект
    (это делает `src/css/app.less`).
* Утилиты, компенсирующие удалённое, собраны в конце `src/css/app.less`
  (`.elevation-3`, `.item-cell`, `.row-equal`).

Полный список правок и подводных камней — в `firmware/docs/web-frontend.md` и
в комментариях к `src/js/framework7-custom.js`, `src/css/framework7-custom.less`.

### Вид списков и карточек по умолчанию

Список `<List>` в 9-й версии по умолчанию рисуется **без рамок, фона и
разделителей** — если нужен прежний вид, добавляйте `list-outline`,
`list-strong`, `list-dividers` или `inset`.

## Связь с устройством

Интерфейс общается с ESP32 обычными HTTP-запросами (`http://192.168.4.1`) — **WebSocket
не используется**, потому что WS-сервера в прошивке нет (см. `firmware/docs/web.md`).
Телеметрия опрашивается запросами, а связь контролирует сторож времени последнего
успешного ответа: `src/js/http.js` + блок «Контроль связи» в `src/js/store.js`.

## Update formware

Загрузить файл самой последней версии в ручном режиме: `http://cosmoiler.ru/services/download?sn=&verfw=0[&verfs=0]`

## NPM Scripts

* 🔥 `start` - run development server
* 🔧 `dev` - run development server
* 🔧 `build` - build web app for production (см. также файл package.json)
* 🔧 `sync` - скопировать результат сборки в `firmware/main/Core/WebCore/Data` (см. build/sync-firmware.js)
* 🔧 `build:cosmoiler` - `build` + `sync`; штатное действие после правок интерфейса

## Сборка

Работать только с файлами из `src/`. Конфигурация — `vite.config.mjs`.

```
npm run dev              # отладочный сервер http://localhost:8080
npm run build            # production-сборка в www/
npm run build:cosmoiler  # build + sync — штатное действие после правок интерфейса
```

Имена файлов в `www/` — часть контракта с прошивкой, менять их нельзя:

| Файл | Откуда |
|---|---|
| `index.html` | `src/index.html` (entry) |
| `app.js` / `app.js.gz` | `entryFileNames` в `vite.config.mjs` |
| `app.css` / `app.css.gz` | `assetFileNames` в `vite.config.mjs` |
| `fontello.woff`, `icon.png` | `publicDir` (= `src/static/img`) |

Сжатие даёт `vite-plugin-compression`; исходные `.js`/`.css` остаются на месте
(`deleteOriginFile: false`) — по ним видно результат сборки.

⚠️ `vite build` **очищает `www/` целиком** (`emptyOutDir`), поэтому синхронизацию с прошивкой
делать только ПОСЛЕ сборки — это и есть `npm run build:cosmoiler`.

⚠️ `index.html` подключает скрипт **абсолютным** путём (`/app.js`). Это принципиально: при
перезагрузке вложенного маршрута (`/settings/pump`) относительный путь давал бы запрос
`/settings/app.js`, а прошивка на неизвестный путь отдаёт `index.html` — вместо скрипта приезжал
бы HTML и приложение не стартовало.

⚠️ В dev-режиме запросы к API устройства не работают: интерфейс открыт на `localhost`, а
обращается к `192.168.4.1`. Адрес устройства можно подменить параметром в адресной строке:
`http://localhost:8080/?ws=192.168.4.1` (см. `uri()` в `src/js/store.js`).

## Capacitor — удалён

Capacitor в проекте больше не используется: интерфейс вшивается в прошивку и
отдаётся прямо с ESP32, а открывается в браузере телефона (см.
`firmware/docs/web-frontend.md`).

Удалены: зависимости `@capacitor/core|android|ios`, `@capacitor/cli`,
`cordova-res`, файл `capacitor.config.json`, каталоги `android/`, `ios/`,
`resources/` и `src/js/capacitor-app.js`. Заодно убран мёртвый plumbing в сборке:
`process.env.TARGET` и ветка `isCordova`.

Исходники иконок для PWA остались: `favicon/`, `src/static/` (источники для
вручную обновляемых файлов в `Data/`) и `web/img/icon.png`.

## Сборка попадает в прошивку

Прошивка берёт файлы из `firmware/main/Core/WebCore/Data` (они вшиваются в образ через
`EMBED_FILES`). Копирует их `build/sync-firmware.js` (`npm run sync`), причём копирует ровно
пять файлов, перечисленных выше, и **проверяет их содержимое** (gzip-магия, PNG/WOFF
сигнатуры, наличие `app.js` в `index.html`) — чтобы в образ не уехал мусор.

Остальные вшитые файлы (`favicon.ico`, `favicon16/32.png`, `icon_192x192.png`,
`icon_512x512.png`, `manifest.web`, `pwacompat.min.js`) сборкой **не создаются**: они лежат в
`Data/` «как есть», скрипт их не трогает. Заменять их — вручную.

⚠️ `EMBED_FILES` разбирается **на этапе сборки прошивки**, поэтому после `npm run sync`
образ надо пересобрать.

Подробнее о связке проектов — `firmware/docs/web-frontend.md`.

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
