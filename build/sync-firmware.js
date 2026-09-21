#!/usr/bin/env node
/*
 * sync-firmware.js — копирование собранного веб-интерфейса в прошивку.
 *
 * Прошивка (проект firmware, папка D:\Cosmoiler\Prog\Cosmoiler-AI\firmware)
 * не имеет файловой системы: файлы интерфейса вшиваются
 * в образ через EMBED_FILES в main/CMakeLists.txt, а описание «URI -> файл»
 * лежит в main/Core/WebCore/WebAssets.cpp. Поэтому после каждой сборки www/
 * нужные файлы должны оказаться в main/Core/WebCore/Data/.
 *
 * Копируется ТОЛЬКО то, что создаёт сборка (Vite + vite-plugin-compression):
 *     index.html, app.css.gz, app.js.gz, fontello.woff, icon.png
 *
 * Остальные вшитые файлы (favicon.ico, favicon16.png, favicon32.png,
 * icon_192x192.png, icon_512x512.png, manifest.web, pwacompat.min.js) сборкой
 * НЕ создаются — они лежат в Data «как есть» и этот скрипт их не трогает и не
 * удаляет. Если понадобится заменить их (новые иконки PWA) — делать вручную.
 *
 * Каталог назначения берётся из переменной окружения COSMOILER_DATA, иначе
 * используется путь по умолчанию (проект прошивки firmware).
 *
 * Запуск:
 *     npm run sync          # только копирование
 *     npm run build:cosmoiler   # сборка + копирование
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DefaultDataDir = 'D:/Cosmoiler/Prog/Cosmoiler-AI/firmware/main/Core/WebCore/Data';

const wwwDir = path.resolve(__dirname, '..', 'www');
const dataDir = path.resolve(process.env.COSMOILER_DATA || DefaultDataDir);

/** Файлы, которые создаёт сборка, и что ожидается внутри (для проверки). */
const files = [
  'index.html',
  'app.css.gz',
  'app.js.gz',
  'fontello.woff',
  'icon.png',
];

/** Правила проверки содержимого: чтобы в прошивку не уехал мусор. */
const checks = {
  '.gz': (buf) => buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b,
  '.html': (buf) => buf.toString('utf8').indexOf('app.js') !== -1,
  '.png': (buf) => buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47,
  '.woff': (buf) =>
    buf.length > 4 && (buf.readUInt32BE(0) === 0x774f4646 || buf.readUInt32BE(0) === 0x774f4632),
};

function fail(message) {
  console.error('[sync] ERROR: ' + message);
  process.exit(1);
}

function digest(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function check(name, buf) {
  const ext = path.extname(name);
  const rule = checks[ext];
  if (rule && !rule(buf)) return false;
  return true;
}

if (!fs.existsSync(path.join(wwwDir, 'index.html'))) {
  fail('no ' + path.join(wwwDir, 'index.html') + ' - run "npm run build" first');
}
if (!fs.existsSync(dataDir)) {
  fail('destination folder not found: ' + dataDir + ' (override with COSMOILER_DATA)');
}

console.log('[sync] ' + wwwDir + '  ->  ' + dataDir);

let copied = 0;
let same = 0;
let total = 0;

files.forEach((name) => {
  const src = path.join(wwwDir, name);
  const dst = path.join(dataDir, name);

  if (!fs.existsSync(src)) fail('missing built file: ' + src + ' - run "npm run build" first');

  const buf = fs.readFileSync(src);
  if (!check(name, buf)) fail('unexpected content of ' + name + ' (build broken?)');

  total += buf.length;
  const hash = digest(buf);
  const oldBuf = fs.existsSync(dst) ? fs.readFileSync(dst) : null;
  const status = oldBuf && digest(oldBuf) === hash ? 'same' : oldBuf ? 'COPY' : 'NEW ';

  if (status === 'same') {
    same += 1;
  } else {
    fs.writeFileSync(dst, buf);
    copied += 1;
  }

  console.log(
    '       ' + status + ' ' + name.padEnd(16, ' ') + String(buf.length).padStart(8, ' ') + ' B'
  );
});

console.log(
  '[sync] copied ' + copied + ', unchanged ' + same + ': ' + total + ' B total'
);
