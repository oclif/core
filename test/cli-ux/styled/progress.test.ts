import {expect, fancy} from 'fancy-test'
import {CliUx} from '../../../src'

describe('progress', () => {
  // single bar
  fancy
  .end('single bar has default settings', _ => {
    const b1 = CliUx.ux.progress({format: 'Example 1: Progress {bar} | {percentage}%'})
    expect(b1.options.format).to.contain('Example 1: Progress')
    expect(b1.bars).to.not.have
  })

  // testing no settings passed, default settings created
  fancy
  .end('single bar, no bars array', _ => {
    const b1 = CliUx.ux.progress({})
    expect(b1.options.format).to.contain('progress')
    expect(b1.bars).to.not.have
    expect(b1.options.noTTYOutput).to.not.be.null
  })
  // testing getProgressBar returns correct type
  fancy
  .end('typeof progress bar is object', _ => {
    const b1 = CliUx.ux.progress({format: 'Example 1: Progress {bar} | {percentage}%'})
    expect(typeof (b1)).to.equal('object')
  })
})
