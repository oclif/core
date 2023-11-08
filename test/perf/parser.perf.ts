/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Suite} from 'benchmark'

import {Flags} from '../../src'
import {parse} from '../../src/parser'

const suite = new Suite()

// eslint-disable-next-line no-promise-executor-return
const delay100 = () => new Promise((resolve) => setTimeout(resolve, 100))

suite
  .add('simple', {
    defer: true,
    fn(deferred: {resolve: () => any}) {
      parse(['--bool'], {
        flags: {
          bool: Flags.boolean(),
        },
      }).then(() => deferred.resolve())
    },
  })
  .add('multiple async flags that take time', {
    defer: true,
    fn(deferred: {resolve: () => any}) {
      parse(['--flagA', 'foo', '--flagB', 'bar'], {
        flags: {
          flagA: Flags.string({
            async parse(input) {
              await delay100()
              return input
            },
          }),
          flagB: Flags.string({
            async parse(input) {
              await delay100()
              return input
            },
          }),
        },
      }).then(() => deferred.resolve())
    },
  })

  .add('flagstravaganza', {
    defer: true,
    fn(deferred: {resolve: () => any}) {
      const flags = [
        ['--bool'],
        ['-S', 'foo'],

        ['--dep-string', 'foo'],
        ['--excl-string', 'foo'],
        ['--exactly-one', 'foo'],

        ['--parsed-string-as-number', '5'],
        ['--dir', process.cwd()],
        ['--file', __filename],

        ['--multiple', '1'],
        ['--multiple', '2'],
        ['--multiple', '3'],
        ['--multiple2', '5,6,7,8,9,10,11'],
      ]
      const exactlyOne = ['exactly-one-nope', 'exactly-one-nope2', 'exactly-one']
      parse(flags.flat(), {
        flags: {
          bool: Flags.boolean(),
          string: Flags.string({char: 's', aliases: ['S']}),

          'dep-string': Flags.string({dependsOn: ['string']}),
          // don't populate this one, used for exclusive test
          nope: Flags.boolean(),
          'excl-string': Flags.string({exclusive: ['nope']}),
          'exactly-one-nope': Flags.string({exactlyOne}),
          'exactly-one-nope2': Flags.string({exactlyOne}),
          'exactly-one': Flags.string({exactlyOne}),

          'parsed-string-as-number': Flags.integer({
            parse: (input) => Promise.resolve(Number.parseInt(input, 10) + 1000),
          }),
          dir: Flags.directory({exists: true}),
          file: Flags.file({exists: true}),

          multiple: Flags.string({multiple: true}),
          multiple2: Flags.string({multiple: true, delimiter: ','}),
        },
      }).then(() => deferred.resolve())
    },
  })

  // add listeners
  .on('cycle', (event: any) => {
    console.log(String(event.target))
  })
  .run({async: true})
