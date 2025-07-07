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

  it('runs ts command and prerun, postrun & finally hooks', async () => {
    const {stdout} = await runCommand(['foo:bar:baz'], root)
    expect(stdout.split('\n')).to.deep.equal([
      'running ts init hook',
      'running ts prerun hook',
      'it works!',
      'running ts postrun hook',
      'running ts finally hook',
      '',
    ])
  })

  it('runs faulty command, only prerun & finally hooks trigger', async () => {
    const {stdout} = await runCommand(['foo:bar:fail'], root)
    expect(stdout.split('\n')).to.deep.equal([
      'running ts init hook',
      'running ts prerun hook',
      'it fails!',
      'running ts finally hook',
      'an error occurred',
      '',
    ])
  })

  it('runs ts command, postrun & finally hooks capture command result', async () => {
    const {stdout} = await runCommand(['foo:bar:test-result'], root)
    expect(stdout.split('\n')).to.deep.equal([
      'running ts init hook',
      'running ts prerun hook',
      'it works!',
      'running ts postrun hook',
      'returned success!',
      'running ts finally hook',
      '',
    ])
  })

  it('runs init hook', async () => {
    const {stdout} = await runHook('init', {id: 'myid', argv: ['foo']}, {root})
    expect(stdout.split('\n')).to.deep.equal(['running ts init hook', ''])
  })
})
