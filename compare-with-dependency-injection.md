# How does this approach compare to dependency injection?

Dependency injection seems less complex:

~~~js
function createRequestHandler (log, getConfig) {
  return function handleRequest(req) {
    log('got a request')
    if (getConfig().secret !== req.cookie) {
      log('bad cookie!')
   }
  }
}
~~~

Yes indeed, this is easier to understand and requires less machinery. However,
there are a couple of drawbacks.

First of all there is boilerplate: Every function now is wrapped in another
function that specifies the dependencies. And every where we want to use a
function we need to pass in the dependencies first.

But a more serious problem is that dependencies are treated as independent
entities. That may not be the case. The `unwrapDbInstrumented` function in
`07-db.js` shows how we can use logging inside the database interpreter to
provide instrumentation. The key advantage is that we can do this without
relying on a specific logger implementation and without knowing about the
database internals.

Let’s try to accomplish database instrumentation with dependency injection. We
start of with something like this:
~~~js
function createRequestHandler (log, getConfig, db) {
  const loadFromDb = makeLoadFromDb(db)

  return function handleRequest(req) {
    // ...
    loadFromDb(req.id).then((record) => {
      // ...
    })
  }
}

function makeLoadFromDb (db) {
  return function loadFromDb(resourceId) {
    return db.load(resourceId)
  }
}
~~~

A naive way to add instrumentation would be to change `makeLoadFromDb`. But if
we do that we get instrumentation every time we handle a request. Instead, the
caller of `createRequestHandler` should control if we instrument or not. For
this we add instrumentation to `db` before we pass it to `createRequestHandler`.
This leads to

~~~js
function createRequestHandlerWithDbInstrumenation (log, getConfig, db) {
  const instrumentedDb = db;
  instrumentedDb.load = function (id) {
    log('...')
    return db.load(id)
  }
  return createRequestHandler(log, getConfig, instrumentedDb)
}
~~~

We already see that this approach is very verbose and requires us to emulate a
`db` object, thus increasing the coupling between the database object and the
implementation.

Let’s have a look at composability of instrumentation Assume we want to
instrument access to the configuration instead. We write

~~~js
function createRequestHandlerWithConfigInstrumentation (log, getConfig, db) {
  function getConfigInstrumented () {
    log('...')
    return getConfig();
  }
  return createRequestHandler(log, getConfigInstrumented, instrumentedDb)
}
~~~

The problem now is that we cannot compose the config and DB instrumentation.
With command/interpreters this is easy.

~~~js
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
      log('...')
      input = yield* async_(resultPromise)
    } else {
      input = yield value
    }
  }
}

function* unwrapConfigInstrumented (db, gen) {
  let input
  while (true) {
    const {value, done} = gen.next(input)
    if (done) {
      return value
    }
    if (value.command === 'getConfig') {
      input = config
      log('...')
    } else {
      input = yield value
    }
  }
  }
}

function* unwrapConfigAndDbInstrumented (db, config, gen) {
  return unwrapConfigInstrumented(config, unwrapDbInstrumented(gen));
}
~~~

Finally try implementing something like provided in
[`collect-logger.js`](./collect-logger.js) with dependency injection.
