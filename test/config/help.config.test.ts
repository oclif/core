import {expect} from 'chai'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {Config} from '../../src/config'
import {getHelpFlagAdditions} from '../../src/help'
import {helpAddition, versionAddition} from '../../src/main'

const root = resolve(__dirname, 'fixtures/help')

// This tests file URL / import.meta.url simulation.
const rootAsFileURL = pathToFileURL(root).toString()

describe('help and version flag additions', () => {
  let config: Config

  beforeEach(async () => {
    config = await Config.load(rootAsFileURL)
  })

  it('has help and version additions', () => {
    expect(config.pjson.oclif.additionalHelpFlags).to.have.lengthOf(2)
    expect(config.pjson.oclif.additionalVersionFlags).to.have.lengthOf(3)
    const mergedHelpFlags = getHelpFlagAdditions(config)
    expect(mergedHelpFlags).to.deep.equal(['--help', ...(config.pjson.oclif.additionalHelpFlags as string[])])
    expect(helpAddition(['-h'], config)).to.be.true
    expect(helpAddition(['help'], config)).to.be.false
    expect(helpAddition(['--mycommandhelp'], config)).to.be.true
    expect(helpAddition(['foobar'], config)).to.be.false
    expect(versionAddition(['-v'], config)).to.be.true
    expect(versionAddition(['version'], config)).to.be.true
    expect(versionAddition(['myversion'], config)).to.be.true
    expect(versionAddition(['notmyversion'], config)).to.be.false
  })

  it('has version additions', () => {
    delete config.pjson.oclif.additionalHelpFlags
    expect(config.pjson.oclif.additionalHelpFlags).to.not.be.ok
    expect(config.pjson.oclif.additionalVersionFlags).to.have.lengthOf(3)
    const mergedHelpFlags = getHelpFlagAdditions(config)
    expect(mergedHelpFlags).to.deep.equal(['--help'])
    expect(helpAddition(['-h'], config)).to.be.false
    expect(helpAddition(['help'], config)).to.be.false
    expect(helpAddition(['mycommandhelp'], config)).to.be.false
    expect(versionAddition(['-v'], config)).to.be.true
    expect(versionAddition(['version'], config)).to.be.true
    expect(versionAddition(['myversion'], config)).to.be.true
    expect(versionAddition(['notmyversion'], config)).to.be.false
  })
})
