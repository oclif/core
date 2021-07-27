import * as url from 'url'
import * as path from 'path'

import {Config} from '../../src/config'

import {expect, fancy} from './test'
import {getHelpFlagOverride} from '../../src/help'
import {helpOverride, versionOverride} from '../../src/main'

const root = path.resolve(__dirname, 'fixtures/help')
// const p = (p: string) => path.join(root, p)

// This tests file URL / import.meta.url simulation.
const rootAsFileURL = url.pathToFileURL(root).toString()

const withConfig = fancy
.add('config', () => Config.load(rootAsFileURL))

describe('esm', () => {
  withConfig
  .it('has help and version overrides', ({config}) => {
    expect(config.pjson.oclif.additionalHelpFlags).to.have.lengthOf(2)
    expect(config.pjson.oclif.additionalVersionFlags).to.have.lengthOf(3)
    const mergedHelpFlags = getHelpFlagOverride(config)
    expect(mergedHelpFlags).to.deep.equal(['--help', ...config.pjson.oclif.additionalHelpFlags as string[]])
    expect(helpOverride(['-h'], config)).to.be.true
    expect(helpOverride(['help'], config)).to.be.false
    expect(helpOverride(['--mycommandhelp'], config)).to.be.true
    expect(helpOverride(['foobar'], config)).to.be.false
    expect(versionOverride(['-v'], config)).to.be.true
    expect(versionOverride(['version'], config)).to.be.true
    expect(versionOverride(['myversion'], config)).to.be.true
    expect(versionOverride(['notmyversion'], config)).to.be.false
  })

  withConfig
  .do(({config}) => delete config.pjson.oclif.additionalHelpFlags)
  .it('has version overrides', ({config}) => {
    expect(config.pjson.oclif.additionalHelpFlags).to.not.be.ok
    expect(config.pjson.oclif.additionalVersionFlags).to.have.lengthOf(3)
    const mergedHelpFlags = getHelpFlagOverride(config)
    expect(mergedHelpFlags).to.deep.equal(['--help'])
    expect(helpOverride(['-h'], config)).to.be.false
    expect(helpOverride(['help'], config)).to.be.false
    expect(helpOverride(['mycommandhelp'], config)).to.be.false
    expect(versionOverride(['-v'], config)).to.be.true
    expect(versionOverride(['version'], config)).to.be.true
    expect(versionOverride(['myversion'], config)).to.be.true
    expect(versionOverride(['notmyversion'], config)).to.be.false
  })
})
