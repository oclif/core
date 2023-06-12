import {expect} from 'chai'
import {DocOpts} from '../../src/help/docopts'
import {Flags} from '../../src'

describe('doc opts', () => {
  it('shows required string field', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.string({
        name: 'testFlag',
        description: 'test',
        required: true,
        char: 'f',
      }),
    }} as any)
    expect(usage).to.contain(' -f <value>')
  })
  it('shows optional boolean field', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.boolean({
        name: 'testFlag',
        description: 'test',
        char: 'f',
      }),
    }} as any)
    // boolean fields don't have a value
    expect(usage).to.contain(' [-f]')
  })
  it('shows no short char', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.string({
        name: 'testFlag',
        description: 'test',
        options: ['a', 'b'],
      }),
    }} as any)
    expect(usage).to.contain(' [--testFlag a|b]')
  })
  it('shows url type', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
      }),
    }} as any)
    expect(usage).to.contain(' [-s <value>]')
  })
  it('does not show hidden type', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
        hidden: true,
      }),
    }} as any)
    expect(usage).to.not.contain(' [-s <value>]')
  })

  it('shows optional one-way depended fields', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        dependsOn: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' [-f <value> -s <value>]')
  })
  it('shows one-way depended field on required field', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
        required: true,
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        dependsOn: ['testFlag'],
      }),
    }} as any)
    // If a flag depends on a required flag, then it is optional.
    // So this should technically be "(-f <value> [-s <value>])" but
    // does that even make sense anymore since -f will always be there?
    // Maybe it should be just "-f <value> [-s <value>]""
    expect(usage).to.contain(' (-f <value> -s <value>)')
  })
  it('shows required one-way depended field on optional field', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        required: true,
        dependsOn: ['testFlag'],
      }),
    }} as any)
    // If the required flag depends on an optional, it isn't really optional.
    expect(usage).to.contain(' (-f <value> -s <value>)')
  })
  it('shows optional one-way exclusive fields', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        exclusive: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' [-f <value> | -s <value>]')
  })
  it('shows one-way exclusive field on required field', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
        required: true,
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        exclusive: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' (-f <value> | -s <value>)')
  })
  it('shows required one-way exclusive field on optional field', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        required: true,
        exclusive: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' (-f <value> | -s <value>)')
  })

  it('shows option one-way exclusive field on optional field', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        required: true,
        exclusive: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' (-f <value> | -s <value>)')
  })
  it('shows optional exclusive fields defined twice', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
        exclusive: ['testFlag2'],
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        exclusive: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' [-s <value> | -f <value>]')
  })
  it('shows optional two-way depended fields', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
        dependsOn: ['testFlag2'],
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        dependsOn: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' [-s <value> -f <value>]')
  })

  it('shows required two-way depended fields', () => {
    const usage = DocOpts.generate({flags: {
      testFlag: Flags.url({
        name: 'testFlag',
        description: 'test',
        char: 's',
        required: true,
        dependsOn: ['testFlag2'],
      }),
      testFlag2: Flags.string({
        name: 'testFlag2',
        description: 'test',
        char: 'f',
        required: true,
        dependsOn: ['testFlag'],
      }),
    }} as any)
    expect(usage).to.contain(' (-s <value> -f <value>)')
  })
})
