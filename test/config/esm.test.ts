import * as url from 'url'
import * as path from 'path'

import {Config} from '../../src/config'

import {expect, fancy} from './test'

const root = path.resolve(__dirname, 'fixtures/esm')
const p = (p: string) => path.join(root, p)

// This tests file URL / import.meta.url simulation.
const rootAsFileURL = url.pathToFileURL(root).toString()

const withConfig = fancy
.add('config', () => Config.load(rootAsFileURL))

describe('esm', () => {
  withConfig
  .it('has commandsDir', ({config}) => {
    expect([...config.plugins.values()][0]).to.deep.include({
      commandsDir: p('src/commands'),
    })
  })

  withConfig
  .stdout()
  .it('runs esm command and prerun & postrun hooks', async ctx => {
    await ctx.config.runCommand('foo:bar:baz')
    expect(ctx.stdout).to.equal('running esm prerun hook\nit works!\nrunning esm postrun hook\n')
  })

  withConfig
  .stdout()
  .it('runs faulty command, only prerun hook triggers', async ctx => {
    try {
      await ctx.config.runCommand('foo:bar:fail')
    } catch {
      console.log('caught error')
    }

    expect(ctx.stdout).to.equal('running esm prerun hook\nit fails!\ncaught error\n')
  })

  withConfig
  .stdout()
  .it('runs esm command, postrun hook captures command result', async ctx => {
    await ctx.config.runCommand('foo:bar:test-result')
    expect(ctx.stdout).to.equal('running esm prerun hook\nit works!\nrunning esm postrun hook\nreturned success!\n')
  })

  withConfig
  .stdout()
  .it('runs init hook', async ctx => {
    await (ctx.config.runHook as any)('init', {id: 'myid', argv: ['foo']})
    expect(ctx.stdout).to.equal('running esm init hook\n')
  })
})
