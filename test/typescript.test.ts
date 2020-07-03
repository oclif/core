import * as path from 'path'

import * as Config from '../src'

import {expect, fancy} from './test'

const root = path.resolve(__dirname, 'fixtures/typescript')
const p = (p: string) => path.join(root, p)

const withConfig = fancy
.add('config', () => Config.load(root))

describe('typescript', () => {
  withConfig
  .it('has commandsDir', ({config}) => {
    expect(config.plugins[0]).to.deep.include({
      commandsDir: p('src/commands'),
    })
  })

  withConfig
  .stdout()
  .it('runs ts command and prerun & postrun hooks', async ctx => {
    await ctx.config.runCommand('foo:bar:baz')
    expect(ctx.stdout).to.equal('running ts prerun hook\nit works!\nrunning ts postrun hook\n')
  })

  withConfig
  .stdout()
  .it('runs faulty command, only prerun hook triggers', async ctx => {
    try {
      await ctx.config.runCommand('foo:bar:fail')
    } catch {
      console.log('caught error')
    }
    expect(ctx.stdout).to.equal('running ts prerun hook\nit fails!\ncaught error\n')
  })

  withConfig
  .stdout()
  .it('runs ts command, postrun hook captures command result', async ctx => {
    await ctx.config.runCommand('foo:bar:test-result')
    expect(ctx.stdout).to.equal('running ts prerun hook\nit works!\nrunning ts postrun hook\nreturned success!\n')
  })

  withConfig
  .stdout()
  .it('runs init hook', async ctx => {
    // to-do: fix union types
    await (ctx.config.runHook as any)('init', {id: 'myid', argv: ['foo']})
    expect(ctx.stdout).to.equal('running ts init hook\n')
  })
})
