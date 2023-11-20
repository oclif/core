import {expect} from 'chai'
import {fail} from 'node:assert'
import {SinonSandbox, SinonStub, createSandbox} from 'sinon'

import Cache from '../../src/cache'
import {CLIError} from '../../src/errors'
import {validate} from '../../src/parser/validate'

describe('validate', () => {
  let sandbox: SinonSandbox
  let cacheStub: SinonStub

  const cache = Cache.getInstance()

  beforeEach(() => {
    sandbox = createSandbox()
    cacheStub = sandbox.stub(cache, 'get').withArgs('exitCodes').returns({
      failedFlagValidation: 7,
      invalidArgsSpec: 4,
      nonExistentFlag: 5,
      requiredArgs: 3,
      unexpectedArgs: 6,
    })
  })

  afterEach(() => sandbox.restore())

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
    args: {},
    strict: true,
    context: {},
    '--': true,
  }

  it('will exit 5 when a nonExistentFlags flag is passed', async () => {
    const output = {
      args: {},
      argv: [],
      nonExistentFlags: ['foobar'],
    }

    try {
      // @ts-expect-error
      await validate({input, output})
      fail('should have thrown')
    } catch (error) {
      const err = error as CLIError
      expect(err.oclif.exit).to.equal(5)
      expect(err.message).to.include('Nonexistent flag: foobar')
    }
  })

  it('will exit 6 when an unexpected argument is found', async () => {
    const output = {
      args: {},
      argv: ['found', 'me'],
      nonExistentFlags: [],
    }

    try {
      // @ts-expect-error
      await validate({input, output})
      fail('should have thrown')
    } catch (error) {
      const err = error as CLIError
      expect(err.oclif.exit).to.equal(6)
      expect(err.message).to.include('Unexpected arguments: found, me')
    }
  })

  it('throws when required flag is mixed with args -> exit 4', async () => {
    const input = {
      argv: [],
      flags: {
        foo: {
          description: 'foo flag',
          required: true,
        },
      },
      raw: [
        {
          type: 'flag',
          flag: 'foo',
          input: 'value',
        },
      ],
      args: {foo: {required: false}, bar: {required: true}},
      strict: true,
      context: {},
      '--': true,
    }

    const output = {
      args: {},
      argv: [],
      flags: {foobar: 'value'},
      raw: [],
      metadata: {
        flags: {},
      },
    }

    try {
      // @ts-expect-error
      await validate({input, output})
      fail('should have thrown')
    } catch (error) {
      const err = error as CLIError
      expect(err.message).to.include('Invalid argument spec')
      expect(err.oclif.exit).to.equal(4)
    }
  })

  it('enforces exclusivity for flags', async () => {
    const output = {
      args: {},
      argv: [],
      flags: {
        dinner: 'pizza',
        dessert: 'cheesecake',
      },
      raw: [
        {
          type: 'flag',
          flag: 'dinner',
          input: 'pizza',
        },
      ],
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
      fail('should have thrown')
    } catch (error) {
      const err = error as CLIError
      expect(err.oclif.exit).to.equal(7)
      expect(err.message).to.include('--dessert=cheesecake cannot also be provided when using --dinner')
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
      raw: [
        {
          type: 'flag',
          flag: 'dinner',
          input: 'pizza',
        },
      ],
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
      args: {
        zero: {required: true},
      },
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
      args: {},
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
      fail('should have thrown')
    } catch (error) {
      const err = error as CLIError
      expect(err.message).to.include('Missing required flag')
      expect(err.oclif.exit).to.equal(7)
    }
  })

  it('throws when required flag is missing value', async () => {
    const input = {
      argv: [],
      flags: {
        foobar: {
          description: 'foobar flag',
          required: true,
        },
      },
      raw: [
        {
          type: 'flag',
          flag: 'foobar',
          input: 'value',
        },
      ],
      args: {foobar: {required: true}},
      strict: true,
      context: {},
      '--': true,
    }

    const output = {
      args: {},
      argv: [],
      flags: {foobar: 'value'},
      raw: [],
      metadata: {
        flags: {},
      },
    }

    try {
      // @ts-expect-error
      await validate({input, output})
      fail('should have thrown')
    } catch (error) {
      const err = error as CLIError
      expect(err.message).to.include('Missing 1 required arg')
      expect(err.oclif.exit).to.equal(3)
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
          args: {},
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
                  flags: ['cookies', {name: 'sprinkles', when: async () => false}],
                },
              ],
            },
          },
          args: {},
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
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include(
            'All of the following must be provided when using --dessert: --cookies, --sprinkles',
          )
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
                      when: async (flags: {birthday: boolean}) => flags.birthday,
                    },
                  ],
                },
              ],
            },
          },
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include(
            'All of the following must be provided when using --dessert: --cookies, --sprinkles',
          )
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
                      when: async (flags: {birthday: boolean}) => flags.birthday,
                    },
                  ],
                },
              ],
            },
          },
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include('All of the following must be provided when using --dessert: --cookies')
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
          args: {},
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
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include(
            'One of the following must be provided when using --dessert: --cookies, --sprinkles',
          )
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
                      when: async (flags: {birthday: boolean}) => flags.birthday,
                    },
                  ],
                },
              ],
            },
          },
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include(
            'One of the following must be provided when using --dessert: --cookies, --sprinkles',
          )
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
                      when: async (flags: {birthday: boolean}) => flags.birthday,
                    },
                  ],
                },
              ],
            },
          },
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include('One of the following must be provided when using --dessert: --cookies')
        }
      })
    })

    describe('type: none', () => {
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
                  type: 'none',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
            },
          },
          args: {},
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
                  type: 'none',
                  flags: ['cookies', 'sprinkles'],
                },
              ],
            },
          },
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include('--sprinkles=true cannot also be provided when using --dessert')
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
                  type: 'none',
                  flags: [
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => flags.birthday,
                    },
                  ],
                },
              ],
            },
          },
          args: {},
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
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include('--sprinkles=true cannot also be provided when using --dessert')
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
                  type: 'none',
                  flags: [
                    {
                      name: 'sprinkles',
                      when: async (flags: {birthday: boolean}) => flags.birthday,
                    },
                  ],
                },
              ],
            },
          },
          args: {},
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

    it('should pass if the specified flags whose when property resolves to true, flag has a false value', async () => {
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
                flags: ['sprinkles', {name: 'cookies', when: async () => true}],
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
        flags: {sprinkles: true, dessert: 'ice-cream', cookies: false},
        raw: [
          {type: 'flag', flag: 'sprinkles', input: true},
          {type: 'flag', flag: 'dessert', input: 'ice-cream'},
          {type: 'flag', flag: 'cookies', input: false},
        ],
        metadata: {},
      }

      // @ts-expect-error
      await validate({input, output})
    })

    it('should fail if the specified flags whose when property resolves to true in exclusive, flag has a false value', async () => {
      // no values set for error overrides, will default to 2
      cacheStub.reset()

      const input = {
        argv: [],
        flags: {
          cookies: {input: [], name: 'cookies'},
          sprinkles: {input: [], name: 'sprinkles'},
          dessert: {
            input: [],
            name: 'dessert',
            exclusive: [{name: 'cookies', when: async () => true}],
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
        flags: {sprinkles: true, dessert: 'ice-cream', cookies: false},
        raw: [
          {type: 'flag', flag: 'sprinkles', input: true},
          {type: 'flag', flag: 'dessert', input: 'ice-cream'},
          {type: 'flag', flag: 'cookies', input: false},
        ],
        metadata: {},
      }

      try {
        // @ts-expect-error
        await validate({input, output})
        fail('should have thrown')
      } catch (error) {
        const err = error as CLIError
        expect(err.oclif.exit).to.equal(2)
        expect(err.message).to.include('--cookies=false cannot also be provided when using --dessert')
      }
    })

    describe('mixed', () => {
      const input = {
        argv: [],
        flags: {
          cookies: {input: [], name: 'cookies'},
          sprinkles: {input: [], name: 'sprinkles'},
          cake: {input: [], name: 'cake'},
          brownies: {input: [], name: 'brownies'},
          pie: {input: [], name: 'pie'},
          fudge: {input: [], name: 'fudge'},
          cupcake: {input: [], name: 'cupcake'},
          muffin: {input: [], name: 'muffin'},
          scone: {input: [], name: 'scone'},
          dessert: {
            input: [],
            name: 'dessert',
            relationships: [
              {
                type: 'all',
                flags: [
                  'cookies',
                  {name: 'sprinkles', when: async () => false},
                  {name: 'cake', when: async () => true},
                ],
              },
              {
                type: 'some',
                flags: ['brownies', {name: 'pie', when: async () => false}, {name: 'fudge', when: async () => true}],
              },
              {
                type: 'none',
                flags: ['cupcake', {name: 'muffin', when: async () => false}, {name: 'scone', when: async () => true}],
              },
            ],
          },
        },
        args: {},
        strict: true,
        context: {},
        '--': true,
      }

      it('should succeed', async () => {
        const output = {
          args: {},
          argv: [],
          flags: {
            dessert: 'ice-cream',
            cookies: true,
            brownies: true,
            cake: true,
            muffin: true,
          },
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'cookies', input: true},
            {type: 'flag', flag: 'brownies', input: true},
            {type: 'flag', flag: 'cake', input: true},
            {type: 'flag', flag: 'muffin', input: true},
          ],
          metadata: {},
        }

        // @ts-expect-error
        await validate({input, output})
      })

      it('should fail', async () => {
        const output = {
          args: {},
          argv: [],
          flags: {
            dessert: 'ice-cream',
            sprinkles: true,
            cake: true,
            scone: true,
            pie: true,
          },
          raw: [
            {type: 'flag', flag: 'dessert', input: 'ice-cream'},
            {type: 'flag', flag: 'sprinkles', input: true},
            {type: 'flag', flag: 'cake', input: true},
            {type: 'flag', flag: 'scone', input: true},
            {type: 'flag', flag: 'pie', input: true},
          ],
          metadata: {},
        }

        try {
          // @ts-expect-error
          await validate({input, output})
          fail('should have thrown')
        } catch (error) {
          const err = error as CLIError
          expect(err.oclif.exit).to.equal(7)

          expect(err.message).to.include(
            'All of the following must be provided when using --dessert: --cookies, --cake',
          )
          expect(err.message).to.include('--scone=true cannot also be provided when using --dessert')
          expect(err.message).to.include(
            'One of the following must be provided when using --dessert: --brownies, --fudge',
          )
        }
      })
    })
  })
})
