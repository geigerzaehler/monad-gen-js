/**
 * This file showcases our initial problem: Logging is not easy
 * configurable and depends on global state.
 *
 * This file is not runnable
 */
import {log} from './logger'

export default function handleRequest (req) {
  log('received request', req.id)
  return {status: 200}
}


// Main application  {{{
// ****************************************

import handleRequest from './handleRequest'
import {useLogger} from './logger'

// XXX Mutating global state
useLogger('development')

app.use(handleRequest)

// }}}


// This would be neat {{{
// We are going to see it in `03-logger.js`.

const logger = (...args) => console.log(...args)
app.use(withLogger(handleRequest, logger))

// }}}
