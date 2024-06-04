import {runCommand, runHook} from '@oclif/test'
import {expect} from 'chai'
import {join, resolve} from 'node:path'

import {Config} from '../../src/config'

const root = resolve(__dirname, 'fixtures/typescript')

describe('typescript', () => {
  it('has commandsDir', async () => {
    const config = await Config.load(root)
    expect([...config.plugins.values()][0]).to.deep.include({
      commandsDir: join(root, 'src/commands'),
    })
  })

  it('runs ts command and prerun & postrun hooks', async () => {
    const {stdout} = await runCommand(['foo:bar:baz'], root)
    expect(stdout).to.equal('running ts init hook\nrunning ts prerun hook\nit works!\nrunning ts postrun hook\n')
  })

  it('runs faulty command, only prerun hook triggers', async () => {
    const {stdout} = await runCommand(['foo:bar:fail'], root)
    expect(stdout).to.equal('running ts init hook\nrunning ts prerun hook\nit fails!\n')
  })

  it('runs ts command, postrun hook captures command result', async () => {
    const {stdout} = await runCommand(['foo:bar:test-result'], root)
    expect(stdout).to.equal(
      'running ts init hook\nrunning ts prerun hook\nit works!\nrunning ts postrun hook\nreturned success!\n',
    )
  })

  it('runs init hook', async () => {
    const {stdout} = await runHook('init', {id: 'myid', argv: ['foo']}, {root})
    expect(stdout).to.equal('running ts init hook\n')
  })
})
