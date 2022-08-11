import assert from 'assert'
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

  it('enforces exclusivity for flags', async () => {
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

    try {
      // @ts-expect-error
      await validate({input, output})
      assert.fail('should have thrown')
    } catch {
      expect(true).to.be.true
    }
  })

  it('ignores exclusivity for defaulted flags', async () => {
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

    // @ts-expect-error
    await validate({input, output})
  })

  it('allows zero for integer', async () => {
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

    // @ts-expect-error
    await validate({input, output})
  })

  it('throws when required flag is undefined', async () => {
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

    try {
      // @ts-expect-error
      await validate({input, output})
      assert.fail('should have thrown')
    } catch {
      expect(true).to.be.true
    }
  })
})
