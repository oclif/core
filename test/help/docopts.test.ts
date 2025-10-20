import {expect} from 'chai'

import {Args, Flags} from '../../src'
import {DocOpts} from '../../src/help/docopts'

describe('doc opts', () => {
  it('shows required string field', async () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.string({
          name: 'testFlag',
          description: 'test',
          required: true,
          char: 'f',
        }),
      },
    } as any)
    expect(usage).to.contain(' -f <value>')
  })

  it('shows optional boolean field', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.boolean({
          name: 'testFlag',
          description: 'test',
          char: 'f',
        }),
      },
    } as any)
    // boolean fields don't have a value
    expect(usage).to.contain(' [-f]')
  })

  it('shows no short char', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.string({
          name: 'testFlag',
          description: 'test',
          options: ['a', 'b'],
        }),
      },
    } as any)
    expect(usage).to.contain(' [--testFlag a|b]')
  })

  it('shows url type', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.url({
          name: 'testFlag',
          description: 'test',
          char: 's',
        }),
      },
    } as any)
    expect(usage).to.contain(' [-s <value>]')
  })

  it('does not show hidden args', () => {
    const usage = DocOpts.generate({
      args: {
        hiddenarg: Args.string({
          name: 'hiddenarg',
          hidden: true,
        }),
      },
    } as any)
    expect(usage.toLowerCase()).to.not.contain('hiddenarg')
  })

  it('does not show hidden type', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.url({
          name: 'testFlag',
          description: 'test',
          char: 's',
          hidden: true,
        }),
      },
    } as any)
    expect(usage).to.not.contain(' [-s <value>]')
  })

  it('shows optional one-way depended fields', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' [-f <value> -s <value>]')
  })

  it('shows one-way depended field on required field', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    // If a flag depends on a required flag, then it is optional.
    // So this should technically be "(-f <value> [-s <value>])" but
    // does that even make sense anymore since -f will always be there?
    // Maybe it should be just "-f <value> [-s <value>]""
    expect(usage).to.contain(' (-f <value> -s <value>)')
  })

  it('shows required one-way depended field on optional field', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    // If the required flag depends on an optional, it isn't really optional.
    expect(usage).to.contain(' (-f <value> -s <value>)')
  })

  it('shows optional one-way exclusive fields', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' [-f <value> | -s <value>]')
  })

  it('shows one-way exclusive field on required field', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' (-f <value> | -s <value>)')
  })

  it('shows required one-way exclusive field on optional field', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' (-f <value> | -s <value>)')
  })

  it('shows optional one-way exclusive field on optional field', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' [-f <value> | -s <value>]')
  })

  it('shows optional exclusive fields defined twice', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' [-s <value> | -f <value>]')
  })

  it('shows optional one-way combinable fields', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.url({
          name: 'testFlag',
          description: 'test',
          char: 's',
        }),
        testFlag2: Flags.string({
          name: 'testFlag2',
          description: 'test',
          char: 'f',
          combinable: ['testFlag3'],
        }),
        testFlag3: Flags.string({
          name: 'testFlag3',
          description: 'test',
          char: 'd',
        }),
      },
    } as any)
    expect(usage).to.contain(' [-f <value> | -s <value>]')
  })

  it('shows one-way combinable field on required field', () => {
    const usage = DocOpts.generate({
      flags: {
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
          combinable: ['testFlag3'],
        }),
        testFlag3: Flags.string({
          name: 'testFlag3',
          description: 'test',
          char: 'd',
        }),
      },
    } as any)
    expect(usage).to.contain(' (-f <value> | -s <value>)')
  })

  it('shows required one-way combinable field on optional field', () => {
    const usage = DocOpts.generate({
      flags: {
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
          combinable: ['testFlag3'],
        }),
        testFlag3: Flags.string({
          name: 'testFlag3',
          description: 'test',
          char: 'd',
        }),
      },
    } as any)
    expect(usage).to.contain(' (-f <value> | -s <value>)')
  })

  it('shows optional combinable field on optional field', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.url({
          name: 'testFlag',
          description: 'test',
          char: 's',
        }),
        testFlag2: Flags.string({
          name: 'testFlag2',
          description: 'test',
          char: 'f',
          combinable: ['testFlag3'],
        }),
        testFlag3: Flags.string({
          name: 'testFlag3',
          description: 'test',
          char: 'd',
        }),
      },
    } as any)
    expect(usage).to.contain(' [-f <value> | -s <value>]')
  })

  it('shows optional combinable fields defined twice', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.url({
          name: 'testFlag',
          description: 'test',
          char: 's',
          combinable: ['testFlag3'],
        }),
        testFlag2: Flags.string({
          name: 'testFlag2',
          description: 'test',
          char: 'f',
          combinable: ['testFlag3'],
        }),
        testFlag3: Flags.string({
          name: 'testFlag3',
          description: 'test',
          char: 'd',
        }),
      },
    } as any)
    expect(usage).to.contain(' [-s <value> | -f <value>]')
  })

  it('shows optional combinable - exclusive fields defined twice', () => {
    const usage = DocOpts.generate({
      flags: {
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
          combinable: ['testFlag3'],
        }),
        testFlag3: Flags.string({
          name: 'testFlag3',
          description: 'test',
          char: 'd',
        }),
      },
    } as any)
    expect(usage).to.contain(' [-s <value> | -f <value>]')
  })

  it('shows optional two-way depended fields', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' [-s <value> -f <value>]')
  })

  it('shows required two-way depended fields', () => {
    const usage = DocOpts.generate({
      flags: {
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
      },
    } as any)
    expect(usage).to.contain(' (-s <value> -f <value>)')
  })

  it('is uses helpValues as expected', () => {
    const usage = DocOpts.generate({
      flags: {
        testFlag: Flags.url({
          name: 'testFlag',
          description: 'test',
          char: 's',
          required: true,
          helpValue: ['<test1>', '<test2>'],
          multiple: true,
        }),
        testFlag2: Flags.string({
          name: 'testFlag2',
          description: 'test',
          char: 'f',
          required: true,
          helpValue: '<test3>',
        }),
        testFlag3: Flags.string({
          name: 'testFlag3',
          description: 'test',
          char: 'g',
          required: true,
          multiple: true,
        }),
        testFlag4: Flags.string({
          name: 'testFlag4',
          description: 'test',
          char: 'p',
          required: true,
          options: ['option1', 'option2'],
        }),
      },
    } as any)
    expect(usage).to.contain('-s <test1>... <test2>... -f <test3> -g <value>... -p option1|option2')
  })
})
