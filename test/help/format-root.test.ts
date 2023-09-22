import {test as base, expect} from '@oclif/test'
import stripAnsi = require('strip-ansi')

import {Help} from '../../src/help'
import {Interfaces} from '../../src'

const g: any = global
g.oclif.columns = 80

const VERSION = require('../../package.json').version
const UA = `@oclif/core/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

// extensions to expose method as public for testing
class TestHelp extends Help {
  public formatRoot() {
    return super.formatRoot()
  }
}

const rootHelp = (ctxOverride?: (config: Interfaces.Config) => Interfaces.Config) => ({
  run(ctx: { config: Interfaces.Config; help: Help; commandHelp: string; expectation: string}) {
    const config = ctxOverride ? ctxOverride(ctx.config) : ctx.config

    const help = new TestHelp(config as any)
    const root = help.formatRoot()
    if (process.env.TEST_OUTPUT === '1') {
      console.log(help)
    }

    ctx.commandHelp = stripAnsi(root).split('\n').map(s => s.trimEnd()).join('\n')
  },
})

const test = base
.loadConfig()
.register('rootHelp', rootHelp)

describe('formatRoot', () => {
  test
  .rootHelp()
  .it('renders the root help', ctx => expect(ctx.commandHelp).to.equal(`base library for oclif CLIs

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]`))

  describe('description', () => {
    test
    .rootHelp(config => ({
      ...config,
      pjson: {
        ...config.pjson,
        description: 'This is the top-level description that appears in the root\nThis appears in the description section after usage',
      },
    }))
    .it('splits on \\n for the description into the top-level and description sections', ctx => {
      expect(ctx.commandHelp).to.equal(`This is the top-level description that appears in the root

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]

DESCRIPTION
  This appears in the description section after usage`)
    })

    test
    .rootHelp(config => ({
      ...config,
      pjson: {
        ...config.pjson,
        description: 'This is the top-level description for <%= config.bin %>\nThis <%= config.bin %> appears in the description section after usage',
      },
    }))
    .it('shows description from a template', ctx => {
      expect(ctx.commandHelp).to.equal(`This is the top-level description for oclif

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]

DESCRIPTION
  This oclif appears in the description section after usage`)
    })

    test
    .rootHelp(config => ({
      ...config,
      pjson: {
        ...config.pjson,
        description: 'THIS IS THE PJSON DESCRIPTION',
        oclif: {
          ...config.pjson?.oclif,
          description: 'THIS IS THE OCLIF DESCRIPTION IN PJSON',
        },
      },
    }))
    .it('prefers the oclif description over the package.json description', ctx => {
      expect(ctx.commandHelp).to.equal(`THIS IS THE OCLIF DESCRIPTION IN PJSON

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]`)
    })

    test
    .rootHelp(config => ({
      ...config,
      pjson: {
        ...config.pjson,
        description: 'THIS IS THE PJSON DESCRIPTION',
        oclif: {
          ...config.pjson?.oclif,
          description: undefined,
        },
      },
    }))
    .it('uses package.json description when the oclif description is not set', ctx => {
      expect(ctx.commandHelp).to.equal(`THIS IS THE PJSON DESCRIPTION

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]`)
    })
  })
})
