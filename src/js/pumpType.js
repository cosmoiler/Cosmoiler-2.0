/**
 * Предел времени включения насоса T, мс — 100 % шкалы объёма масла.
 *
 * Зависит от типа насоса PMP.type (поле type ответа /settings/pump). Общий для
 * страницы насоса (settings/pump.svelte) и ручного режима (settings/manual.svelte),
 * чтобы правило было в одном месте:
 *   'B' — перистальтический насос: 5000;
 *   'C' — мембранный насос с клапаном: 1000, для жидкого масла 500, для вязкого 2000
 *         (масло выбирается на странице насоса, localStorage 'oil');
 *   'A' (самодельный, устаревший) и неизвестный тип — 500: как у прошивки
 *         (pumpDefaultDpMs), самый короткий предел — лишнего масла насос не подаст.
 */
export const typesOil = {ATF: 0, TAD: 1}

export function pumpMaxDpMs(type, oil) {
  const t = type ? type[0] : 'A'
  if (t == 'B') return 5000
  if (t == 'C') {
    if (oil == typesOil.ATF) return 500
    if (oil == typesOil.TAD) return 2000
    return 1000
  }
  return 500
}
