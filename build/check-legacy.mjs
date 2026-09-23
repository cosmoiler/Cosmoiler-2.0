/*
 * Сверка с legacy-интерфейсом (эталон до перехода на Framework7 9).
 *
 * Зачем: при переносе интерфейса легко НЕЗАМЕТНО потерять класс разметки или
 * правило стиля — сборка при этом проходит, ошибок нет, и дефект всплывает уже
 * на телефоне. Скрипт показывает расхождения по именам классов, чтобы каждое
 * было осознанным решением, а не случайностью.
 *
 * Запуск:  npm run legacy:check
 *          npm run legacy:check -- "D:\путь\к\другому\эталону"
 *
 * Путь эталона по умолчанию: D:\Cosmoiler\Prog\Frontend\ver4
 * (оригинальная копия интерфейса на Framework7 6, см. agents.md).
 *
 * ! Расхождение — не ошибка, а ВОПРОС. Часть отличий обязана быть: в 9-й версии
 *   удалены Row/Col/Appbar/Elevation, сетка переписана на CSS Grid, а решения
 *   вида «иконка таббара в <span>» появились нарочно. Читать вывод нужно так:
 *   для каждого расхождения понимать, нарочное оно или потеря.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DEFAULT_LEGACY = 'D:\\Cosmoiler\\Prog\\Frontend\\ver4';
const CURRENT_ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const legacyRoot = process.argv[2] || DEFAULT_LEGACY;

if (!existsSync(legacyRoot)) {
  console.error(`Эталон не найден: ${legacyRoot}`);
  console.error('Передайте путь аргументом: npm run legacy:check -- "D:\\путь\\к\\эталону"');
  process.exit(1);
}

/** Все файлы под каталогом с нужными расширениями. */
function walk(dir, exts) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === 'www' || name === 'dist') continue;
      out.push(...walk(full, exts));
    } else if (exts.includes(extname(name))) {
      out.push(full);
    }
  }
  return out;
}

/** Имена классов из статических class="..." (или class={`...`}) в разметке. */
function markupClasses(root) {
  const set = new Set();
  for (const file of walk(root, ['.svelte', '.html'])) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/class\s*=\s*[{"'`]([^"'`}]+)/g)) {
      for (const cls of m[1].split(/\s+/)) {
        if (/^[a-zA-Z][\w-]*$/.test(cls)) set.add(cls);
      }
    }
  }
  return set;
}

/** Имена классов, встречающиеся в css/*.less и css/*.css. */
function cssClasses(root) {
  const set = new Set();
  const dir = join(root, 'src', 'css');
  if (!existsSync(dir)) return set;
  for (const file of walk(dir, ['.less', '.css'])) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\.([a-zA-Z][\w-]*)/g)) set.add(m[1]);
  }
  return set;
}

function report(title, legacy, current) {
  const lost = [...legacy].filter((x) => !current.has(x)).sort();
  const added = [...current].filter((x) => !legacy.has(x)).sort();
  console.log(`\n=== ${title} ===`);
  console.log(`-- есть в эталоне, нет у нас (${lost.length}) --`);
  for (const x of lost) console.log('   ' + x);
  console.log(`-- есть у нас, нет в эталоне (${added.length}) --`);
  for (const x of added) console.log('   ' + x);
}

console.log(`Эталон:  ${legacyRoot}`);
console.log(`Проект:  ${CURRENT_ROOT}`);

report(
  'КЛАССЫ В РАЗМЕТКЕ',
  markupClasses(join(legacyRoot, 'src')),
  markupClasses(join(CURRENT_ROOT, 'src')),
);

report(
  'КЛАССЫ В СТИЛЯХ',
  cssClasses(legacyRoot),
  cssClasses(CURRENT_ROOT),
);

console.log('\nПомните: расхождение — это вопрос, а не приговор. Проверяйте, нарочное оно.');
