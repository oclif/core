import {test as base, expect} from '@oclif/test'
import {TestHelp, topicHelp} from './help-test-utils'

const g: any = global
g.oclif.columns = 80

const test = base
.loadConfig()
.add('help', ctx => {
  return new TestHelp(ctx.config as any)
})
.register('topicHelp', topicHelp)

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
