/**
 * ! HTTP-примитив. Заменяет f7.request.
 *
 * f7.request удалён в Framework7 8 («removed in favor of native fetch»), а
 * Api.request к тому же требует созданного экземпляра приложения. Нужен ровно
 * один примитив — fetch с таймаутом, — поэтому он живёт отдельным модулем и не
 * зависит ни от f7, ни от состояния стора.
 *
 * Здесь СОЗНАТЕЛЬНО нет отметки связи (markOk): через эту функцию идут и
 * запросы в интернет за прошивкой (см. diag.svelte), а ответ cosmoiler.ru —
 * не доказательство того, что устройство на связи. Отметку ставит только
 * deviceRequest() в store.js.
 *
 * Ответ отдаётся в форме, к которой привыкли вызывающие: {data, status,
 * headers}, где data — ТЕКСТ ответа (разбор через JSON.parse на месте) либо
 * blob, если запрошен responseType: 'blob'.
 */

/** Таймаут по умолчанию, мс. */
export const DEFAULT_TIMEOUT_MS = 8000;

/** Значения, которые отправляются телом как есть, без JSON-сериализации. */
function isRawBody(data) {
  return (
    typeof data === 'string' ||
    (typeof Blob !== 'undefined' && data instanceof Blob) ||
    (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) ||
    (typeof FormData !== 'undefined' && data instanceof FormData) ||
    (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams)
  );
}

/** Приклеивает объект к адресу строкой запроса (для GET/HEAD). */
function withQuery(url, params) {
  const search = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null) search.append(key, String(value));
  });
  const query = search.toString();
  if (!query) return url;
  return url + (url.indexOf('?') === -1 ? '?' : '&') + query;
}

/**
 * Запрос.
 *
 * @param {string} url — полный адрес, включая схему.
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {any}    [options.data] — тело. Объект сериализуется в JSON, строка и
 *                 Blob уходят как есть. Для GET/HEAD объект приклеивается к
 *                 адресу строкой запроса (тела у GET быть не может).
 * @param {number} [options.timeout=DEFAULT_TIMEOUT_MS] — мс, 0 = без таймаута.
 * @param {object} [options.headers]
 * @param {string} [options.responseType='text'] — 'text' | 'blob' | 'json'.
 * @returns {Promise<{data: any, status: number, headers: Headers}>}
 */
export async function request(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const timeout = options.timeout === undefined ? DEFAULT_TIMEOUT_MS : options.timeout;
  const responseType = options.responseType || 'text';
  const headers = Object.assign({}, options.headers);

  let body;
  let address = url;
  const data = options.data;
  const bodyless = method === 'GET' || method === 'HEAD';

  if (data !== undefined && data !== null) {
    if (bodyless) {
      if (!isRawBody(data)) address = withQuery(address, data);
    } else if (isRawBody(data)) {
      body = data;
    } else {
      body = JSON.stringify(data);
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    }
  }

  // AbortController вместо xhr.timeout: у fetch своего таймаута нет.
  // ВАЖНО: обрыв через abort() — единственный способ не ждать ответа вечно.
  const controller = new AbortController();
  const timer = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : 0;

  try {
    const response = await fetch(address, {
      method,
      headers,
      body,
      signal: controller.signal,
      // Соответствует cache: false у прежних запросов — устройство отдаёт
      // состояние, кешировать его нельзя.
      cache: 'no-store',
    });

    let payload;
    if (responseType === 'blob') payload = await response.blob();
    else if (responseType === 'json') payload = await response.json();
    else payload = await response.text();

    return { data: payload, status: response.status, headers: response.headers };
  } catch (err) {
    // Отличаем свой таймаут от сетевой ошибки: по тексту ошибки это не видно,
    // а в логах разница принципиальная (см. разбор в store.js).
    if (err && err.name === 'AbortError') {
      const e = new Error('Таймаут запроса (' + timeout + ' мс): ' + address);
      e.name = 'TimeoutError';
      e.timeout = timeout;
      throw e;
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default request;
