/**
 * In this file we showcase `callCC`.
 *
 * The goal is to write a function that multiplies a numbers in an array. For
 * performance reasons we want to return 0 early when we encounter 0 in the
 * list. Instead of using control structures like `return` and `break` we want
 * to implement this purely functional with a reducer.
 *
 * This file has three sections
 * - Explaining how `callCC` works with a simple example
 * - Implementating the runner for `callCC`, and
 * - Implementing the multiplier
 */
const {makeInterpreter} = require('./07-interpreter-factory')
const {run} = require('./05-combining-config-and-log')

/**
 * Put everything here that you want to execute when running the script
 * We call it at the end of the file.
 */
function main () {
  // Test `simpleCallCCUse`. Switch the argument from `true` to false to see the
  // result.
  const result1 = runCallCC(simpleCallCCUse(true))
  console.log(result1)

  // Test the multiplier that exits early on zero.
  // Try replacing the first number with 0
  const numbers = [2, 3, 4]
  const result2 = runCallCC(multiplier(numbers))
  console.log(result2)
}


/**
 * The simplest use of `callCC`. If the condition is true we exit early,
 * otherwise we return normally.
 *
 * `callCC` accepts a function that will get an `exit` function. Whenever we yield
 * `exit(x)` we return from `callCC` with value `x`.
 */
function* simpleCallCCUse (shouldExitEarly) {
  const result = yield* callCC(function* (exit) {
    if (shouldExitEarly) {
      // If we’re in this branch we will have `result === 'early exit'`
      yield* exit('early exit')
      // We never reach this code
      console.log('this should not happen')
      return null
    } else {
      // If we’re in this branch we will have `result === 'normal exit'`
      return 'normal exit'
    }
  })
  return result
}


// callCCInterpreter {{
const callCCInterpreter = makeInterpreter('call-cc', function* (fn) {
  // We generate an exit command unique to this scope so that we can nest `callCC`.
  const exitCommand = {}
  function* exit (result) {
    return yield {command: exitCommand, param: result}
  }

  const gen = fn(exit)

  // Similar to the boilerlate in `makeInterpreter`. But we can’t use it since
  // we _return_ when we get the `exit` command.
  let input
  while (true) {
    const {value, done} = gen.next(input)
    if (done) {
      return value
    }

    if (value.command === exitCommand) {
      return value.param
    } else {
      input = yield value
    }
  }
})

function* callCC (fn) {
  return yield {command: 'call-cc', param: fn}
}

function runCallCC (gen) {
  return run(callCCInterpreter(gen))
}
// }}



// multiplier {{
/**
 * Multiplies a list of numbers. We run this with `callCC` so that we can exit
 * early when we discover a zero. Then the product is zero.
 */
function* multiplier (xs) {
  return yield* callCC(function* (exit) {
    return yield* reduceG(xs, function* (product, x) {
      // Uncomment this line to see that we actually exit early
      // console.log(`x = ${x}`)
      if (x === 0) {
        yield* exit('Product is 0')
      }
      return product * x
    }, 1)
  })
}


/**
 * Like `xs.reduce(f, acc)` but for generators
 */
function* reduceG (xs, f, acc) {
  for (const x of xs) {
    acc = yield* f(acc, x)
  }
  return acc
}
// }}

if (!module.parent) main()
