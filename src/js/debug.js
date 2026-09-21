// Было `var debug = require('debug')` — CommonJS. Под webpack это работало
// (webpack сам разбирает require), но Vite/rollup отдаёт ES-модули, и в браузере
// `require` не существует: приложение падало на старте с
// «ReferenceError: require is not defined».
import debug from 'debug'
/* var logger = debug('cosmoiler:logger') */
var log = debug('cosmoiler:log')
//var logHome = debug('home:log')

debug.disable()

localStorage.debug = 'cosmoiler:*'
//localStorage.debug = 'home:*'

//export {log as log, logHome as logHome}
export default log
