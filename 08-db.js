/**
 * In addition to logging and configuration we are going to introduce a
 * database command. This will require us to use asynchronous commands,
 * too
 *
 * Run as
 *
 *   node 08-db.js <COOKIE SECRET> <RESOURCE ID>
 */
const {log} = require('./03-logger')
const {validCookie} = require('./04-config')
const {
  makeLoggingInterpreter,
  makeConfigInterpreter,
  makeInterpreter,
  compose,
} = require('./07-interpreter-factory')
const {runAsync, async_} = require('./06-async')

function* handleRequest (req) {
  yield* log('received request', req.id)
  if (yield* validCookie(req)) {
    const record = yield* loadFromDb(req.params.id)
    return {status: 200, body: record}
  } else {
    return {status: 400}
  }
}

// This is similar to `log()` and `getConfig()`. It just defines a
// command.
function* loadFromDb (id) {
  return yield {command: 'db', param: {method: 'load', args: [id]}}
}


// function* unwrapDb () {{{
/**
 * Our interpreter for database commands.
 *
 * Note that instead of handling the `db` commands natively, we wrap
 * them again as `async` commands.
 *
 * Other than that it is pretty similar to all the unwrapX functions.
 */
function makeDbInterpreter (db) {
  return makeInterpreter('db', function* ({method, args}) {
    const resultPromise = db[method](...args)
    return yield* async_(resultPromise)
  })
}
// }}}


// function main () {{{
function main () {
  const db = {
    load (id) {
      return Promise.resolve({id: id, payload: 'P'})
    },
  }
  const config = { secret: 'SECRET' }
  const logger = console.log.bind(console)

  const handleRequest = createRequestRunner(db, config, logger)

  handleRequest({
    id: 'REQUEST ID',
    cookie: process.argv[2],
    params: {id: process.argv[3]},
  }).then(
    (response) => console.log('response', response),
    (err) => console.error(err)
  )
}

main()

/**
 * Here we build our interpreter stack
 */
function createRequestRunner (db, config, logger) {
  const run = compose([
    runAsync,
    makeLoggingInterpreter(logger),
    makeConfigInterpreter(config),
    makeDbInterpreter(db),
    // makeInstrumentedDbInterpreter(db),
  ])

  return function (req) {
    return run(handleRequest(req))
  }
}

/// }}}


// instrumentation {{{
/**
 * An interesting use case is adding logging for database queries
 * without changing the database implementation or the command
 * constructors.
 */
function makeInstrumentedDbInterpreter (db) {
  return makeInterpreter('db', function* ({method, args}) {
    const resultPromise = db[method](...args)
    const result = yield* async_(resultPromise)
    yield* log(`DB#${method}(${JSON.stringify(args[0])}) -> ${JSON.stringify(result)}`)
    return result
  })
}
//
