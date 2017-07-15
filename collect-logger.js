/**
 * This file showcases a different kind of `log` interpreter where we
 * _collect_ the log lines and return them when running the
 * interpreter. See `unwrapCollectLogger` for details
 */
const {log} = require('./03-logger')
const {validCookie} = require('./04-config')
const {run} = require('./05-combining-config-and-log')
const {makeConfigInterpreter, compose} = require('./07-interpreter-factory')

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
 *
 * In spirit this is similar to the to the Writer Monad
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
  const runner = compose([
    run,
    makeConfigInterpreter({secret: 'SECRET'}),
    unwrapCollectLogger,
    handleRequest,
  ])

  const req = {
    path: '/root',
    cookie: 'SECRET',
    body: 'jo',
  }

  // Because we use the `unwrapCollectLogger` interpreter we now have a _pair_
  // of return values: The value itself and the array of logs.
  //
  // Note how we don’t need to make any changes to `run` and
  // `makeConfigInterpreter`.
  const {value, logs} = runner(req)
  console.dir({
    response: value,
    logs: logs,
  }, {depth: 3})
}

// TODO we should have a makeInterpreter like function that handles state

main()
