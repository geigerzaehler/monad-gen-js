// How do generators work?
// =======================

// Generator producer {{{
/**
 * Generators produce values by using the `yield` expression. The
 * yielded values are returned from calling `next()` on a generator
 * function.
 */
function* genFn1 () {
  yield 'foo'
  return 'end'
}

function run1 (argument) {
  const gen1 = genFn1()
  // Returns {value: 'foo', done: false}
  console.log('genFn1.next() ~>', gen1.next())
  // Returns {value: 'end', done: true}
  console.log('genFn1.next() ~>', gen1.next())
}

// run1()

// }}}

// Generator input {{{
/**
 * `yield x` is an expression. The caller of `next()` controlls what it
 * evaluates to.
 */
function* genFn2 () {
  const result = yield 'foo'
  console.log('generator received', result)
  return 'end'
}

function run2 () {
  const gen2 = genFn2()
  // Returns {value: 'foo', done: false}
  console.log('genFn2.next() ~>', gen2.next())
  // Now execution is stopped at the evaluation of `yield 'foo'`.
  // We provide the value of the evaluation here. It is going to log
  // 'generator received bar'.
  const result = gen2.next('bar')
  // result is { value: 'end', done: true }
  console.log('genFn2.next() ~>', result)
}

// run2()

/// }}}

// yield* {{{
/**
 * The yield* statement allows us to delegate to all the yields inside
 * the argument generator.
 */
function* genFn3 () {
  yield* countdown(4)
  yield* countdown(2)
}

function* countdown (n) {
  while (n >= 0) {
    yield n
    n--
  }
}

function run3 () {
  const gen = genFn3()
  // This is a common pattern that we are going to see over and over
  // again.
  while (true) {
    const {value, done} = gen.next()
    console.log('generated', value)
    if (done) {
      break
    }
  }
}

// run3()

// }}}
