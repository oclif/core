import * as Config from '@oclif/config'
import {expect, test as base} from '@oclif/test'
import stripAnsi = require('strip-ansi')

const g: any = global
g.columns = 80
import Help from '../src'

// extensions to expose method as public for testing
class TestHelp extends Help {
  public formatTopic(topic: Config.Topic) {
    return super.formatTopic(topic)
  }
}

const test = base
.loadConfig()
.add('help', ctx => {
  return new TestHelp(ctx.config)
})
.register('topicHelp', (topic: Config.Topic) => ({
  run(ctx: {help: TestHelp; commandHelp: string; expectation: string}) {
    const topicHelpOutput = ctx.help.formatTopic(topic)
    if (process.env.TEST_OUTPUT === '1') {
      console.log(topicHelpOutput)
    }
    ctx.commandHelp = stripAnsi(topicHelpOutput).split('\n').map(s => s.trimRight()).join('\n')
    ctx.expectation = 'has topicHelp'
  },
}))

describe('formatHelp', () => {
  test
  .topicHelp({
    name: 'topic',
    description: 'this is a description of my topic',
    hidden: false,
  })
  .it('shows topic output', ctx => expect(ctx.commandHelp).to.equal(`this is a description of my topic

USAGE
  $ oclif topic:COMMAND
`))

  test
  .topicHelp({
    name: 'topic',
    hidden: false,
  })
  .it('shows topic without a description', ctx => expect(ctx.commandHelp).to.equal(`USAGE
  $ oclif topic:COMMAND
`))

  test
  .topicHelp({
    name: 'topic',
    hidden: false,
    description: 'This is the top level description\nDescription that shows up in the DESCRIPTION section',
  })
  .it('shows topic descriptions split from \\n for top-level and description section descriptions', ctx => expect(ctx.commandHelp).to.equal(`This is the top level description

USAGE
  $ oclif topic:COMMAND

DESCRIPTION
  Description that shows up in the DESCRIPTION section
`))
  test
  .topicHelp({
    name: 'topic',
    hidden: false,
    description: '<%= config.bin %>: This is the top level description\n<%= config.bin %>: Description that shows up in the DESCRIPTION section',
  })
  .it('shows topic descriptions split from \\n for top-level and description section descriptions', ctx => expect(ctx.commandHelp).to.equal(`oclif: This is the top level description

USAGE
  $ oclif topic:COMMAND

DESCRIPTION
  oclif: Description that shows up in the DESCRIPTION section
`))
})
