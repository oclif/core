/* eslint-disable max-nested-callbacks */
import {expect} from 'chai'
import * as fs from 'fs'

import {flags, parse} from '../../src/parser'
import {Interfaces} from '../../src'
import {URL} from 'url'
import {directory, file} from '../../src/parser/flags'
import * as sinon from 'sinon'

const stripAnsi = require('strip-ansi')

describe('parse', () => {
  it('--bool', async () => {
    const out = await parse(['--bool'], {
      flags: {
        bool: flags.boolean(),
      },
    })
    expect(out).to.deep.include({flags: {bool: true}})
  })

  it('arg1', async () => {
    const out = await parse(['arg1'], {
      args: [{name: 'foo'}],
    })
    expect(out.argv).to.deep.equal(['arg1'])
    expect(out.args).to.deep.equal({foo: 'arg1'})
  })

  it('arg1 arg2', async () => {
    const out = await parse(['arg1', 'arg2'], {
      args: [{name: 'foo'}, {name: 'bar'}],
    })
    expect(out.argv).to.deep.equal(['arg1', 'arg2'])
    expect(out.args).to.deep.equal({foo: 'arg1', bar: 'arg2'})
  })

  describe('output: array', () => {
    it('--bool', async () => {
      const out = await parse(['--bool'], {
        flags: {
          bool: flags.boolean(),
        },
      })
      expect(out.raw[0]).to.deep.include({flag: 'bool'})
    })

    it('arg1', async () => {
      const out = await parse(['arg1'], {
        args: [{name: 'foo'}],
      })
      expect(out.raw[0]).to.have.property('input', 'arg1')
    })

    it('parses args and flags', async () => {
      const out = await parse(['foo', '--myflag', 'bar', 'baz'], {
        args: [{name: 'myarg'}, {name: 'myarg2'}],
        flags: {myflag: flags.string()},
      })
      expect(out.argv[0]).to.equal('foo')
      expect(out.argv[1]).to.equal('baz')
      expect(out.flags.myflag).to.equal('bar')
    })

    describe('flags', () => {
      it('parses flags', async () => {
        const out = await parse(['--myflag', '--myflag2'], {
          flags: {myflag: flags.boolean(), myflag2: flags.boolean()},
        })
        expect(Boolean(out.flags.myflag)).to.equal(true)
        expect(Boolean(out.flags.myflag2)).to.equal(true)
      })

      it('parses short flags', async () => {
        const out = await parse(['-mf'], {
          flags: {
            force: flags.boolean({char: 'f'}),
            myflag: flags.boolean({char: 'm'}),
          },
        })
        expect(Boolean(out.flags.myflag)).to.equal(true)
        expect(Boolean(out.flags.force)).to.equal(true)
      })
    })
    it('parses flag value with "=" to separate', async () => {
      const out = await parse(['--myflag=foo'], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: 'foo'})
    })

    it('parses flag value with "=" in value', async () => {
      const out = await parse(['--myflag', '=foo'], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: '=foo'})
    })

    it('parses short flag value with "="', async () => {
      const out = await parse(['-m=foo'], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: 'foo'})
    })

    it('parses value of ""', async () => {
      const out = await parse(['-m', ''], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: ''})
    })

    it('requires required flag', async () => {
      let message = ''
      try {
        await parse([], {
          flags: {
            myflag: flags.string({
              description: 'flag description',
              required: true,
            }),
          },
        })
      } catch (error: any) {
        message = stripAnsi(error.message)
      }

      expect(message).to.equal(
        'Missing required flag:\n --myflag MYFLAG  flag description\nSee more help with --help',
      )
    })

    it('removes flags from argv', async () => {
      const out = await parse(['--myflag', 'bar', 'foo'], {
        args: [{name: 'myarg'}],
        flags: {myflag: flags.string()},
      })
      expect(out.flags).to.deep.equal({myflag: 'bar'})
      expect(out.argv).to.deep.equal(['foo'])
    })

    describe('args', () => {
      it('requires required args with names', async () => {
        let message = ''
        try {
          await parse(['arg1'], {
            args: [
              {name: 'arg1', required: true},
              {
                description: 'arg2 desc',
                name: 'arg2',
                required: true,
              },
              {
                description: 'arg3 desc',
                name: 'arg3',
                required: true,
              },
            ],
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal(`Missing 2 required args:
arg2  arg2 desc
arg3  arg3 desc
See more help with --help`)
      })

      it('too many args', async () => {
        let message = ''
        try {
          await parse(['arg1', 'arg2'], {
            args: [{name: 'arg1', required: true}],
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal('Unexpected argument: arg2\nSee more help with --help')
      })

      it('parses args', async () => {
        const out = await parse(['foo', 'bar'], {
          args: [{name: 'myarg'}, {name: 'myarg2'}],
        })
        expect(out.argv).to.deep.equal(['foo', 'bar'])
      })
      it('skips optional args', async () => {
        const out = await parse(['foo'], {
          args: [{name: 'myarg'}, {name: 'myarg2'}],
        })
        expect(out.argv).to.deep.equal(['foo'])
      })

      it('skips non-required args', async () => {
        const out = await parse(['foo'], {
          args: [
            {name: 'myarg', required: false},
            {name: 'myarg2', required: false},
          ],
        })
        expect(out.argv).to.deep.equal(['foo'])
      })

      it('parses something looking like a flag as an arg', async () => {
        const out = await parse(['--foo'], {
          args: [{name: 'myarg'}],
        })
        expect(out.argv).to.deep.equal(['--foo'])
      })

      it('parses - as an arg', async () => {
        const out = await parse(['-'], {
          args: [{name: 'myarg'}],
        })
        expect(out.argv).to.deep.equal(['-'])
      })
    })

    describe('args - no args passed in, with defaults', () => {
      it('two args: only first is required, only second has a default', async () => {
        let message = ''
        try {
          await parse([], {
            args: [
              {name: 'arg1', required: true},
              {name: 'arg2', required: false, default: 'some_default'},
            ],
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal(`Missing 1 required arg:
arg1
See more help with --help`)
      })

      it('two args: only first is required, only first has a default', async () => {
        await parse([], {
          args: [
            {name: 'arg1', required: true, default: 'my_default'},
            {name: 'arg2', required: false},
          ],
        })
        // won't reach here if thrown
        expect(() => {}).to.not.throw()
      })

      it('two args: both have a default, only first is required', async () => {
        await parse([], {
          args: [
            {name: 'arg1', required: true, default: 'my_default'},
            {name: 'arg2', required: false, default: 'some_default'},
          ],
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
            args: [
              {name: 'arg1', required: false},
              {name: 'arg2', required: true, default: 'some_default'},
            ],
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal(`Invalid argument spec:
arg1 (optional)
arg2 (required)
See more help with --help`)
      })

      it('required arg after multiple optional args', async () => {
        let message = ''
        try {
          await parse([], {
            args: [
              {name: 'arg1', required: false},
              {name: 'arg2', required: false, default: 'my_default'},
              {name: 'arg3', required: false},
              {name: 'arg4', required: true},
            ],
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal(`Invalid argument spec:
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
            foo: flags.string(),
            bar: flags.string({multiple: true}),
            baz: flags.string({required: true}),
          },
        })
        expect(out.flags.foo!.toUpperCase()).to.equal('C')
        expect(out.flags.baz.toUpperCase()).to.equal('D')
        expect(out.flags.bar.join('|')).to.equal('a|b')
      })
      it('parses multiple flags on custom flags', async () => {
        const out = await parse(['--foo', 'a', '--foo=b'], {
          flags: {
            foo: flags.option({multiple: true, parse: async i => i}),
          },
        })
        expect(out.flags).to.deep.include({foo: ['a', 'b']})
      })
    })

    describe('strict: false', () => {
      it('skips flag parsing after "--"', async () => {
        const out = await parse(['foo', 'bar', '--', '--myflag'], {
          args: [{name: 'argOne'}],
          flags: {myflag: flags.boolean()},
          strict: false,
        })
        expect(out.argv).to.deep.equal(['foo', 'bar', '--myflag'])
        expect(out.args).to.deep.equal({argOne: 'foo'})
      })

      describe('--: false', () => {
        it('can be disabled', async () => {
          const out = await parse(['foo', 'bar', '--', '--myflag'], {
            args: [{name: 'argOne'}],
            strict: false,
            '--': false,
          })
          expect(out.argv).to.deep.equal(['foo', 'bar', '--', '--myflag'])
          expect(out.args).to.deep.equal({argOne: 'foo'})
        })
      })

      it('does not repeat arguments', async () => {
        const out = await parse(['foo', '--myflag=foo bar'], {
          strict: false,
        })
        expect(out.argv).to.deep.equal(['foo', '--myflag=foo bar'])
      })
    })

    describe('integer flag', () => {
      it('parses integers', async () => {
        const out = await parse(['--int', '100'], {
          flags: {int: flags.integer(), s: flags.string()},
        })
        expect(out.flags).to.deep.include({int: 100})
      })

      it('parses zero', async () => {
        const out = await parse(['--int', '0'], {
          flags: {int: flags.integer(), s: flags.string()},
        })
        expect(out.flags).to.deep.include({int: 0})
      })

      it('parses negative integers', async () => {
        const out = await parse(['--int', '-123'], {
          flags: {int: flags.integer(), s: flags.string()},
        })
        expect(out.flags).to.deep.include({int: -123})
      })

      it('does not parse floats', async () => {
        let message = ''
        try {
          await parse(['--int', '3.14'], {
            flags: {int: flags.integer()},
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal('Expected an integer but received: 3.14')
      })

      it('does not parse fractions', async () => {
        let message = ''
        try {
          await parse(['--int', '3/4'], {
            flags: {int: flags.integer()},
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal('Expected an integer but received: 3/4')
      })

      it('does not parse strings', async () => {
        let message = ''
        try {
          await parse(['--int', 's10'], {
            flags: {int: flags.integer()},
          })
        } catch (error: any) {
          message = error.message
        }

        expect(message).to.equal('Expected an integer but received: s10')
      })

      describe('min/max', () => {
        it('min pass equal', async () => {
          const out = await parse(['--int', '10'], {
            flags: {int: flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 10})
        })
        it('min pass gt', async () => {
          const out = await parse(['--int', '11'], {
            flags: {int: flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 11})
        })
        it('max pass lt', async () => {
          const out = await parse(['--int', '19'], {
            flags: {int: flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 19})
        })
        it('max pass equal', async () => {
          const out = await parse(['--int', '20'], {
            flags: {int: flags.integer({min: 10, max: 20})},
          })
          expect(out.flags).to.deep.include({int: 20})
        })

        it('min fail lt', async () => {
          let message = ''
          try {
            await parse(['--int', '9'], {
              flags: {int: flags.integer({min: 10, max: 20})},
            })
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.equal('Expected an integer greater than or equal to 10 but received: 9')
        })
        it('max fail gt', async () => {
          let message = ''
          try {
            await parse(['--int', '21'], {
              flags: {int: flags.integer({min: 10, max: 20})},
            })
          } catch (error: any) {
            message = error.message
          }

          expect(message).to.equal('Expected an integer less than or equal to 20 but received: 21')
        })
      })
    })
  })

  it('--no-color', async () => {
    const out = await parse(['--no-color'], {})
    expect(out.flags).to.deep.include({color: false})
  })

  describe('parse', () => {
    it('parse', async () => {
      const out = await parse(['--foo=bar', '100'], {
        args: [{name: 'num', parse: async i => Number.parseInt(i, 10)}],
        flags: {foo: flags.string({parse: async input => input.toUpperCase()})},
      })
      expect(out.flags).to.deep.include({foo: 'BAR'})
      expect(out.args).to.deep.include({num: 100})
      expect(out.argv).to.deep.equal([100])
    })

    it('parse with a default does not parse default', async () => {
      const out = await parse([], {
        flags: {foo: flags.string({parse: async input => input.toUpperCase(), default: 'baz'})},
      })
      expect(out.flags).to.deep.include({foo: 'baz'})
    })

    describe('parse with a default/value of another type (class)', async () => {
      class TestClass {
        public prop: string;
        constructor(input: string) {
          this.prop = input
        }
      }
      it('uses default via value', async () => {
        const out = await parse([], {
          flags: {
            foo: flags.build<TestClass>({
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
            foo: flags.build<TestClass>({
              parse: async input => new TestClass(input),
              default: async () => new TestClass('baz'),
            })(),
          },
        })
        expect(out.flags.foo?.prop).to.equal('baz')
      })
      it('uses parser when value provided', async () => {
        const out = await parse(['--foo=bar'], {
          flags: {
            foo: flags.build<TestClass>({
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
    //     flags: { foo: flags.string({ parse: (_, ctx) => ctx.flag.name.toUpperCase() }) },
    //   })
    //   expect(out.flags).to.deep.include({ foo: 'FOO' })
    //   expect(out.args).to.deep.include({ num: 'NUM' })
    // })
  })

  describe('flag with multiple inputs', () => {
    it('flag multiple with flag in the middle', async () => {
      const out = await parse(['--foo=bar', '--foo', '100', '--hello', 'world'], {
        flags: {foo: flags.string({multiple: true}), hello: flags.string()},
      })
      expect(out.flags).to.deep.include({foo: ['bar', '100']})
      expect(out.flags).to.deep.include({hello: 'world'})
    })

    it('flag multiple without flag in the middle', async () => {
      const out = await parse(
        ['--foo', './a.txt', './b.txt', './c.txt', '--hello', 'world'],
        {
          flags: {
            foo: flags.string({multiple: true}),
            hello: flags.string(),
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
          args: [{name: 'num'}],
          flags: {foo: flags.string({multiple: true})},
        },
      )
      expect(out.flags).to.deep.include({
        foo: ['./a.txt', './b.txt', './c.txt'],
      })
      expect(out.args).to.deep.include({num: '15'})
    })
  })

  describe('defaults', () => {
    it('generates metadata for defaults', async () => {
      const out = await parse(['-n', 'heroku'], {
        flags: {
          name: flags.string({
            char: 'n',
          }),
          startup: flags.string({
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
        args: [{name: 'baz', default: 'BAZ'}],
        flags: {foo: flags.string({default: 'bar'})},
      })
      expect(out.args).to.deep.include({baz: 'BAZ'})
      expect(out.argv).to.deep.equal(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('accepts falsy', async () => {
      const out = await parse([], {
        args: [{name: 'baz', default: false}],
      })
      expect(out.args).to.deep.include({baz: false})
    })

    it('default as function', async () => {
      const out = await parse([], {
        args: [{name: 'baz', default: () => 'BAZ'}],
        flags: {foo: flags.string({default: async () => 'bar'})},
      })
      expect(out.args).to.deep.include({baz: 'BAZ'})
      expect(out.argv).to.deep.equal(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('default has options', async () => {
      const def: Interfaces.Default<string | undefined> = async ({options}) =>
        options.description
      const out = await parse([], {
        // args: [{ name: 'baz', default: () => 'BAZ' }],
        flags: {foo: flags.string({description: 'bar', default: def})},
      })
      // expect(out.args).to.deep.include({ baz: 'BAZ' })
      // expect(out.argv).to.deep.include(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('can default to a different flag', async () => {
      const def: Interfaces.Default<string | undefined> = async opts => opts.flags.foo
      const out = await parse(['--foo=bar'], {
        flags: {
          bar: flags.string({
            default: def,
          }),
          foo: flags.string(),
        },
      })
      expect(out.flags).to.deep.include({foo: 'bar', bar: 'bar'})
    })
  })

  describe('boolean defaults', () => {
    it('default is true', async () => {
      const out = await parse([], {
        flags: {
          color: flags.boolean({default: true}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })

    it('default is false', async () => {
      const out = await parse([], {
        flags: {
          color: flags.boolean({default: false}),
        },
      })
      expect(out).to.deep.include({flags: {color: false}})
    })

    it('default as function', async () => {
      const out = await parse([], {
        flags: {
          color: flags.boolean({default: async () => true}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })

    it('overridden true default', async () => {
      const out = await parse(['--no-color'], {
        flags: {
          color: flags.boolean({allowNo: true, default: true}),
        },
      })
      expect(out).to.deep.include({flags: {color: false}})
    })

    it('overridden false default', async () => {
      const out = await parse(['--color'], {
        flags: {
          color: flags.boolean({default: false}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })
  })

  describe('custom option', () => {
    it('can pass parse fn', async () => {
      const foo = flags.option({char: 'f', parse: async () => 100})
      const out = await parse(['-f', 'bar'], {
        flags: {foo},
      })
      expect(out.flags).to.deep.include({foo: 100})
    })
  })

  describe('build', () => {
    it('can pass parse fn', async () => {
      const foo = flags.build({char: 'f', parse: async () => 100})
      const out = await parse(['-f', 'bar'], {
        flags: {foo: foo()},
      })
      expect(out.flags).to.deep.include({foo: 100})
    })
    it('does not require parse fn', async () => {
      const foo = flags.build({char: 'f'})
      const out = await parse(['-f', 'bar'], {
        flags: {foo: foo()},
      })
      expect(out.flags).to.deep.include({foo: 'bar'})
    })
  })

  describe('flag options', () => {
    it('accepts valid option', async () => {
      const out = await parse(['--foo', 'myotheropt'], {
        flags: {foo: flags.string({options: ['myopt', 'myotheropt']})},
      })
      expect(out.flags.foo).to.equal('myotheropt')
    })

    it('fails when invalid', async () => {
      let message = ''
      try {
        await parse(['--foo', 'invalidopt'], {
          flags: {foo: flags.string({options: ['myopt', 'myotheropt']})},
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('Expected --foo=invalidopt to be one of: myopt, myotheropt\nSee more help with --help')
    })
  })

  describe('url flag', () => {
    it('accepts valid url', async () => {
      const out = await parse(['--foo', 'https://example.com'], {
        flags: {foo: flags.url()},
      })
      expect(out.flags.foo).to.be.instanceOf(URL)
      expect(out.flags.foo?.href).to.equal('https://example.com/')
    })

    it('fails when invalid', async () => {
      let message = ''
      try {
        await parse(['--foo', 'example'], {
          flags: {foo: flags.url()},
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('Expected a valid url but received: example')
    })
  })

  describe('arg options', () => {
    it('accepts valid option', async () => {
      const out = await parse(['myotheropt'], {
        args: [{name: 'foo', options: ['myopt', 'myotheropt']}],
      })
      expect(out.args.foo).to.equal('myotheropt')
    })

    it('fails when invalid', async () => {
      let message = ''
      try {
        await parse(['invalidopt'], {
          args: [{name: 'foo', options: ['myopt', 'myotheropt']}],
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('Expected invalidopt to be one of: myopt, myotheropt\nSee more help with --help')
    })
  })

  describe('env', () => {
    it('accepts as environment variable', async () => {
      process.env.TEST_FOO = '101'
      const out = await parse([], {
        flags: {foo: flags.string({env: 'TEST_FOO'})},
      })
      expect(out.flags.foo).to.equal('101')
      delete process.env.TEST_FOO
    })
  })

  describe('flag context', () => {
    it('accepts context in parse', async () => {
      const out = await parse(['--foo'], {
        context: {a: 101},
        flags: {
          foo: flags.boolean({
            parse: async (_: any, ctx: any) => ctx.a,
          }),
        },
      })
      expect(out.flags.foo).to.equal(101)
    })
  })

  it('parses multiple flags', async () => {
    const out = await parse(['--foo=a', '--foo', 'b'], {
      flags: {foo: flags.string()},
    })
    expect(out.flags.foo).to.equal('b')
  })

  describe('dependsOn', () => {
    it('ignores', async () => {
      await parse([], {
        flags: {
          foo: flags.string({dependsOn: ['bar']}),
          bar: flags.string({char: 'b'}),
        },
      })
    })

    it('succeeds', async () => {
      const out = await parse(['--foo', 'a', '-bb'], {
        flags: {
          foo: flags.string({dependsOn: ['bar']}),
          bar: flags.string({char: 'b'}),
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
            foo: flags.string({dependsOn: ['bar']}),
            bar: flags.string({char: 'b'}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('All of the following must be provided when using --foo: --bar')
    })
  })

  describe('exclusive', () => {
    it('ignores', async () => {
      await parse([], {
        flags: {
          foo: flags.string({exclusive: ['bar']}),
          bar: flags.string({char: 'b'}),
        },
      })
    })

    it('succeeds', async () => {
      const out = await parse(['--foo', 'a'], {
        flags: {
          foo: flags.string({exclusive: ['bar']}),
          bar: flags.string({char: 'b'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
    })

    it('fails', async () => {
      let message = ''
      try {
        await parse(['--foo', 'a', '-bb'], {
          flags: {
            foo: flags.string({exclusive: ['bar']}),
            bar: flags.string({char: 'b'}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('--bar=b cannot also be provided when using --foo')
    })
  })

  describe('exactlyOne', () => {
    it('throws if neither is set', async () => {
      let message = ''
      try {
        await parse([], {
          flags: {
            foo: flags.string({exactlyOne: ['bar', 'foo']}),
            bar: flags.string({char: 'b', exactlyOne: ['bar', 'foo']}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('Exactly one of the following must be provided: --bar, --foo')
    })

    it('throws if multiple are set', async () => {
      let message = ''
      try {
        await parse(['--foo', 'a', '--bar', 'b'], {
          flags: {
            foo: flags.string({exactlyOne: ['bar']}),
            bar: flags.string({char: 'b', exactlyOne: ['foo']}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('--bar cannot also be provided when using --foo')
    })

    it('succeeds if exactly one', async () => {
      const out = await parse(['--foo', 'a', '--else', '4'], {
        flags: {
          foo: flags.string({exactlyOne: ['bar']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo']}),
          else: flags.string({char: 'e'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
    })

    it('succeeds if exactly one (the other option)', async () => {
      const out = await parse(['--bar', 'b', '--else', '4'], {
        flags: {
          foo: flags.string({exactlyOne: ['bar']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo']}),
          else: flags.string({char: 'e'}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('succeeds if exactly one of three', async () => {
      const out = await parse(['--bar', 'b'], {
        flags: {
          foo: flags.string({exactlyOne: ['bar', 'else']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo', 'else']}),
          else: flags.string({char: 'e', exactlyOne: ['foo', 'bar']}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('lets user list flag in its own list', async () => {
      const out = await parse(['--bar', 'b'], {
        flags: {
          foo: flags.string({exactlyOne: ['foo', 'bar', 'else']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo', 'bar', 'else']}),
          else: flags.string({char: 'e', exactlyOne: ['foo', 'bar', 'else']}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('fails if multiple of three', async () => {
      let message = ''
      try {
        await parse(['--foo', 'a', '--else', '4'], {
          flags: {
            foo: flags.string({exactlyOne: ['bar', 'else']}),
            bar: flags.string({char: 'b', exactlyOne: ['foo', 'else']}),
            else: flags.string({char: 'e', exactlyOne: ['foo', 'bar']}),
          },
        })
      } catch (error: any) {
        message = error.message
      }

      expect(message).to.equal('--else cannot also be provided when using --foo')
    })

    it('handles cross-references/pairings that don\'t make sense', async () => {
      const crazyFlags = {
        foo: flags.string({exactlyOne: ['bar']}),
        bar: flags.string({char: 'b', exactlyOne: ['else']}),
        else: flags.string({char: 'e'}),
      }
      let message1 = ''
      try {
        await parse(['--foo', 'a', '--bar', '4'], {
          flags: crazyFlags,
        })
      } catch (error: any) {
        message1 = error.message
      }

      expect(message1).to.equal('--bar cannot also be provided when using --foo')

      let message2 = ''
      try {
        await parse(['--bar', 'a', '--else', '4'], {
          flags: crazyFlags,
        })
      } catch (error: any) {
        message2 = error.message
      }

      expect(message2).to.equal('--else cannot also be provided when using --bar')

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
          foo: flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(undefined)
    })
    it('is false', async () => {
      const out = await parse(['--no-foo'], {
        flags: {
          foo: flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(false)
    })
    it('is true', async () => {
      const out = await parse(['--foo'], {
        flags: {
          foo: flags.boolean({allowNo: true}),
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
          flags: {dir: directory({exists: false})},
        })
        expect(existsStub.callCount).to.equal(0)
        expect(out.flags).to.deep.include({dir: testDir})
      })
      it('passes if dir !exists but exists not defined', async () => {
        const out = await parse([`--dir=${testDir}`], {
          flags: {dir: directory()},
        })
        expect(existsStub.callCount).to.equal(0)
        expect(out.flags).to.deep.include({dir: testDir})
      })
      it('passes when dir exists', async () => {
        existsStub.returns(true)
        statStub.returns({isDirectory: () => true})
        const out = await parse([`--dir=${testDir}`], {
          flags: {dir: directory({exists: true})},
        })
        expect(out.flags).to.deep.include({dir: testDir})
      })
      it("fails when dir doesn't exist", async () => {
        existsStub.returns(false)
        try {
          const out = await parse([`--dir=${testDir}`], {
            flags: {dir: directory({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.equal(
            `No directory found at ${testDir}`,
          )
        }
      })
      it('fails when dir exists but is not a dir', async () => {
        existsStub.returns(true)
        statStub.returns({isDirectory: () => false})
        try {
          const out = await parse([`--dir=${testDir}`], {
            flags: {dir: directory({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.equal(
            `${testDir} exists but is not a directory`)
        }
      })
    })

    describe('file', () => {
      const testFile = 'some/file.ext'
      it('passes if file doesn\'t exist but not exists:true', async () => {
        const out = await parse([`--file=${testFile}`], {
          flags: {file: file({exists: false})},
        })
        expect(out.flags).to.deep.include({file: testFile})
        expect(existsStub.callCount).to.equal(0)
      })
      it('passes if file doesn\'t exist but not exists not defined', async () => {
        const out = await parse([`--file=${testFile}`], {
          flags: {file: file()},
        })
        expect(out.flags).to.deep.include({file: testFile})
        expect(existsStub.callCount).to.equal(0)
      })
      it('passes when file exists', async () => {
        existsStub.returns(true)
        statStub.returns({isFile: () => true})
        const out = await parse([`--file=${testFile}`], {
          flags: {file: file({exists: true})},
        })
        expect(out.flags).to.deep.include({file: testFile})
      })
      it("fails when dir doesn't exist", async () => {
        existsStub.returns(false)
        try {
          const out = await parse([`--file=${testFile}`], {
            flags: {file: file({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.equal(`No file found at ${testFile}`)
        }
      })
      it('fails when file exists but is not a file', async () => {
        existsStub.returns(true)
        statStub.returns({isFile: () => false})
        try {
          const out = await parse([`--file=${testFile}`], {
            flags: {file: file({exists: true})},
          })
          throw new Error(`Should have thrown an error ${JSON.stringify(out)}`)
        } catch (error_) {
          const error = error_ as Error
          expect(error.message).to.equal(`${testFile} exists but is not a file`)
        }
      })
    })
  })
})
