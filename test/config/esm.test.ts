import {expect} from 'chai'
import {join, resolve} from 'node:path'
import url from 'node:url'

import {Config} from '../../src/config'
import {runCommand, runHook} from '../test'

const root = resolve(__dirname, 'fixtures/esm')

// This tests file URL / import.meta.url simulation.
const rootAsFileURL = url.pathToFileURL(root).toString()

describe('esm', () => {
  it('has commandsDir', async () => {
    const config = await Config.load(rootAsFileURL)
    expect([...config.plugins.values()][0]).to.deep.include({
      commandsDir: join(root, 'src/commands'),
    })
  })

  it('runs esm command and prerun & postrun hooks', async () => {
    const {stdout} = await runCommand(['foo:bar:baz'], root)
    expect(stdout).to.equal('running esm init hook\nrunning esm prerun hook\nit works!\nrunning esm postrun hook\n')
  })

  it('runs faulty command, only prerun hook triggers', async () => {
    const {stdout} = await runCommand(['foo:bar:fail'], root)
    expect(stdout).to.equal('running esm init hook\nrunning esm prerun hook\nit fails!\n')
  })

  it('runs esm command, postrun hook captures command result', async () => {
    const {stdout} = await runCommand(['foo:bar:test-result'], root)
    expect(stdout).to.equal(
      'running esm init hook\nrunning esm prerun hook\nit works!\nrunning esm postrun hook\nreturned success!\n',
    )
  })

  it('runs init hook', async () => {
    const {stdout} = await runHook('init', {id: 'myid', argv: ['foo']}, {root})
    expect(stdout).to.equal('running esm init hook\n')
  })
})
