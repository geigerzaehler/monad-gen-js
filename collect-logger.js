/**
 * This file showcases a different kind of `log` interpreter.
 *
 * See `unwrapCollectLogger`
 */
const {log} = require('./03-logger')
const {validCookie} = require('./04-config')
const {run, unwrapConfig} = require('./05-combining-config-and-log')

function* handleRequest (req) {
  yield* log('received request', req)
  if (yield* validCookie(req)) {
    yield* log('authenticated')
    return {status: 200}
  } else {
    return {status: 400}
  }
}

/**
 * This logging interpreter is different from others in that it does not have an
 * argument. Instead of delegating the logging to a function we collect all
 * logging statements and return them when we are done interpreting the actions.
 */
function* unwrapCollectLogger (gen) {
  const logs = []
  let input
  while (true) {
    const {value, done} = gen.next(input)
    if (done) {
      return {value, logs}
    }
    if (value.command === 'log') {
      logs.push(value.param)
    } else {
      // We yield an unhandled command to be handled by another interpreter.
      input = yield value
    }
  }
}

function main () {
  const req = {
    path: '/root',
    cookie: 'SECRET',
    body: 'jo',
  }

  // Because we use the `unwrapCollectLogger` interpreter we now have a _pair_
  // of return values: The value itself and the array of logs.
  //
  // Note how this is handled transparently by `unwrapConfig` and `run`.
  const {value, logs} = run(
    unwrapConfig({secret: 'SECRET'},
    unwrapCollectLogger(handleRequest(req))))
  console.dir({
    response: value,
    logs: logs,
  }, {depth: 3})
}

main()