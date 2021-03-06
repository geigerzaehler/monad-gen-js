Monadic Programming with JavaScript Generators
==============================================

This repository provides some example code for using a command/interpreter based
programming technique.

If you want the motivation and concepts behind this explained step by step, just
follow the files from `01-painful-logger.js` to `08-db.js`. All of these files
are runnable and you can play around with them.

To run files you will need Node v6 or higher and run `npm install` or `yarn
install`.

If you are using VIM as your editor, the files come with folding defaults that
allow you to discover the code incrementally. (See `.vimrc`.)

You can also skip to the end to run the finished code with

    $ node 08-db.js <COOKIE SECRET> <RESOURCE ID>

There are also additional files that showcase some cool things you can do with
this approach.

- [`call-cc.js`](./call-cc.js) shows you how you can use a “call with current
  continuation” pattern to do early returns and manipulate the control flow.
- [`collect-logger.js`](./collect-logger.js) shows you to build a logging
  interpreter that collects and returns the logging statements instead of
  executing a function.
