/**
 * Here we put logging and getting configuration from the two previous
 * steps together.
 *
 * We show that interpreters, like commands, compose neatly.
 */
const {log} = require('./03-logger')
const {validCookie} = require('./04-config')


/**
 * Our generator produces `log` and `getConfig` commands.
 */
function* handleRequest (req) {
  yield* log('received request', req.id)
  if (yield* validCookie(req)) {
    return {status: 200}
  } else {
    return {status: 400}
  }
}

// function runWithConfigAndLogging () {{{
/**
 * This function merges the `runWithConfig` and runWithLogger`
 * interpreters.
 */
function runWithConfigAndLogging1 (config, log, gen) {
  // If we encounter a command that yields an output we assign the
  // output to this value.
  let nextInput
  while (true) {
    const {value, done} = gen.next(nextInput)
    if (done) {
      return value
    }
    if (value.command === 'getConfig') {
      nextInput = config
    } else if (value.command === 'log') {
      log(...value.param)
      // We want `yield log(...)` to return `undefined`.
      nextInput = undefined
    } else {
      throw new Error('Unknown command')
    }
  }
}
// }}}


// function main () {{{

function main () {
  const config = {secret: 'SECRET'}
  const req = {id: 'REQUEST ID', cookie: process.argv[2]}
  const response = runWithConfigAndLogging1(
    config,
    console.log.bind(console),
    handleRequest(req),
  )
  console.log(response)
}
if (!module.parent) main()
// }}}


// functiong unwrapLogging () {{{
/**
 * Takes a generator, handles all the 'log' commands and returns a generator
 * that yields all other commands.
 */
exports.unwrapLogging = unwrapLogging
function* unwrapLogging (log, gen) {
  let input
  while (true) {
    const {value, done} = gen.next(input)
    if (done) {
      return value
    }
    if (value.command === 'log') {
      log('LOG', ...value.param)
    } else {
      // We yield an unhandled command to be handled by another interpreter.
      input = yield value
    }
  }
}

// }}}

// functiong unwrapConfig () {{{
exports.unwrapConfig = unwrapConfig
function* unwrapConfig (config, gen) {
  let input
  while (true) {
    const {value, done} = gen.next(input)
    if (done) {
      return value
    }
    if (value.command === 'getConfig') {
      input = config
    } else {
      input = yield value
    }
  }
}
// }}}


// combine unwrap {{{
/**
 * The improved version of `runWithConfigAndLogging` that separates
 * concerns.
 */
function runWithConfigAndLogging (config, log, gen) {
  return run(
    unwrapLogging(log,
    unwrapConfig(config, gen)))

  // Some alternatives that do the same thing:

  // return run(
  //   unwrapConfig(config,
  //   unwrapLogging(log, gen)))

  // return runWithLogger(log
  //   unwrapConfig(config, gen))

  // return runWithConfig(config,
  //   unwrapLogging(log, gen))
  //   unwrapConfig(config, gen)))
}


/**
 * this is the top-level interpreter that converts a generator to a
 * function. We assert that all commands are handled and the generator
 * does not yield anything.
 */
function run (gen) {
  const {value, done} = gen.next()
  if (done) {
    return value
  } else {
    throw new Error('Unkown value yielded')
  }
}
/// }}}
