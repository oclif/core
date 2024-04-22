import ansis from 'ansis'
import {expect} from 'chai'

import {Config, Interfaces} from '../../src'
import {TestHelp} from './help-test-utils'

describe('formatTopics', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load()
  })

  function getTopicsHelp(topic: Interfaces.Topic[]): string {
    const help = new TestHelp(config)
    const root = help.formatTopics(topic) ?? ''
    return ansis
      .strip(root)
      .split('\n')
      .map((s) => s.trimEnd())
      .join('\n')
  }

  it('shows a single topic in the list', () => {
    const topic = [
      {
        name: 'topic',
        description: 'this is a description of my topic',
      },
    ]
    const output = getTopicsHelp(topic)
    expect(output).to.equal(`TOPICS
  topic  this is a description of my topic`)
  })

  it('shows multiple topics in list', () => {
    const topic = [
      {
        name: 'topic',
        description: 'this is a description of my topic',
      },
      {
        name: 'othertopic',
        description: 'here we have a description for othertopic',
      },
      {
        name: 'thirdtopic',
        description: 'description for thirdtopic',
      },
    ]
    const output = getTopicsHelp(topic)
    expect(output).to.equal(`TOPICS
  topic       this is a description of my topic
  othertopic  here we have a description for othertopic
  thirdtopic  description for thirdtopic`)
  })
})
