import * as url from 'url'
import * as path from 'path'

import Config from '../../src/config'

import {expect, fancy} from './test'
import {getHelpFlagAdditions} from '../../src/help'
import {helpAddition, versionAddition} from '../../src/main'

const root = path.resolve(__dirname, 'fixtures/help')
// const p = (p: string) => path.join(root, p)

// This tests file URL / import.meta.url simulation.
const rootAsFileURL = url.pathToFileURL(root).toString()

const withConfig = fancy
.add('config', () => Config.load(rootAsFileURL))

describe('help and version flag additions', () => {
  withConfig
  .it('has help and version additions', ({config}) => {
    expect(config.pjson.oclif.additionalHelpFlags).to.have.lengthOf(2)
    expect(config.pjson.oclif.additionalVersionFlags).to.have.lengthOf(3)
    const mergedHelpFlags = getHelpFlagAdditions(config)
    expect(mergedHelpFlags).to.deep.equal(['--help', ...config.pjson.oclif.additionalHelpFlags as string[]])
    expect(helpAddition(['-h'], config)).to.be.true
    expect(helpAddition(['help'], config)).to.be.false
    expect(helpAddition(['--mycommandhelp'], config)).to.be.true
    expect(helpAddition(['foobar'], config)).to.be.false
    expect(versionAddition(['-v'], config)).to.be.true
    expect(versionAddition(['version'], config)).to.be.true
    expect(versionAddition(['myversion'], config)).to.be.true
    expect(versionAddition(['notmyversion'], config)).to.be.false
  })

  withConfig
  .do(({config}) => delete config.pjson.oclif.additionalHelpFlags)
  .it('has version additions', ({config}) => {
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
