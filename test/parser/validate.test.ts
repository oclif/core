import {expect} from 'chai'

import {validate} from '../../src/parser/validate'

describe('validate', () => {
  const input = {
    argv: [],
    flags: {
      dinner: {
        description: 'what you want to eat for dinner',
        input: [],
        name: 'dinner',
        exclusive: ['dessert'],
      },
      dessert: {
        description: 'what you want to eat for dessert',
        default: 'cheesecake',
        input: [],
        name: 'dessert',
        exclusive: [],
      },
    },
    args: [],
    strict: true,
    context: {},
    '--': true,
  }

  it('enforces exclusivity for flags', () => {
    const output = {
      args: {},
      argv: [],
      flags: {
        dinner: 'pizza',
        dessert: 'cheesecake',
      },
      raw: [{
        type: 'flag',
        flag: 'dinner',
        input: 'pizza',
      }],
      metadata: {
        flags: {
          dessert: {
            setFromDefault: false,
          },
        },
      },
    }

    // @ts-ignore
    expect(validate.bind({input, output})).to.throw()
  })

  it('ignores exclusivity for defaulted flags', () => {
    const output = {
      args: {},
      argv: [],
      flags: {
        dinner: 'pizza',
        dessert: 'cheesecake',
      },
      raw: [{
        type: 'flag',
        flag: 'dinner',
        input: 'pizza',
      }],
      metadata: {
        flags: {
          dessert: {
            setFromDefault: true,
          },
        },
      },
    }

    // @ts-ignore
    validate({input, output})
  })

  it('allows zero for integer', () => {
    const input = {
      argv: [],
      flags: {
        int: {
          description: 'zero as integer',
          required: true,
        },
      },
      args: [
        {
          name: 'zero',
          required: true,
        },
      ],
      strict: true,
      context: {},
      '--': true,
    }

    const output = {
      args: {zero: 0},
      argv: [0],
      flags: {int: 0},
      raw: [],
      metadata: {
        flags: {},
      },
    }

    // @ts-ignore
    validate({input, output})
  })

  it('throws when required flag is undefined', () => {
    const input = {
      argv: [],
      flags: {
        foobar: {
          description: 'foobar flag',
          required: true,
        },
      },
      args: [],
      strict: true,
      context: {},
      '--': true,
    }

    const output = {
      args: {},
      argv: [],
      flags: {foobar: undefined},
      raw: [],
      metadata: {
        flags: {},
      },
    }

    // @ts-ignore
    expect(validate.bind({input, output})).to.throw()
  })
})
