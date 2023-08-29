import {expect, fancy} from 'fancy-test'
import ux from '../../../src/ux'

describe('progress', () => {
  // single bar
  fancy
  .end('single bar has default settings', _ => {
    const b1 = ux.progress({format: 'Example 1: Progress {bar} | {percentage}%'})
    // @ts-expect-error because private member
    expect(b1.options.format).to.contain('Example 1: Progress')
    // @ts-expect-error because private member
    expect(b1.bars).to.not.have
  })

  // testing no settings passed, default settings created
  fancy
  .end('single bar, no bars array', _ => {
    const b1 = ux.progress({})
    // @ts-expect-error because private member
    expect(b1.options.format).to.contain('progress')
    // @ts-expect-error because private member
    expect(b1.bars).to.not.have
    // @ts-expect-error because private member
    expect(b1.options.noTTYOutput).to.not.be.null
  })
  // testing getProgressBar returns correct type
  fancy
  .end('typeof progress bar is object', _ => {
    const b1 = ux.progress({format: 'Example 1: Progress {bar} | {percentage}%'})
    expect(typeof (b1)).to.equal('object')
  })
})
