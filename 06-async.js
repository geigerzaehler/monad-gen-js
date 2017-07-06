/**
 * We show that `Bluebird.coroutine`, which is used to emulate
 * async/await uses the same technique.
 *
 * We also show how to incorporate async code in our commands and
 * interpreters.
 */
const Bluebird = require('bluebird')

// Returns a promise that resolves after one second with the given value
function delayed (value) {
  return Bluebird.resolve(value).delay(1000)
}

const runCoroutine = Bluebird.coroutine(function* () {
  console.log('start')
  const result = yield delayed('foo')
  console.log('end', result)
})

if (!module.parent) runCoroutine()

// Async with commands {{{
/**
 * This is basically the same code as above, but using our own
 * patterns.
 */
function* coroutine (value) {
  console.log('start')
  const result = yield* async_(delayed(value))
  console.log('end', result)
}

exports.async_ = async_
function* async_ (promise) {
  return yield { command: 'async', param: promise }
}

function run () {
  runAsync(coroutine('hello'))
}

// if (!module.parent) run()

// }}}

// function runAsync () {{{
/**
 * The interpreter for asynchronous commands
 *
 * Note that we replace the `while` loop by recursion with the `next`
 * function.
 *
 * XXX It is important to note that it is impossible to write
 * `unwrapAsync` like we did for logging and configuration
 */
exports.runAsync = runAsync
function runAsync (gen) {
  return new Promise((resolve, reject) => {
    next()
    function next (input) {
      const {done, value} = gen.next(input)
      if (done) {
        resolve(value)
      } else if (value.command === 'async') {
        value.param.then(next)
      } else {
        reject(new Error(`Unknown command ${value.command}`))
      }
    }
  })
}
// }}}
