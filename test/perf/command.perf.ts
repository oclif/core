/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Suite} from 'benchmark'
import {Command, Flags, Args, toCached} from '../../src'

const suite = new Suite()
// eslint-disable-next-line no-promise-executor-return
const delay100 = () => new Promise(resolve => setTimeout(resolve, 100))

class C extends Command {
  static id = 'foo:bar'
  static title = 'cmd title'
  static type = 'mytype'
  static usage = ['$ usage']
  static description = 'test command'
  static aliases = ['alias1', 'alias2']
  static hidden = true
  // @ts-ignore
  static flags = {
    flaga: Flags.boolean(),
    flagb: Flags.string({
      char: 'b',
      hidden: true,
      required: false,
      description: 'flagb desc',
      options: ['a', 'b'],
      default: async () => 'a',
    }),
    flagc: Flags.integer({
      char: 'c',
      min: 1,
      max: 10,
      required: false,
      description: 'flagc desc',
      options: ['a', 'b'],
      default: async () => 5,
    }),
  }

  static args = {
    arg1: Args.string({
      description: 'arg1 desc',
      required: true,
      hidden: false,
      options: ['af', 'b'],
      default: async () => 'a',
    }),
  }

  async run() {
    this.parse()
    this.log('foo')
  }
}

class slowC extends Command {
  static id = 'foo:bar'
  static title = 'cmd title'
  static type = 'mytype'
  static usage = ['$ usage']
  static description = 'test command'
  static aliases = ['alias1', 'alias2']
  static hidden = true
  // @ts-ignore
  static flags = {
    flaga: Flags.boolean(),
    flagb: Flags.string({
      char: 'b',
      hidden: true,
      required: false,
      description: 'flagb desc',
      options: ['a', 'b'],
      default: async () => {
        await delay100()
        return 'a'
      },
    }),
    flagc: Flags.integer({
      char: 'c',
      min: 1,
      max: 10,
      required: false,
      description: 'flagc desc',
      options: ['a', 'b'],
      default: async () => {
        await delay100()
        return 5
      }}),
  }

  static args = {
    arg1: Args.string({
      description: 'arg1 desc',
      required: true,
      hidden: false,
      options: ['af', 'b'],
      default: async () => {
        await delay100()
        return 'a'
      }}),
  }

  async run() {
    this.parse()
    this.log('foo')
  }
}

suite
.add('toCached (not writing manifest)',
  {
    defer: true,
    fn: function (deferred: { resolve: () => any }) {
      toCached(C, undefined, false).then(() => deferred.resolve())
    },
  })
.add('toCached (writing manifest)',
  {
    defer: true,
    fn: function (deferred: { resolve: () => any }) {
      toCached(C, undefined, true).then(() => deferred.resolve())
    },
  })
.add('slowCommand toCached (not writing manifest)',
  {
    defer: true,
    fn: function (deferred: { resolve: () => any }) {
      toCached(slowC, undefined, false).then(() => deferred.resolve())
    },
  })
.add('slowCommand (writing manifest)',
  {
    defer: true,
    fn: function (deferred: { resolve: () => any }) {
      toCached(slowC, undefined, true).then(() => deferred.resolve())
    },
  })

// add listeners
.on('cycle', (event: any) => {
  console.log(String(event.target))
})
.run({async: true})
