import ansis from 'ansis'
import {expect} from 'chai'
import sinon from 'sinon'

import {Config} from '../../src'
import {Help} from '../../src/help'

const VERSION = require('../../package.json').version
const USER_AGENT = `@oclif/core/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

describe('formatRoot', () => {
  let config: Config
  let sandbox: sinon.SinonSandbox

  beforeEach(async () => {
    config = await Config.load()
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  function getRootHelp(): string {
    // @ts-expect-error private member
    const root = new Help(config).formatRoot()
    return ansis
      .strip(root)
      .split('\n')
      .map((s) => s.trimEnd())
      .join('\n')
  }

  it('renders the root help', async () => {
    expect(getRootHelp()).to.equal(`base library for oclif CLIs

VERSION
  ${USER_AGENT}

USAGE
  $ oclif [COMMAND]`)
  })

  describe('description', () => {
    it('splits on \\n for the description into the top-level and description sections', () => {
      sandbox
        .stub(config.pjson, 'description')
        .value(
          'This is the top-level description that appears in the root\nThis appears in the description section after usage',
        )

      const output = getRootHelp()

      expect(output).to.equal(`This is the top-level description that appears in the root

VERSION
  ${USER_AGENT}

USAGE
  $ oclif [COMMAND]

DESCRIPTION
  This appears in the description section after usage`)
    })

    it('shows description from a template', () => {
      sandbox
        .stub(config.pjson, 'description')
        .value(
          'This is the top-level description for <%= config.bin %>\nThis <%= config.bin %> appears in the description section after usage',
        )
      const output = getRootHelp()

      expect(output).to.equal(`This is the top-level description for oclif

VERSION
  ${USER_AGENT}

USAGE
  $ oclif [COMMAND]

DESCRIPTION
  This oclif appears in the description section after usage`)
    })

    it('prefers the oclif description over the package.json description', () => {
      sandbox.stub(config.pjson, 'description').value('THIS IS THE PJSON DESCRIPTION')
      sandbox.stub(config.pjson, 'oclif').value({
        ...config.pjson.oclif,
        description: 'THIS IS THE OCLIF DESCRIPTION IN PJSON',
      })
      const output = getRootHelp()

      expect(output).to.equal(`THIS IS THE OCLIF DESCRIPTION IN PJSON

VERSION
  ${USER_AGENT}

USAGE
  $ oclif [COMMAND]`)
    })

    it('uses package.json description when the oclif description is not set', () => {
      sandbox.stub(config.pjson, 'description').value('THIS IS THE PJSON DESCRIPTION')
      sandbox.stub(config.pjson, 'oclif').value({
        ...config.pjson.oclif,
        description: undefined,
      })
      const output = getRootHelp()

      expect(output).to.equal(`THIS IS THE PJSON DESCRIPTION

VERSION
  ${USER_AGENT}

USAGE
  $ oclif [COMMAND]`)
    })
  })
})
