import {expect, test as base, Config} from '@oclif/test'
import stripAnsi = require('strip-ansi')

const g: any = global
g.columns = 80
import Help from '../src'

const VERSION = require('../package.json').version
const UA = `@oclif/plugin-help/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

// extensions to expose method as public for testing
class TestHelp extends Help {
  public formatRoot() {
    return super.formatRoot()
  }
}

const test = base
.loadConfig()
.register('rootHelp', (ctxOverride?: (config: Config.IConfig) => Config.IConfig) => ({
  run(ctx: {config: Config.IConfig; help: Help; commandHelp: string; expectation: string}) {
    const config = ctxOverride ? ctxOverride(ctx.config) : ctx.config

    const help = new TestHelp(config)
    const root = help.formatRoot()
    if (process.env.TEST_OUTPUT === '1') {
      console.log(help)
    }
    ctx.commandHelp = stripAnsi(root).split('\n').map(s => s.trimRight()).join('\n')
  },
}))

describe('formatRoot', () => {
  test
  .rootHelp()
  .it('renders the root help', ctx => expect(ctx.commandHelp).to.equal(`standard help for oclif

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]`))

  describe('description', () => {
    test
    .rootHelp(config => {
      return {
        ...config,
        pjson: {
          ...config.pjson,
          description: 'This is the top-level description that appears in the root\nThis appears in the description section after usage',
        },
      }
    })
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
    .rootHelp(config => {
      return {
        ...config,
        pjson: {
          ...config.pjson,
          description: 'This is the top-level description for <%= config.bin %>\nThis <%= config.bin %> appears in the description section after usage',
        },
      }
    })
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
    .rootHelp(config => {
      return {
        ...config,
        pjson: {
          ...config.pjson,
          description: 'THIS IS THE PJSON DESCRIPTION',
          oclif: {
            ...config.pjson?.oclif,
            description: 'THIS IS THE OCLIF DESCRIPTION IN PJSON',
          },
        },
      }
    })
    .it('prefers the oclif description over the package.json description', ctx => {
      expect(ctx.commandHelp).to.equal(`THIS IS THE OCLIF DESCRIPTION IN PJSON

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]`)
    })

    test
    .rootHelp(config => {
      return {
        ...config,
        pjson: {
          ...config.pjson,
          description: 'THIS IS THE PJSON DESCRIPTION',
          oclif: {
            ...config.pjson?.oclif,
            description: undefined,
          },
        },
      }
    })
    .it('uses package.json description when the oclif description is not set', ctx => {
      expect(ctx.commandHelp).to.equal(`THIS IS THE PJSON DESCRIPTION

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]`)
    })
  })
})
