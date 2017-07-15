/**
 * We have seen some repetetive patterns in the `unwrapLogging` and
 * `unwrapConfig` functions in 05-combining-config-and-log.js. Let’s try to
 * abstract them.
 *
 * Note that the `unwrapX` functions received their dependency (that is `log` or
 * `config` as the first parameter and the generator they needed to unwrap as
 * their second parameter. Here we choose a different approach where we curry
 * the interpreters so that we return a function that receives only a generator.
 * We will see below how this helps us to write better code.
 */

/**
 * This function creates an generator function that handles a command.
 *
 * It includes only the common code we have seen in `unwrapX` so far. See the
 * uses below to get an idea how it works.
 */
exports.makeInterpreter = makeInterpreter
function makeInterpreter (command, handler) {
  return function* (gen) {
    let input
    while (true) {
      const {value, done} = gen.next(input)
      if (done) {
        return value
      }

      if (value.command === command) {
        input = yield* handler(value.param)
      } else {
        input = yield value
      }
    }
  }
}


// config interpreter {{
/**
 * Instead of implementing `unwrapConfig` directly we base it on this function.
 * It will come in handy later.
 */
exports.makeConfigInterpreter = makeConfigInterpreter
function makeConfigInterpreter (config) {
  return makeInterpreter('getConfig', function* () {
    return config
  })
}

exports.unwrapConfig = unwrapConfig
function* unwrapConfig (config, gen) {
  return yield* makeConfigInterpreter(config)(gen)
}
// }}


// logging interpreter {{
exports.makeLoggingInterpreter = makeLoggingInterpreter
function makeLoggingInterpreter (log) {
  return makeInterpreter('log', function* (args) {
    log('LOG', ...args)
  })
}

exports.unwrapLogging = unwrapLogging
function* unwrapLogging (log, gen) {
  return yield* makeLoggingInterpreter(log)(gen)
}
// }}


// composition {{

/**
 * Here we reap the benefits of the currying above and the separation between
 * creating and interpreter and unwrapping a generator.
 *
 * It is now very easy to stack interpreters.
 */
function* unwrapLoggingAndConfig (log, config, gen) {
  const interpreter = compose([
    makeLoggingInterpreter(log),
    makeConfigInterpreter(config),
  ])

  return yield* interpreter(gen)
}

/**
 * This function takes an array of functions and returns the composed functions.
 *
 * It will come in handy later on when we want to stack interpreters.
 */
exports.compose = compose
function compose (fns) {
  return function (arg) {
    return fns.reduceRight((arg, fn) => fn(arg), arg)
  }
}
// }}
