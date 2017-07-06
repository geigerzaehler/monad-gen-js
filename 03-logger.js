/**
 * We separate executing the log function from defining what we want to
 * do
 */

/**
 * The logic for handling an HTTP request with logging.
 *
 * It’s a generator that emits a `log` command.
 *
 * It is very similar to `handleRequest` from `01-painful-logger.js`
 * but does not depend on global state.
 */
function* handleRequest (req) {
  yield* log('received request', req.id)
  yield* parseRequest(req.body)
  return {status: 200}
}

/**
 * Just a small abstraction around creating a `log` command. This makes
 * code look similar to the imperative way where this function would
 * actually do the logging.
 */
exports.log = log
function* log (...args) {
  yield {command: 'log', param: args}
}


// function parseRequest () {{{
/**
 * This showcases how we can have log statements in generator functions
 * that are used in the main `handleRequest`. Our approach is _composable_.
 */
function* parseRequest (body) {
  yield* log('parsing request', body.length)
  return JSON.parse(body)
}
// }}}


// function handleWithLogger () {{{
/**
 * Handles a request by running the `handleRequest` generator and
 * executing `log` commands.
 */
function handleWithLogger (log, req) {
  const gen = handleRequest(req)

  while (true) {
    const {value, done} = gen.next()
    if (done) {
      return value
    }
    if (value.command === 'log') {
      log(...value.param)
    }
  }
}
// }}}


// function main () {{{
/**
 * Test our implementation with a request and a logger.
 */
function main () {
  // XXX This is what we wanted to achieve in `01-painful-logger.js`.
  const consoleLog = (...args) => console.log('[LOG]', ...args)

  const req = {id: 'REQUEST ID', body: '{"json": true}'}
  handleWithLogger(consoleLog, req)
}
if (!module.parent) main()
// }}}


// function runWithLogger () {{{
/**
 * This is an alternative abstraction to `handleWithLogger`. It is
 * better in the sense that it works with any generator that emits
 * `log` commands.
 *
 * We call this an _interpreter_.
 */
exports.runWithLogger = runWithLogger
function runWithLogger (log, gen) {
  while (true) {
    const {value, done} = gen.next()
    if (done) {
      return value
    }
    if (value.command === 'log') {
      log(...value.param)
    }
  }
}

function createLoggingHandler (log) {
  return function (req) {
    const gen = handleRequest(req)
    return runWithLogger(log, gen)
  }
}
// }}}
