import * as path from 'path'

import {Config} from '../../src/config'

import {expect, fancy} from './test'

const root = path.resolve(__dirname, 'fixtures/mixed-esm-cjs')
const p = (p: string) => path.join(root, p)

const withConfig = fancy
.add('config', () => Config.load(root))

describe('mixed-cjs-esm', () => {
  withConfig
  .it('has commandsDir', ({config}) => {
    expect(config.plugins[0]).to.deep.include({
      commandsDir: p('src/commands'),
    })
  })

  withConfig
  .stdout()
  .it('runs mixed-esm-cjs command and prerun & postrun hooks', async ctx => {
    await ctx.config.runCommand('foo:bar:baz')
    expect(ctx.stdout).to.equal('running mixed-esm-cjs prerun hook\nit works!\nrunning mixed-esm-cjs postrun hook\n')
  })

  withConfig
  .stdout()
  .it('runs faulty command, only prerun hook triggers', async ctx => {
    try {
      await ctx.config.runCommand('foo:bar:fail')
    } catch {
      console.log('caught error')
    }

    expect(ctx.stdout).to.equal('running mixed-esm-cjs prerun hook\nit fails!\ncaught error\n')
  })

  withConfig
  .stdout()
  .it('runs mixed-esm-cjs command, postrun hook captures command result', async ctx => {
    await ctx.config.runCommand('foo:bar:test-result')
    expect(ctx.stdout).to.equal('running mixed-esm-cjs prerun hook\nit works!\nrunning mixed-esm-cjs postrun hook\nreturned success!\n')
  })

  withConfig
  .stdout()
  .it('runs init hook', async ctx => {
    await (ctx.config.runHook as any)('init', {id: 'myid', argv: ['foo']})
    expect(ctx.stdout).to.equal('running mixed-esm-cjs init hook\n')
  })
})
