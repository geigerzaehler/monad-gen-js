/**
 * In addition to logging and configuration we are going to introduce a
 * database command. This will require us to use asynchronous commands,
 * too
 *
 * Run as
 *
 *   node 07-db.js <COOKIE SECRET> <RESOURCE ID>
 */
const {log} = require('./03-logger')
const {validCookie} = require('./04-config')
const {unwrapLogging, unwrapConfig} = require('./05-combining-config-and-log')
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
function* unwrapDb (db, gen) {
  let input
  while (true) {
    const {value, done} = gen.next(input)
    if (done) {
      return value
    }

    if (value.command === 'db') {
      const {method, args} = value.param
      const resultPromise = db[method](...args)
      input = yield* async_(resultPromise)
    } else {
      input = yield value
    }
  }
}
// }}}


// function main () {{{
function main () {
  const handleRequest = createRequestRunner()

  handleRequest({
    id: 'REQUEST ID',
    cookie: process.argv[2],
    params: {id: process.argv[3]},
  }).then((response) => console.log('response', response))
}

main()

/**
 * Here we build our interpreter stack
 */
function createRequestRunner () {
  const db = {
    load (id) {
      return Promise.resolve({id: id, payload: 'P'})
    },
  }

  const config = {
    secret: 'SECRET',
  }

  const logger = console.log.bind(console)

  return function (req) {
    return runAsync(
      unwrapConfig(config,
      unwrapLogging(logger,
      unwrapDbInstrumented(db, handleRequest(req)))))
  }
}

/// }}}


// instrumentation {{{
/**
 * An interesting use case is adding logging for database queries
 * without changing the database implementation or the command
 * constructors.
 */
function* unwrapDbInstrumented (db, gen) {
  let input
  while (true) {
    const {value, done} = gen.next(input)
    if (done) {
      return value
    }

    if (value.command === 'db') {
      const {method, args} = value.param
      const resultPromise = db[method](...args)
      input = yield* async_(resultPromise)
      yield* log(`DB#${method}(${JSON.stringify(args[0])}) -> ${JSON.stringify(input)}`)
    } else {
      input = yield value
    }
  }
}
//
