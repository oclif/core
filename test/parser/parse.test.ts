/* eslint-disable max-nested-callbacks */
import {assert, expect, config} from 'chai'
import * as fs from 'fs'

import {parse} from '../../src/parser'
import {Args, Flags} from '../../src'
import {FlagDefault} from '../../src/interfaces/parser'
import {URL} from 'url'
import * as sinon from 'sinon'
import {CLIError} from '../../src/errors'

config.truncateThreshold = 0
const stripAnsi = require('strip-ansi')

describe('parse', () => {
  it('--bool', async () => {
    const out = await parse(['--bool'], {
      flags: {
        bool: Flags.boolean(),
      },
    })
    expect(out).to.deep.include({flags: {bool: true}})
  })

  describe('undefined flags', () => {
    it('omits undefined flags when no flags', async () => {
      const out = await parse([], {
        flags: {
          bool: Flags.boolean(),
        },
      })
      expect(out.flags).to.deep.equal({})
    })

    it('omits undefined flags when some flags exist', async () => {
      const out = await parse(['--bool', '--str', 'k'], {
        flags: {
          bool: Flags.boolean(),
          bool2: Flags.boolean(),
          str: Flags.string(),
          str2: Flags.string(),
        },
      })
      expect(out.flags).to.deep.equal({bool: true, str: 'k'})
    })
  })

  it('arg1', async () => {
    const out = await parse(['arg1'], {
      args: {foo: Args.string()},
    })
    expect(out.argv).to.deep.equal(['arg1'])
    expect(out.args).to.deep.equal({foo: 'arg1'})
  })

  it('arg1 arg2', async () => {
    const out = await parse(['arg1', 'arg2'], {
      args: {foo: Args.string(), bar: Args.string()},
    })
    expect(out.argv).to.deep.equal(['arg1', 'arg2'])
    expect(out.args).to.deep.equal({foo: 'arg1', bar: 'arg2'})
  })

  it('should throw if unexpected argument is provided', async () => {
    try {
      await parse(['arg1'], {})
      expect.fail('should have thrown')
    } catch (error) {
      const err = error as CLIError
      expect(err.message).to.include('Unexpected argument: arg1')
    }
  })

  describe('output: array', () => {
    it('--bool', async () => {
      const out = await parse(['--bool'], {
        flags: {
          bool: Flags.boolean(),
        },
      })
      expect(out.raw[0]).to.deep.include({flag: 'bool'})
    })

    it('arg1', async () => {
      const out = await parse(['arg1'], {
        args: {foo: Args.string()},
      })
      expect(out.raw[0]).to.have.property('input', 'arg1')
    })

    it('parses args and flags', async () => {
      const out = await parse(['foo', '--myflag', 'bar', 'baz'], {
        args: {myarg: Args.string(), myarg2: Args.string()},
        flags: {myflag: Flags.string()},
      })
      expect(out.argv[0]).to.equal('foo')
      expect(out.argv[1]).to.equal('baz')
      expect(out.flags.myflag).to.equal('bar')
    })

    describe('flags', () => {
      it('parses flags', async () => {
        const out = await parse(['--myflag', '--myflag2'], {
          flags: {myflag: Flags.boolean(), myflag2: Flags.boolean()},
        })
        expect(Boolean(out.flags.myflag)).to.equal(true)
        expect(Boolean(out.flags.myflag2)).to.equal(true)
      })
      it('doesn\' throw if defaultHelp func fails', async () => {
        const out = await parse(['--foo', 'baz'], {
          flags: {
            foo: Flags.custom({
              defaultHelp: async () => {
                throw new Error('failed to get default help value')
              },
            })(),
          },
        })
        expect(out.flags.foo).to.equal('baz')
      })

      it('doesn\'t throw when 2nd char in value matches a flag char', async () => {
        const out =   await parse(['--myflag', 'Ishikawa', '-s', 'value'], {
          flags: {myflag: Flags.string(), second: Flags.string({char: 's'})},
        })
        expect(out.flags.myflag).to.equal('Ishikawa')
        expect(out.flags.second).to.equal('value')
      })

      it('doesn\'t throw when an unprefixed flag value contains a flag name', async () => {
        const out =   await parse(['--myflag', 'a-second-place-finish', '-s', 'value'], {
          flags: {myflag: Flags.string(), second: Flags.string({char: 's'})},
        })
        expect(out.flags.myflag).to.equal('a-second-place-finish')
        expect(out.flags.second).to.equal('value')
      })

      it('throws error when no value provided to required flag', async () => {
        try {
          await parse(['--myflag', '--second', 'value'], {
            flags: {myflag: Flags.string({required: true}), second: Flags.string()},
          })
          assert.fail('should have thrown')
        } catch (error) {
          expect((error as CLIError).message).to.include('Flag --myflag expects a value')
        }
      })

      it('throws error when no value provided to required flag before a short char flag', async () => {
        try {
          await parse(['--myflag', '-s', 'value'], {
            flags: {myflag: Flags.string({required: true}), second: Flags.string({char: 's'})},
          })
          assert.fail('should have thrown')
        } catch (error) {
          expect((error as CLIError).message).to.include('Flag --myflag expects a value')
        }
      })

      it('doesn\'t throw when boolean flag passed', async () => {
        const out =   await parse(['--myflag', '--second', 'value'], {
          flags: {myflag: Flags.boolean(), second: Flags.string()},
        })
        expect(out.flags.myflag).to.be.true
        expect(out.flags.second).to.equal('value')
      })

      it('doesn\'t throw when negative number passed', async () => {
        const out =   await parse(['--myflag', '-s', '-9'], {
          flags: {myflag: Flags.boolean(), second: Flags.integer({char: 's'})},
        })
        expect(out.flags.myflag).to.be.true
        expect(out.flags.second).to.equal(-9)
      })

      it('doesn\'t throw when boolean short char is passed', async () => {
        const out =   await parse(['--myflag', '-s', 'value'], {
          flags: {myflag: Flags.boolean(), second: Flags.string({char: 's'})},
        })
        expect(out.flags.myflag).to.be.true
        expect(out.flags.second).to.equal('value')
      })

      it('doesn\'t throw when  short char is passed as a string value', async () => {
        const out =   await parse(['--myflag', '\'-s\'', '-s', 'value'], {
          flags: {myflag: Flags.string(), second: Flags.string({char: 's'})},
        })
        expect(out.flags.myflag).to.equal('\'-s\'')
        expect(out.flags.second).to.equal('value')
      })

      it('parses short flags', async () => {
        const out = await parse(['-mf'], {
          flags: {
            force: Flags.boolean({char: 'f'}),
            myflag: Flags.boolean({char: 'm'}),
          },
        })
        expect(Boolean(out.flags.myflag)).to.equal(true)
        expect(Boolean(out.flags.force)).to.equal(true)
      })
    })
    it('parses flag value with "=" to separate', async () => {
      const out = await parse(['--myflag=foo'], {
        flags: {
          myflag: Flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: 'foo'})
    })

    it('parses flag value with "=" in value', async () => {
      const out = await parse(['--myflag', '=foo'], {
        flags: {
          myflag: Flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: '=foo'})
    })

    it('parses short flag value with "="', async () => {
      const out = await parse(['-m=foo'], {
        flags: {
          myflag: Flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: 'foo'})
    })

    it('parses value of ""', async () => {
      const out = await parse(['-m', ''], {
        flags: {
          myflag: Flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: ''})
    })

    it('requires required flag', async () => {
      let message = ''
      try {
        await parse([], {
          flags: {
            myflag: Flags.string({
              description: 'flag description',
              required: true,
            }),
          },
        })
      } catch (error: any) {
        message = stripAnsi(error.message)
      }

      expect(message).to.include(
        'Missing required flag myflag',
      )
    })

    it('removes flags from argv', async () => {
      const out = await parse(['--myflag', 'bar', 'foo'], {
        args: {myarg: Args.string()},
        flags: {myflag: Flags.string()},
      })
      expect(out.flags).to.deep.equal({myflag: 'bar'})
      expect(out.argv).to.deep.equal(['foo'])
    })

    describe('args', () => {
      it('requires required args with names', async () => {
        let message = ''
        try {
          await parse(['arg1'], {
            args: {
              arg1: Args.string({required: true}),
              arg2: Args.string({required: true, description: 'arg2 desc'}),
              arg3: Args.string({required: true, description: 'arg3 desc'}),
            },
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(`Missing 2 required args:
arg2  arg2 desc
arg3  arg3 desc
See more help with --help`)
      })

      it('too many args', async () => {
        let message = ''
        try {
          await parse(['arg1', 'arg2'], {
            args: {
              arg1: Args.string({required: true}),
            },
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Unexpected argument: arg2')
      })

      it('parses args', async () => {
        const out = await parse(['foo', 'bar'], {
          args: {myarg: Args.string(), myarg2: Args.string()},
        })
        expect(out.argv).to.deep.equal(['foo', 'bar'])
      })
      it('skips optional args', async () => {
        const out = await parse(['foo'], {
          args: {myarg: Args.string(), myarg2: Args.string()},
        })
        expect(out.argv).to.deep.equal(['foo'])
      })

      it('skips non-required args', async () => {
        const out = await parse(['foo'], {
          args: {myarg: Args.string(), myarg2: Args.string()},
        })
        expect(out.argv).to.deep.equal(['foo'])
      })

      it('throws an error when parsing a non-existent flag', async () => {
        try {
          await parse(['arg', '--foo'], {
            args: {
              myArg: Args.string(),
            },
          })
          assert.fail('should have thrown')
        } catch (error) {
          const err = error as Error
          expect(err.message).to.include('Nonexistent flag: --foo')
        }
      })

      it('parses negative number arg', async () => {
        const out = await parse(['-119.1949853', '34.14986578'], {
          args: {longitude: Args.string(), latitude: Args.string()},
        })
        expect(out.argv).to.deep.equal(['-119.1949853', '34.14986578'])
      })

      it('parses - as an arg', async () => {
        const out = await parse(['-'], {
          args: {myarg: Args.string()},
        })
        expect(out.argv).to.deep.equal(['-'])
      })
    })

    describe('args - no args passed in, with defaults', () => {
      it('two args: only first is required, only second has a default', async () => {
        let message = ''
        try {
          await parse([], {
            args: {
              arg1: Args.string({required: true}),
              arg2: Args.string({required: false, default: 'some_default'}),
            },
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(`Missing 1 required arg:
arg1
See more help with --help`)
      })

      it('two args: only first is required, only first has a default', async () => {
        await parse([], {
          args: {
            arg1: Args.string({required: true, default: 'my_default'}),
            arg2: Args.string({required: false}),
          },
        })
        // won't reach here if thrown
        expect(() => {}).to.not.throw()
      })

      it('two args: both have a default, only first is required', async () => {
        await parse([], {
          args: {
            arg1: Args.string({required: true, default: 'my_default'}),
            arg2: Args.string({required: false, default: 'some_default'}),
          },
        })
        // won't reach here if thrown
        expect(() => {}).to.not.throw()
      })
    })

    describe('optional args should always be after required args', () => {
      it('required arg after optional arg', async () => {
        let message = ''
        try {
          await parse([], {
            args: {
              arg1: Args.string({required: false}),
              arg2: Args.string({required: true, default: 'some_default'}),
            },
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(`Invalid argument spec:
arg1 (optional)
arg2 (required)
See more help with --help`)
      })

      it('required arg after multiple optional args', async () => {
        let message = ''
        try {
          await parse([], {
            args: {
              arg1: Args.string({required: false}),
              arg2: Args.string({required: false, default: 'my_default'}),
              arg3: Args.string({required: false}),
              arg4: Args.string({required: true}),
            },
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include(`Invalid argument spec:
arg1 (optional)
arg2 (optional)
arg3 (optional)
arg4 (required)
See more help with --help`)
      })
    })

    describe('multiple flags', () => {
      it('parses multiple flags', async () => {
        const out = await parse(['--bar', 'a', '--bar=b', '--foo=c', '--baz=d'], {
          flags: {
            foo: Flags.string(),
            bar: Flags.string({multiple: true, required: true}),
            baz: Flags.string({required: true}),
          },
        })
        expect(out.flags.foo!.toUpperCase()).to.equal('C')
        expect(out.flags.baz.toUpperCase()).to.equal('D')
        expect(out.flags.bar.join('|')).to.equal('a|b')
      })
      it('parses multiple flags on custom flags', async () => {
        const out = await parse(['--foo', 'a', '--foo=b'], {
          flags: {
            foo: Flags.custom({multiple: true, parse: async i => i})(),
          },
        })
        expect(out.flags).to.deep.include({foo: ['a', 'b']})
      })
      it('allowed options on multiple', async () => {
        const out = await parse(['--foo', 'a', '--foo=b'], {
          flags: {
            foo: Flags.string({multiple: true, parse: async i => i, options: ['a', 'b']}),
          },
        })
        expect(out.flags).to.deep.include({foo: ['a', 'b']})
      })

      it('one of allowed options on multiple', async () => {
        const out = await parse(['--foo', 'a'], {
          flags: {
            foo: Flags.string({multiple: true, options: ['a', 'b']}),
          },
        })
        expect(out.flags).to.deep.include({foo: ['a']})
      })
      it('throws if non-allowed options on multiple', async () => {
        try {
          await parse(['--foo', 'a', '--foo=c'], {
            flags: {
              foo: Flags.string({multiple: true, options: ['a', 'b']}),
            },
          })
        } catch (error:any) {
          expect(error.message).to.include('Expected --foo=c to be one of: a, b')
        }
      })
      describe('comma delimiter', () => {
        it('basic', async () => {
          const out = await parse(['--foo', 'a,b'], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ','}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a', 'b']})
        })
        it('preserves non-exterior double quotes (single and pairs)', async () => {
          const out = await parse(['--foo', 'a,",b,hi"yo"'], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ','}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a', '"', 'b', 'hi"yo"']})
        })
        it('preserves non-exterior single quotes (single and pairs)', async () => {
          const out = await parse(['--foo', "a,',b,hi'yo'"], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ','}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a', "'", 'b', "hi'yo'"]})
        })
        it('with spaces inside double quotes', async () => {
          const out = await parse(['--foo', '"a a","b b"'], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ','}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a a', 'b b']})
        })
        it('with spaces inside single quotes', async () => {
          const out = await parse(['--foo', "'a a','b b'"], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ','}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a a', 'b b']})
        })
        it('with options', async () => {
          const out = await parse(['--foo', 'a,b'], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ',', options: ['a', 'b']}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a', 'b']})
        })
        it('throws if non-allowed options on multiple', async () => {
          try {
            await parse(['--foo', 'a,c'], {
              flags: {
                foo: Flags.string({multiple: true, options: ['a', 'b']}),
              },
            })
          } catch (error:any) {
            expect(error.message).to.include('Expected --foo=a,c to be one of: a, b')
          }
        })

        it('with options and double quotes with spaces', async () => {
          const out = await parse(['--foo', '"a a","b b"'], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ',', options: ['a a', 'b b']}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a a', 'b b']})
        })
        it('with options and single quotes with spaces', async () => {
          const out = await parse(['--foo', "'a a','b b'"], {
            flags: {
              foo: Flags.string({multiple: true, delimiter: ',', options: ['a a', 'b b']}),
            },
          })
          expect(out.flags).to.deep.include({foo: ['a a', 'b b']})
        })
        it('throws if non-allowed with options and double quotes with spaces', async () => {
          try {
            await parse(['--foo', '"a a","b c"'], {
              flags: {
                foo: Flags.string({multiple: true, delimiter: ',', options: ['a a', 'b b']}),
              },
            })
          } catch (error:any) {
            expect(error.message).to.include('Expected --foo=b c to be one of: a a, b b')
          }
        })
        it('throws if non-allowed with options and single quotes with spaces', async () => {
          try {
            await parse(['--foo', "'a a','b c'"], {
              flags: {
                foo: Flags.string({multiple: true, delimiter: ',', options: ['a a', 'b b']}),
              },
            })
          } catch (error:any) {
            expect(error.message).to.include('Expected --foo=b c to be one of: a a, b b')
          }
        })
      })
    })

    describe('strict: false', () => {
      it('skips flag parsing after "--"', async () => {
        const out = await parse(['foo', 'bar', '--', '--myflag'], {
          args: {argOne: Args.string()},
          flags: {myflag: Flags.boolean()},
          strict: false,
        })
        expect(out.argv).to.deep.equal(['foo', 'bar', '--myflag'])
        expect(out.args).to.deep.equal({argOne: 'foo'})
      })

      describe('--: false', () => {
        it('can be disabled', async () => {
          const out = await parse(['foo', 'bar', '--', '--myflag'], {
            args: {argOne: Args.string()},
            strict: false,
            '--': false,
          })
          console.log(out)
          expect(out.argv).to.deep.equal(['foo', 'bar', '--', '--myflag'])
          expect(out.args).to.deep.equal({argOne: 'foo'})
        })
      })

      it('does not repeat arguments', async () => {
        const out = await parse(['foo', '--myflag=foo bar'], {
          strict: false,
          flags: {
            myflag: Flags.string(),
          },
        })

        expect(out.argv).to.deep.equal(['foo'])
        expect(out.flags).to.deep.equal({myflag: 'foo bar'})
      })
    })

    describe('integer flag', () => {
      it('parses integers', async () => {
        const out = await parse(['--int', '100'], {
          flags: {int: Flags.integer(), s: Flags.string()},
        })
        expect(out.flags).to.deep.include({int: 100})
      })

      it('parses zero', async () => {
        const out = await parse(['--int', '0'], {
          flags: {int: Flags.integer(), s: Flags.string()},
        })
        expect(out.flags).to.deep.include({int: 0})
      })

      it('parses negative integers', async () => {
        const out = await parse(['--int', '-123'], {
          flags: {int: Flags.integer(), s: Flags.string()},
        })
        expect(out.flags).to.deep.include({int: -123})
      })

      it('does not parse floats', async () => {
        let message = ''
        try {
          await parse(['--int', '3.14'], {
            flags: {int: Flags.integer()},
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Parsing --int \n\tExpected an integer but received: 3.14')
      })

      it('does not parse fractions', async () => {
        let message = ''
        try {
          await parse(['--int', '3/4'], {
            flags: {int: Flags.integer()},
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Parsing --int \n\tExpected an integer but received: 3/4')
      })

      it('does not parse strings', async () => {
        let message = ''
        try {
          await parse(['--int', 's10'], {
            flags: {int: Flags.integer()},
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.include('Parsing --int \n\tExpected an integer but received: s10')
      })

      describe('min/max', () => {
        it('min pass equal', async () => {
          const out = await parse(['--int', '10'], {
            flags: {int: Flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 10})
        })
        it('min pass gt', async () => {
          const out = await parse(['--int', '11'], {
            flags: {int: Flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 11})
        })
        it('max pass lt', async () => {
          const out = await parse(['--int', '19'], {
            flags: {int: Flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 19})
        })
        it('max pass equal', async () => {
          const out = await parse(['--int', '20'], {
            flags: {int: Flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 20})
        })

        it('min fail lt', async () => {
          let message = ''
          try {
            await parse(['--int', '9'], {
              flags: {int: Flags.integer({min: 10, max: 20})},
            })
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.include('Parsing --int \n\tExpected an integer greater than or equal to 10 but received: 9')
        })
        it('max fail gt', async () => {
          let message = ''
          try {
            await parse(['--int', '21'], {
              flags: {int: Flags.integer({min: 10, max: 20})},
            })
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.include('Parsing --int \n\tExpected an integer less than or equal to 20 but received: 21')
        })
      })
    })

    describe('custom parse functions', () => {
      const testIntPass = 6
      const testIntFail = 7
      const customParseException = 'NOT_OK'
      const validateEvenNumberString =  async (input:string) => Number.parseInt(input, 10) % 2 === 0 ? Number.parseInt(input, 10) : assert.fail(customParseException)
      it('accepts custom parse that passes', async () => {
        const out = await parse([`--int=${testIntPass}`], {
          flags: {int: Flags.integer({parse: validateEvenNumberString})},
        })
        expect(out.flags).to.deep.include({int: testIntPass})
      })

      it('accepts custom parse that fails', async () => {
        try {
          const out = await parse([`--int=${testIntFail}`], {
            flags: {int: Flags.integer({parse: validateEvenNumberString})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.include(
            `Parsing --int \n\t${customParseException}`)
        }
      })
    })
  })

  describe('parse', () => {
    it('parse', async () => {
      const out = await parse(['--foo=bar', '100'], {
        args: {num: Args.integer()},
        flags: {foo: Flags.string({parse: async input => input.toUpperCase()})},
      })
      expect(out.flags).to.deep.include({foo: 'BAR'})
      expect(out.args).to.deep.include({num: 100})
      expect(out.argv).to.deep.equal([100])
    })

    it('parse with a default does not parse default', async () => {
      const out = await parse([], {
        flags: {foo: Flags.string({parse: async input => input.toUpperCase(), default: 'baz'})},
      })
      expect(out.flags).to.deep.include({foo: 'baz'})
    })

    describe('parse with a default/value of another type (class)', async () => {
      class TestClass {
        public prop: string;
        constructor(input: string) {
          this.prop = input
        }

        public toString(): string {
          return this.prop
        }
      }
      it('uses default via value', async () => {
        const out = await parse([], {
          flags: {
            foo: Flags.custom<TestClass>({
              parse: async input => new TestClass(input),
              default: new TestClass('baz'),
            })(),
          },
        })
        expect(out.flags.foo?.prop).to.equal('baz')
      })
      it('uses default via function', async () => {
        const out = await parse([], {
          flags: {
            foo: Flags.custom<TestClass>({
              parse: async input => new TestClass(input),
              default: async () => new TestClass('baz'),
            })(),
          },
        })
        expect(out.flags.foo?.prop).to.equal('baz')
      })
      it('should error with exclusive flag violation', async () => {
        try {
          const out = await parse(['--foo', 'baz', '--bar'], {
            flags: {
              foo: Flags.custom<TestClass>({
                parse: async input => new TestClass(input),
                defaultHelp: new TestClass('bar'),
              })(),
              bar: Flags.boolean({
                exclusive: ['foo'],
              }),
            },
          })
          expect.fail(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error) {
          assert(error instanceof Error)
          expect(error.message).to.include('--foo=bar cannot also be provided when using --bar')
        }
      })
      it('should error with exclusive flag violation and defaultHelp value', async () => {
        try {
          const out = await parse(['--foo', 'baz', '--bar'], {
            flags: {
              foo: Flags.custom<TestClass>({
                parse: async input => new TestClass(input),
              })(),
              bar: Flags.boolean({
                exclusive: ['foo'],
              }),
            },
          })
          expect.fail(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error) {
          assert(error instanceof Error)
          expect(error.message).to.include('--foo=baz cannot also be provided when using --bar')
        }
      })
      it('uses parser when value provided', async () => {
        const out = await parse(['--foo=bar'], {
          flags: {
            foo: Flags.custom<TestClass>({
              parse: async input => new TestClass(input),
              default: new TestClass('baz'),
            })(),
          },
        })
        expect(out.flags.foo?.prop).to.equal('bar')
      })
    })

    // it('gets arg/flag in context', async () => {
    //   const out = await parse({
    //     args: [{ name: 'num', parse: (_, ctx) => ctx.arg.name!.toUpperCase() }],
    //     argv: ['--foo=bar', '100'],
    //     flags: { foo: string({ parse: (_, ctx) => ctx.flag.name.toUpperCase() }) },
    //   })
    //   expect(out.flags).to.deep.include({ foo: 'FOO' })
    //   expect(out.args).to.deep.include({ num: 'NUM' })
    // })
  })

  describe('flag with multiple inputs', () => {
    it('flag multiple with flag in the middle', async () => {
      const out = await parse(['--foo=bar', '--foo', '100', '--hello', 'world'], {
        flags: {foo: Flags.string({multiple: true}), hello: Flags.string()},
      })
      expect(out.flags).to.deep.include({foo: ['bar', '100']})
      expect(out.flags).to.deep.include({hello: 'world'})
    })

    it('flag multiple without flag in the middle', async () => {
      const out = await parse(
        ['--foo', './a.txt', './b.txt', './c.txt', '--hello', 'world'],
        {
          flags: {
            foo: Flags.string({multiple: true}),
            hello: Flags.string(),
          },
        },
      )
      expect(out.flags).to.deep.include({
        foo: ['./a.txt', './b.txt', './c.txt'],
      })
      expect(out.flags).to.deep.include({hello: 'world'})
    })

    it('flag multiple with arguments', async () => {
      const out = await parse(
        ['--foo', './a.txt', './b.txt', './c.txt', '--', '15'],
        {
          args: {num: Args.string()},
          flags: {foo: Flags.string({multiple: true})},
        },
      )
      expect(out.flags).to.deep.include({
        foo: ['./a.txt', './b.txt', './c.txt'],
      })
      expect(out.args).to.deep.include({num: '15'})
    })
    it('flag multiple with arguments and custom delimiter and parser', async () => {
      const out = await parse(
        ['--foo', './a.txt,./b.txt', '--foo', './c.txt', '--', '15'],
        {
          args: {num: Args.string()},
          flags: {
            foo: Flags.string({
              multiple: true,
              delimiter: ',',
              parse: async input => input.replace('.txt', '.json'),
            }),
          },
        },
      )
      expect(out.flags).to.deep.include({
        foo: ['./a.json', './b.json', './c.json'],
      })
      expect(out.args).to.deep.include({num: '15'})
    })
  })

  describe('defaults', () => {
    it('generates metadata for defaults', async () => {
      const out = await parse(['-n', 'heroku'], {
        flags: {
          name: Flags.string({
            char: 'n',
          }),
          startup: Flags.string({
            char: 's',
            default: 'apero',
          }),
        },
      })
      expect(out.metadata.flags).to.deep.equal({
        startup: {setFromDefault: true},
      })
    })

    it('defaults', async () => {
      const out = await parse([], {
        args: {baz: Args.string({default: 'BAZ'})},
        flags: {foo: Flags.string({default: 'bar'})},
      })
      expect(out.args).to.deep.include({baz: 'BAZ'})
      expect(out.argv).to.deep.equal(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('accepts falsy', async () => {
      const out = await parse([], {
        args: {baz: Args.boolean({default: false})},
      })
      expect(out.args).to.deep.include({baz: false})
    })

    it('accepts falsy flags', async () => {
      const out = await parse([], {
        flags: {
          foo: Flags.string({default: ''}),
          baz: Flags.boolean({default: false}),
        },
      })
      expect(out.flags).to.deep.include({foo: ''})
      expect(out.flags).to.deep.include({baz: false})
    })

    it('default as function', async () => {
      const out = await parse([], {
        args: {baz: Args.string({default: async () => 'BAZ'})},
        flags: {foo: Flags.string({default: async () => 'bar'})},
      })
      expect(out.args).to.deep.include({baz: 'BAZ'})
      expect(out.argv).to.deep.equal(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('default has options', async () => {
      const def: FlagDefault<string | undefined> = async ({options}) =>
        options.description
      const out = await parse([], {
        flags: {foo: Flags.string({description: 'bar', default: def})},
      })
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('can default to a different flag', async () => {
      const def: FlagDefault<string | undefined> = async opts => opts.flags.foo
      const out = await parse(['--foo=bar'], {
        flags: {
          bar: Flags.string({
            default: def,
          }),
          foo: Flags.string(),
        },
      })
      expect(out.flags).to.deep.include({foo: 'bar', bar: 'bar'})
    })
  })

  describe('boolean defaults', () => {
    it('default is true', async () => {
      const out = await parse([], {
        flags: {
          color: Flags.boolean({default: true}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })

    it('default is false', async () => {
      const out = await parse([], {
        flags: {
          color: Flags.boolean({default: false}),
        },
      })
      expect(out).to.deep.include({flags: {color: false}})
    })

    it('default as function', async () => {
      const out = await parse([], {
        flags: {
          color: Flags.boolean({default: async () => true}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })

    it('overridden true default', async () => {
      const out = await parse(['--no-color'], {
        flags: {
          color: Flags.boolean({allowNo: true, default: true}),
        },
      })
      expect(out).to.deep.include({flags: {color: false}})
    })

    it('overridden false default', async () => {
      const out = await parse(['--color'], {
        flags: {
          color: Flags.boolean({default: false}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })
  })

  describe('custom option', () => {
    it('can pass parse fn', async () => {
      const foo = Flags.custom({char: 'f', parse: async () => 100})()
      const out = await parse(['-f', 'bar'], {
        flags: {foo},
      })
      expect(out.flags).to.deep.include({foo: 100})
    })
  })

  describe('build', () => {
    it('can pass parse fn', async () => {
      const foo = Flags.custom({char: 'f', parse: async () => 100})
      const out = await parse(['-f', 'bar'], {
        flags: {foo: foo()},
      })
      expect(out.flags).to.deep.include({foo: 100})
    })
    it('does not require parse fn', async () => {
      const foo = Flags.custom({char: 'f'})
      const out = await parse(['-f', 'bar'], {
        flags: {foo: foo()},
      })
      expect(out.flags).to.deep.include({foo: 'bar'})
    })
  })

  describe('flag options', () => {
    it('accepts valid option', async () => {
      const out = await parse(['--foo', 'myotheropt'], {
        flags: {foo: Flags.string({options: ['myopt', 'myotheropt']})},
      })
      expect(out.flags.foo).to.equal('myotheropt')
    })

    it('fails when invalid', async () => {
      let message = ''
      try {
        await parse(['--foo', 'invalidopt'], {
          flags: {foo: Flags.string({options: ['myopt', 'myotheropt']})},
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('Expected --foo=invalidopt to be one of: myopt, myotheropt')
    })
    it('fails when invalid env var', async () => {
      let message = ''
      process.env.TEST_FOO = 'invalidopt'
      try {
        await parse([], {
          flags: {foo: Flags.string({options: ['myopt', 'myotheropt'], env: 'TEST_FOO'})},
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('Expected --foo=invalidopt to be one of: myopt, myotheropt')
    })

    it('accepts valid option env var', async () => {
      process.env.TEST_FOO = 'myopt'

      const out = await parse([], {
        flags: {foo: Flags.string({options: ['myopt', 'myotheropt'], env: 'TEST_FOO'})},
      })
      expect(out.flags.foo).to.equal('myopt')
    })
  })

  describe('url flag', () => {
    it('accepts valid url', async () => {
      const out = await parse(['--foo', 'https://example.com'], {
        flags: {foo: Flags.url()},
      })
      expect(out.flags.foo).to.be.instanceOf(URL)
      expect(out.flags.foo?.href).to.equal('https://example.com/')
    })

    it('fails when invalid', async () => {
      let message = ''
      try {
        await parse(['--foo', 'example'], {
          flags: {foo: Flags.url()},
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('Parsing --foo \n\tExpected a valid url but received: example')
    })
  })

  describe('arg options', () => {
    it('accepts valid option', async () => {
      const out = await parse(['myotheropt'], {
        args: {foo: Args.string({options: ['myopt', 'myotheropt']})},
      })
      expect(out.args.foo).to.equal('myotheropt')
    })

    it('fails when invalid', async () => {
      let message = ''
      try {
        await parse(['invalidopt'], {
          args: {foo: Args.string({options: ['myopt', 'myotheropt']})},
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('Expected invalidopt to be one of: myopt, myotheropt')
    })
  })

  describe('env', () => {
    describe('string', () => {
      it('accepts as environment variable', async () => {
        process.env.TEST_FOO = '101'
        const out = await parse([], {
          flags: {foo: Flags.string({env: 'TEST_FOO'})},
        })
        expect(out.flags.foo).to.equal('101')
        delete process.env.TEST_FOO
      })
    })

    describe('boolean', () => {
      const truthy = ['true', 'TRUE', '1', 'yes', 'YES', 'y', 'Y']
      for (const value of truthy) {
        it(`accepts '${value}' as a truthy environment variable`, async () => {
          process.env.TEST_FOO = value
          const out = await parse([], {
            flags: {
              foo: Flags.boolean({env: 'TEST_FOO'}),
            },
          })
          expect(out.flags.foo).to.be.true
          delete process.env.TEST_FOO
        })
      }

      const falsy = ['false', 'FALSE', '0', 'no', 'NO', 'n', 'N']
      for (const value of falsy) {
        it(`accepts '${value}' as a falsy environment variable`, async () => {
          process.env.TEST_FOO = value
          const out = await parse([], {
            flags: {
              foo: Flags.boolean({env: 'TEST_FOO'}),
            },
          })
          expect(out.flags.foo).to.be.false
          delete process.env.TEST_FOO
        })
      }

      it('ignores unset environment variables', async () => {
        delete process.env.TEST_FOO
        const out = await parse([], {
          flags: {
            foo: Flags.boolean({env: 'TEST_FOO'}),
          },
        })
        expect(out.flags.foo).to.be.undefined
      })

      it('uses default when environment variable is unset', async () => {
        delete process.env.TEST_FOO
        const out = await parse([], {
          flags: {
            foo: Flags.boolean({env: 'TEST_FOO', default: true}),
          },
        })
        expect(out.flags.foo).to.be.true
      })
    })
  })

  describe('flag context', () => {
    it('accepts context in parse', async () => {
      const out = await parse(['--foo'], {
        // @ts-expect-error
        context: {a: 101},
        flags: {
          foo: Flags.boolean({
            parse: async (_: any, ctx: any) => ctx.a,
          }),
        },
      })
      expect(out.flags.foo).to.equal(101)
    })
  })

  it('parses multiple flags', async () => {
    const out = await parse(['--foo=a', '--foo', 'b'], {
      flags: {foo: Flags.string()},
    })
    expect(out.flags.foo).to.equal('b')
  })

  describe('dependsOn', () => {
    it('ignores', async () => {
      await parse([], {
        flags: {
          foo: Flags.string({dependsOn: ['bar']}),
          bar: Flags.string({char: 'b'}),
        },
      })
    })

    it('succeeds', async () => {
      const out = await parse(['--foo', 'a', '-bb'], {
        flags: {
          foo: Flags.string({dependsOn: ['bar']}),
          bar: Flags.string({char: 'b'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
      expect(out.flags.bar).to.equal('b')
    })

    it('fails', async () => {
      let message = ''
      try {
        await parse(['--foo', 'a'], {
          flags: {
            foo: Flags.string({dependsOn: ['bar']}),
            bar: Flags.string({char: 'b'}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('All of the following must be provided when using --foo: --bar')
    })
  })

  describe('exclusive', () => {
    it('ignores', async () => {
      await parse([], {
        flags: {
          foo: Flags.string({exclusive: ['bar']}),
          bar: Flags.string({char: 'b'}),
        },
      })
    })

    it('succeeds', async () => {
      const out = await parse(['--foo', 'a'], {
        flags: {
          foo: Flags.string({exclusive: ['bar']}),
          bar: Flags.string({char: 'b'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
    })

    it('fails', async () => {
      let message = ''
      try {
        await parse(['--foo', 'a', '-bb'], {
          flags: {
            foo: Flags.string({exclusive: ['bar']}),
            bar: Flags.string({char: 'b'}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('--bar=b cannot also be provided when using --foo')
    })
  })

  describe('exactlyOne', () => {
    it('throws if neither is set', async () => {
      let message = ''
      try {
        await parse([], {
          flags: {
            foo: Flags.string({exactlyOne: ['bar', 'foo']}),
            bar: Flags.string({char: 'b', exactlyOne: ['bar', 'foo']}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('Exactly one of the following must be provided: --bar, --foo')
    })

    it('throws if multiple are set', async () => {
      let message = ''
      try {
        await parse(['--foo', 'a', '--bar', 'b'], {
          flags: {
            foo: Flags.string({exactlyOne: ['bar']}),
            bar: Flags.string({char: 'b', exactlyOne: ['foo']}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('The following errors occurred:')
      expect(message).to.include('--bar cannot also be provided when using --foo')
      expect(message).to.include('--foo cannot also be provided when using --bar')
    })

    it('succeeds if exactly one', async () => {
      const out = await parse(['--foo', 'a', '--else', '4'], {
        flags: {
          foo: Flags.string({exactlyOne: ['bar']}),
          bar: Flags.string({char: 'b', exactlyOne: ['foo']}),
          else: Flags.string({char: 'e'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
    })

    it('succeeds if exactly one (the other option)', async () => {
      const out = await parse(['--bar', 'b', '--else', '4'], {
        flags: {
          foo: Flags.string({exactlyOne: ['bar']}),
          bar: Flags.string({char: 'b', exactlyOne: ['foo']}),
          else: Flags.string({char: 'e'}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('succeeds if exactly one of three', async () => {
      const out = await parse(['--bar', 'b'], {
        flags: {
          foo: Flags.string({exactlyOne: ['bar', 'else']}),
          bar: Flags.string({char: 'b', exactlyOne: ['foo', 'else']}),
          else: Flags.string({char: 'e', exactlyOne: ['foo', 'bar']}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('lets user list flag in its own list', async () => {
      const out = await parse(['--bar', 'b'], {
        flags: {
          foo: Flags.string({exactlyOne: ['foo', 'bar', 'else']}),
          bar: Flags.string({char: 'b', exactlyOne: ['foo', 'bar', 'else']}),
          else: Flags.string({char: 'e', exactlyOne: ['foo', 'bar', 'else']}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('fails if multiple of three', async () => {
      let message = ''
      try {
        await parse(['--foo', 'a', '--else', '4'], {
          flags: {
            foo: Flags.string({exactlyOne: ['bar', 'else']}),
            bar: Flags.string({char: 'b', exactlyOne: ['foo', 'else']}),
            else: Flags.string({char: 'e', exactlyOne: ['foo', 'bar']}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.include('The following errors occurred:')
      expect(message).to.include('--else cannot also be provided when using --foo')
      expect(message).to.include('--foo cannot also be provided when using --else')
    })

    it('handles cross-references/pairings that don\'t make sense', async () => {
      const crazyFlags = {
        foo: Flags.string({exactlyOne: ['bar']}),
        bar: Flags.string({char: 'b', exactlyOne: ['else']}),
        else: Flags.string({char: 'e'}),
      }
      let message1 = ''
      try {
        await parse(['--foo', 'a', '--bar', '4'], {
          flags: crazyFlags,
        })
      } catch (error: any) {
        message1 = error.message
      }

      expect(message1).to.include('--bar cannot also be provided when using --foo')

      let message2 = ''
      try {
        await parse(['--bar', 'a', '--else', '4'], {
          flags: crazyFlags,
        })
      } catch (error: any) {
        message2 = error.message
      }

      expect(message2).to.include('--else cannot also be provided when using --bar')

      const out = await parse(['--foo', 'a', '--else', '4'], {
        flags: crazyFlags,
      })
      expect(out.flags.foo).to.equal('a')
      expect(out.flags.else).to.equal('4')
      expect(out.flags.bar).to.equal(undefined)
    })
  })

  describe('allowNo', () => {
    it('is undefined if not set', async () => {
      const out = await parse([], {
        flags: {
          foo: Flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(undefined)
    })
    it('is false', async () => {
      const out = await parse(['--no-foo'], {
        flags: {
          foo: Flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(false)
    })
    it('is true', async () => {
      const out = await parse(['--foo'], {
        flags: {
          foo: Flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(true)
    })
  })

  describe('fs flags', () => {
    const sandbox = sinon.createSandbox()
    let existsStub: sinon.SinonStub
    let statStub: sinon.SinonStub

    beforeEach(() => {
      existsStub = sandbox.stub(fs, 'existsSync')
      statStub = sandbox.stub(fs.promises, 'stat')
    })

    afterEach(() => {
      sandbox.restore()
    })

    describe('directory', () => {
      const testDir = 'some/dir'
      it('passes if dir !exists but exists:false', async () => {
        const out = await parse([`--dir=${testDir}`], {
          flags: {dir: Flags.directory({exists: false})},
        })
        expect(existsStub.callCount).to.equal(0)
        expect(out.flags).to.deep.include({dir: testDir})
      })
      it('passes if dir !exists but exists not defined', async () => {
        const out = await parse([`--dir=${testDir}`], {
          flags: {dir: Flags.directory()},
        })
        expect(existsStub.callCount).to.equal(0)
        expect(out.flags).to.deep.include({dir: testDir})
      })
      it('passes when dir exists', async () => {
        existsStub.returns(true)
        statStub.returns({isDirectory: () => true})
        const out = await parse([`--dir=${testDir}`], {
          flags: {dir: Flags.directory({exists: true})},
        })
        expect(out.flags).to.deep.include({dir: testDir})
      })
      it("fails when dir doesn't exist", async () => {
        existsStub.returns(false)
        try {
          const out = await parse([`--dir=${testDir}`], {
            flags: {dir: Flags.directory({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.include(
            `Parsing --dir \n\tNo directory found at ${testDir}`,
          )
        }
      })
      it('fails when dir exists but is not a dir', async () => {
        existsStub.returns(true)
        statStub.returns({isDirectory: () => false})
        try {
          const out = await parse([`--dir=${testDir}`], {
            flags: {dir: Flags.directory({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.include(
            `Parsing --dir \n\t${testDir} exists but is not a directory`)
        }
      })
      describe('custom parse functions', () => {
        const customParseException = 'NOT_OK'
        it('accepts custom parse that passes', async () => {
          existsStub.returns(true)
          statStub.returns({isDirectory: () => true})
          const out = await parse([`--dir=${testDir}`], {
            flags: {dir: Flags.directory({exists: true, parse: async input => input.includes('some') ? input : assert.fail(customParseException)})},
          })
          expect(out.flags).to.deep.include({dir: testDir})
        })

        it('accepts custom parse that fails', async () => {
          existsStub.returns(true)
          statStub.returns({isDirectory: () => true})
          try {
            const out = await parse([`--dir=${testDir}`], {
              flags: {dir: Flags.directory({exists: true, parse: async input => input.includes('NOT_THERE') ? input : assert.fail(customParseException)})},
            })
            throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
          } catch (error_) {
            const error = error_ as Error
            expect(error.message).to.include(
              `Parsing --dir \n\t${customParseException}`)
          }
        })
      })
    })

    describe('file', () => {
      const testFile = 'some/file.ext'
      it('passes if file doesn\'t exist but not exists:true', async () => {
        const out = await parse([`--file=${testFile}`], {
          flags: {file: Flags.file({exists: false})},
        })
        expect(out.flags).to.deep.include({file: testFile})
        expect(existsStub.callCount).to.equal(0)
      })
      it('passes if file doesn\'t exist but not exists not defined', async () => {
        const out = await parse([`--file=${testFile}`], {
          flags: {file: Flags.file()},
        })
        expect(out.flags).to.deep.include({file: testFile})
        expect(existsStub.callCount).to.equal(0)
      })
      it('passes when file exists', async () => {
        existsStub.returns(true)
        statStub.returns({isFile: () => true})
        const out = await parse([`--file=${testFile}`], {
          flags: {file: Flags.file({exists: true})},
        })
        expect(out.flags).to.deep.include({file: testFile})
      })
      it("fails when dir doesn't exist", async () => {
        existsStub.returns(false)
        try {
          const out = await parse([`--file=${testFile}`], {
            flags: {file: Flags.file({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.include(`Parsing --file \n\tNo file found at ${testFile}`)
        }
      })
      it('fails when file exists but is not a file', async () => {
        existsStub.returns(true)
        statStub.returns({isFile: () => false})
        try {
          const out = await parse([`--file=${testFile}`], {
            flags: {file: Flags.file({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.include(`Parsing --file \n\t${testFile} exists but is not a file`)
        }
      })
      describe('custom parse functions', () => {
        const customParseException = 'NOT_OK'
        it('accepts custom parse that passes', async () => {
          existsStub.returns(true)
          statStub.returns({isFile: () => true})
          const out = await parse([`--dir=${testFile}`], {
            flags: {dir: Flags.file({exists: false, parse: async input => input.includes('some') ? input : assert.fail(customParseException)})},
          })
          expect(out.flags).to.deep.include({dir: testFile})
        })

        it('accepts custom parse that fails', async () => {
          existsStub.returns(true)
          statStub.returns({isFile: () => true})
          try {
            const out = await parse([`--dir=${testFile}`], {
              flags: {dir: Flags.file({exists: true, parse: async input => input.includes('NOT_THERE') ? input : assert.fail(customParseException)})},
            })
            throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
          } catch (error_) {
            const error = error_ as Error
            expect(error.message).to.include(
              `Parsing --dir \n\t${customParseException}`)
          }
        })
      })
    })
  })

  describe('flag aliases', () => {
    it('works with defined name', async () => {
      const out = await parse(['--foo'], {
        flags: {
          foo: Flags.boolean({
            aliases: ['bar'],
          }),
        },
      })
      expect(out.flags.foo).to.equal(true)
    })

    it('works with aliased name', async () => {
      const out = await parse(['--bar'], {
        flags: {
          foo: Flags.boolean({
            aliases: ['bar'],
          }),
        },
      })
      expect(out.flags.foo).to.equal(true)
    })
  })
})
