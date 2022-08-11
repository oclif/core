import * as assert from 'assert'
import {expect} from 'chai'
import {CLIError} from '../../src/errors'

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
    } catch (error) {
      const err = error as CLIError
      expect(err.message).to.equal('--dessert=cheesecake cannot also be provided when using --dinner')
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
    } catch (error) {
      const err = error as CLIError
      expect(err.message).to.include('Missing required flag')
    }
  })

  describe('relationships', () => {
    describe('type: all', () => {
      it('should pass if all required flags are provided', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'all',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
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
          flags: {dessert: 'ice-cream', sprinkles: true, cookies: true},
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'sprinkles', input: true},
            {type: 'flag', flag: 'cookies', input: true},
          ],
          metadata: {},
        }

        // @ts-expect-error
        await validate({input, output})
      })

      it('should exclude any flags whose when property resolves to false', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'all',
                  flags: [
                    'cookies',
                    {name: 'sprinkles', when: async () => Promise.resolve(false)},
                  ],
                },
              ],
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
          flags: {dessert: 'ice-cream', cookies: true},
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'cookies', input: true},
          ],
          metadata: {},
        }

        // @ts-expect-error
        await validate({input, output})
      })

      it('should require all specified flags', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'all',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
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
          flags: {dessert: 'ice-cream'},
          raw: [{type: 'flag', flag: 'dessert', input: 'ice-cream'}],
          metadata: {},
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('All of the following must be provided when using --dessert: --cookies, --sprinkles')
        }
      })

      it('should require all specified flags with when property that resolves to true', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            birthday: {input: [], name: 'birthday'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'all',
                  flags: [
                    'cookies',
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => Promise.resolve(flags.birthday),
                    },
                  ],
                },
              ],
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
          flags: {dessert: 'ice-cream', birthday: true},
          raw: [{type: 'flag', flag: 'dessert', input: 'ice-cream'}],
          metadata: {},
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('All of the following must be provided when using --dessert: --cookies, --sprinkles')
        }
      })

      it('should require all specified flags with when property that resolves to false', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            birthday: {input: [], name: 'birthday'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'all',
                  flags: [
                    'cookies',
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => Promise.resolve(flags.birthday),
                    },
                  ],
                },
              ],
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
          flags: {dessert: 'ice-cream', birthday: false},
          raw: [{type: 'flag', flag: 'dessert', input: 'ice-cream'}],
          metadata: {},
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('All of the following must be provided when using --dessert: --cookies')
        }
      })
    })

    describe('type: some', () => {
      it('should pass if some of the specified flags are provided', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'some',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
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
          flags: {dessert: 'ice-cream', sprinkles: true},
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'sprinkles', input: true},
          ],
          metadata: {},
        }

        // @ts-expect-error
        await validate({input, output})
      })

      it('should require some of the specified flags', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'some',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
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
          flags: {dessert: 'ice-cream'},
          raw: [{type: 'flag', flag: 'dessert', input: 'ice-cream'}],
          metadata: {},
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('One of the following must be provided when using --dessert: --cookies, --sprinkles')
        }
      })

      it('should require some of the specified flags with when property that resolves to true', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            birthday: {input: [], name: 'birthday'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'some',
                  flags: [
                    'cookies',
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => Promise.resolve(flags.birthday),
                    },
                  ],
                },
              ],
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
          flags: {dessert: 'ice-cream', birthday: true},
          raw: [{type: 'flag', flag: 'dessert', input: 'ice-cream'}],
          metadata: {},
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('One of the following must be provided when using --dessert: --cookies, --sprinkles')
        }
      })

      it('should require some of the specified flags with when property that resolves to false', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            birthday: {input: [], name: 'birthday'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'some',
                  flags: [
                    'cookies',
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => Promise.resolve(flags.birthday),
                    },
                  ],
                },
              ],
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
          flags: {dessert: 'ice-cream', birthday: false},
          raw: [{type: 'flag', flag: 'dessert', input: 'ice-cream'}],
          metadata: {},
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('One of the following must be provided when using --dessert: --cookies')
        }
      })
    })

    describe('type: never', () => {
      it('should pass if none of the specified flags are provided', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'never',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
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
          flags: {dessert: 'ice-cream'},
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
          ],
          metadata: {},
        }

        // @ts-expect-error
        await validate({input, output})
      })

      it('should fail if the specified flags are provided', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'never',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
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
          flags: {dessert: 'ice-cream', sprinkles: true},
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'sprinkles', input: true},
          ],
          metadata: {
            flags: {
              dessert: {setFromDefault: false},
              sprinkles: {setFromDefault: false},
            },
          },
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('--sprinkles=true cannot also be provided when using --dessert')
        }
      })

      it('should fail if the specified flags are provided with when property that resolves to true', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            birthday: {input: [], name: 'birthday'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'never',
                  flags: [
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => Promise.resolve(flags.birthday),
                    },
                  ],
                },
              ],
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
          flags: {dessert: 'ice-cream', birthday: true, sprinkles: true},
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'sprinkles', input: true},
            {type: 'flag', flag: 'birthday', input: true},
          ],
          metadata: {
            flags: {
              dessert: {setFromDefault: false},
              sprinkles: {setFromDefault: false},
              birthday: {setFromDefault: false},
            },
          },
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.message).to.equal('--sprinkles=true cannot also be provided when using --dessert')
        }
      })

      it('should pass if the specified flags are provided with when property that resolves to false', async () => {
        const input = {
          argv: [],
          flags: {
            cookies: {input: [], name: 'cookies'},
            sprinkles: {input: [], name: 'sprinkles'},
            birthday: {input: [], name: 'birthday'},
            dessert: {
              input: [],
              name: 'dessert',
              relationships: [
                {
                  type: 'never',
                  flags: [
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => Promise.resolve(flags.birthday),
                    },
                  ],
                },
              ],
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
          flags: {dessert: 'ice-cream', birthday: false, sprinkles: true},
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'sprinkles', input: true},
            {type: 'flag', flag: 'birthday', input: false},
          ],
          metadata: {
            flags: {
              dessert: {setFromDefault: false},
              sprinkles: {setFromDefault: false},
              birthday: {setFromDefault: false},
            },
          },
        }

        // @ts-expect-error
        await validate({input, output})
      })
    })
  })
})
