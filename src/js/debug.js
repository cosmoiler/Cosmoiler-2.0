/*
 * Журнал интерфейса — только в режиме разработки (`npm run dev`).
 *
 * log(формат, ...значения) — как console.log: %s, %d, %o работают так же, как
 * у прежнего пакета debug. В сборке для прошивки (`npm run build`) log —
 * пустая функция: в браузере пользователя консоль не засоряется.
 *
 * Было: пакет debug (`debug('cosmoiler:log')`), но сразу после создания —
 * debug.disable(), и журнал молчал даже в dev, а пакет попадал в app.js, да
 * ещё при каждом запуске писал localStorage.debug (этап 3, 05.10.2026).
 */
const log = import.meta.env.DEV
  ? (...args) => console.log('[cosmoiler]', ...args)
  : () => {}

export default log
