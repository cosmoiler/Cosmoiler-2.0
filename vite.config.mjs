import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import compression from 'vite-plugin-compression';

/*
 * Сборка веб-интерфейса Cosmoiler (замена build/webpack.config.js + build/build.js).
 *
 * !!! ИМЕНА ФАЙЛОВ НА ВЫХОДЕ — ЖЁСТКИЙ КОНТРАКТ С ПРОШИВКОЙ !!!
 *
 * Прошивка не имеет файловой системы: интерфейс вшивается в образ через
 * EMBED_FILES (firmware/main/CMakeLists.txt), а build/sync-firmware.js переносит
 * в firmware/main/Core/WebCore/Data ровно ПЯТЬ файлов:
 *     index.html, app.css.gz, app.js.gz, fontello.woff, icon.png
 * Если Vite выдаст привычное `assets/index-<hash>.js`, скрипт sync упадёт
 * (он проверяет наличие файлов), а при частичном совпадении — прошивка молча
 * останется со старым интерфейсом. Поэтому имена заданы явно:
 *   - entryFileNames: 'app.js'   — было output.filename: '[name].js'
 *   - assetFileNames → 'app.css' — было MiniCssExtractPlugin({ filename: '[name].css' })
 *   - остальные ассеты '[name][extname]' — было url-loader name: './[name].[ext]'
 *     (именно так появляется fontello.woff в корне www)
 */
export default defineConfig({
  // Точка входа — src/index.html. Раньше её подставлял HtmlWebpackPlugin
  // (template: './src/index.html'), теперь index.html сам является entry.
  root: 'src',

  // Воспроизводит CopyWebpackPlugin из webpack.config.js:
  //   from: src/static/img  →  to: www/
  // Там лежит icon.png — один из пяти обязательных файлов для прошивки.
  publicDir: 'static/img',

  server: {
    // Порт зафиксирован: на него ссылаются задача рабочего пространства
    // «web: dev-сервер (webpack serve)» и launch-конфигурация «Web: Chrome».
    // В webpack.config.js было то же число.
    port: 8080,
    // Слушать все интерфейсы, чтобы открывать интерфейс с телефона —
    // в webpack это давал disableHostCheck: true.
    host: true,
    open: true,
  },

  build: {
    outDir: '../www', // как output.path в webpack.config.js
    emptyOutDir: true, // раньше это делал build/build.js (rimraf './www/')
    // Ничего не инлайнить в base64: имена и наличие ассетов должны быть
    // предсказуемыми (в webpack url-loader имел limit: 10000).
    assetsInlineLimit: 0,
    // Vite отдаёт ES-модули (<script type="module">). Это осознанное сужение
    // поддержки: старый browserslist (Chrome 49 / Android 7) модулей не знает.
    // Если понадобятся старые WebView — добавить @vitejs/plugin-legacy.
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: '[name].js',
        assetFileNames: (info) =>
          info.name && info.name.endsWith('.css') ? 'app.css' : '[name][extname]',
      },
    },
  },

  plugins: [
    svelte({
      // Предупреждения из node_modules не наши: framework7-svelte сам генерирует
      // десятки a11y-предупреждений (<div> с on:click и т.п.) и они полностью
      // забивают вывод сборки. Свои предупреждения (src/) показываем как есть.
      onwarn(warning, handler) {
        if (warning.filename && warning.filename.includes('node_modules')) return;
        handler(warning);
      },
    }),

    // gzip: прошивка отдаёт app.js.gz / app.css.gz с Content-Encoding: gzip
    // (см. firmware/main/Core/WebCore/WebAssets.cpp).
    // Только js и css — как и было в webpack: CompressionPlugin имел
    // test: /\.(js|css|woff|png)$/, но woff и png не проходили minRatio 0.8,
    // поэтому .gz для них не создавался.
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10000,
      filter: /\.(js|css)$/i,
      deleteOriginFile: false,
    }),
  ],
});
