import ansis from 'ansis'
import {expect} from 'chai'

import {Config, Interfaces} from '../../src'
import {TestHelp} from './help-test-utils'

describe('formatHelp', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load()
  })

  function getTopicHelp(topic: Interfaces.Topic): string {
    const help = new TestHelp(config)
    const root = help.formatTopic(topic)
    return ansis
      .strip(root)
      .split('\n')
      .map((s) => s.trimEnd())
      .join('\n')
  }

  it('shows topic output', () => {
    const topic = {
      name: 'topic',
      description: 'this is a description of my topic',
      hidden: false,
    }
    const output = getTopicHelp(topic)
    expect(output).to.equal(`this is a description of my topic

USAGE
  $ oclif topic:COMMAND
`)
  })

  it('shows topic without a description', () => {
    const topic = {
      name: 'topic',
      hidden: false,
    }
    const output = getTopicHelp(topic)
    expect(output).to.equal(`USAGE
  $ oclif topic:COMMAND
`)
  })

  it(`shows topic descriptions split from \n for top-level and description section descriptions`, () => {
    const topic = {
      name: 'topic',
      hidden: false,
      description: 'This is the top level description\nDescription that shows up in the DESCRIPTION section',
    }
    const output = getTopicHelp(topic)
    expect(output).to.equal(`This is the top level description

USAGE
  $ oclif topic:COMMAND

DESCRIPTION
  Description that shows up in the DESCRIPTION section
`)
  })

  it(`shows templated topic descriptions split from \n for top-level and description section descriptions`, () => {
    const topic = {
      name: 'topic',
      hidden: false,
      description:
        '<%= config.bin %>: This is the top level description\n<%= config.bin %>: Description that shows up in the DESCRIPTION section',
    }
    const output = getTopicHelp(topic)
    expect(output).to.equal(`oclif: This is the top level description

USAGE
  $ oclif topic:COMMAND

DESCRIPTION
  oclif: Description that shows up in the DESCRIPTION section
`)
  })
})
