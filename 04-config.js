/**
 * We show how generators help us solve the problemn of global configuration.
 *
 * We use the same patterns as in `03-logging.js`. Namely, generator
 * functions instead of functions, commands instead of execution, and
 * interpreters.
 */

// Bad config {{{
//
// We rely on a global object. This is hard to teset.
const Config = require('./config')

function handleRequestBad (req) {
  if (req.cookie === Config.secret) {
    return {status: 200}
  } else {
    return {status: 400}
  }
}
// }}}


// getConfig {{{
/**
 * Our first try with generators. Looks very similiar to
 * `handleRequestBad`.
 */
function* handleRequest1 (req) {
  const {secret} = yield* getConfig()
  if (req.cookie === secret) {
    return {status: 200}
  } else {
    return {status: 400}
  }
}

/**
 * Similar to `log`.
 * Note that, unlike `log`, we return something here
 */
exports.getConfig = getConfig
function* getConfig () {
  // Does not have a parameter like log()
  return yield {command: 'getConfig'}
}

// }}}

// function runWithConfig () {{{
/**
 * This builds on the `runWithLogger` interpreter. Note that we now
 * have an input value that we pass to the generator. This will be the
 * result of `yield* getConfig()`.
 */
function runWithConfig (config, gen) {
  let nextInput
  while (true) {
    const {value, done} = gen.next(nextInput)
    if (done) {
      return value
    }
    if (value.command === 'getConfig') {
      nextInput = config
    }
  }
}
// }}}


// function main () {{{
function main () {
  const config = {secret: 'SECRET'}
  const req = {id: 'REQUEST ID', cookie: process.argv[2]}
  const response = runWithConfig(config, handleRequest(req))
  console.log(response)
}
if (!module.parent) main()
// }}}


// Better separation {{{
/**
 * Here we abstract cookie validation. Again the generator approach is
 * modular.
 *
 * Note how `yield* x` is an expression that returns a value.
 */
function* handleRequest (req) {
  if (yield* validCookie(req)) {
    return {status: 200}
  } else {
    return {status: 400}
  }
}

exports.validCookie = validCookie
function* validCookie (req) {
  const {secret} = yield* getConfig()
  return req.cookie === secret
}
/// }}}
