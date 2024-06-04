import {runCommand, runHook} from '@oclif/test'
import {expect} from 'chai'
import {join, resolve} from 'node:path'

import {Config} from '../../src/config'

const root = resolve(__dirname, 'fixtures/mixed-esm-cjs')

describe('mixed-esm-cjs', () => {
  it('has commandsDir', async () => {
    const config = await Config.load(root)
    expect([...config.plugins.values()][0]).to.deep.include({
      commandsDir: join(root, 'src/commands'),
    })
  })

  it('runs mixed-esm-cjs command and prerun & postrun hooks', async () => {
    const {stdout} = await runCommand(['foo:bar:baz'], root)
    expect(stdout).to.equal(
      'running mixed-esm-cjs init hook\nrunning mixed-esm-cjs prerun hook\nit works!\nrunning mixed-esm-cjs postrun hook\n',
    )
  })

  it('runs faulty command, only prerun hook triggers', async () => {
    const {stdout} = await runCommand(['foo:bar:fail'], root)
    expect(stdout).to.equal('running mixed-esm-cjs init hook\nrunning mixed-esm-cjs prerun hook\nit fails!\n')
  })

  it('runs mixed-esm-cjs command, postrun hook captures command result', async () => {
    const {stdout} = await runCommand(['foo:bar:test-result'], root)
    expect(stdout).to.equal(
      'running mixed-esm-cjs init hook\nrunning mixed-esm-cjs prerun hook\nit works!\nrunning mixed-esm-cjs postrun hook\nreturned success!\n',
    )
  })

  it('runs init hook', async () => {
    const {stdout} = await runHook('init', {id: 'myid', argv: ['foo']}, {root})
    expect(stdout).to.equal('running mixed-esm-cjs init hook\n')
  })
})
