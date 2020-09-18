/* eslint-disable max-nested-callbacks */
import {expect} from 'chai'

import {flags, parse} from '../../src/parser'
import {Interfaces} from '../../src'

describe('parse', () => {
  it('--bool', () => {
    const out = parse(['--bool'], {
      flags: {
        bool: flags.boolean(),
      },
    })
    expect(out).to.deep.include({flags: {bool: true}})
  })

  it('arg1', () => {
    const out = parse(['arg1'], {
      args: [{name: 'foo'}],
    })
    expect(out.argv).to.deep.equal(['arg1'])
    expect(out.args).to.deep.equal({foo: 'arg1'})
  })

  it('arg1 arg2', () => {
    const out = parse(['arg1', 'arg2'], {
      args: [{name: 'foo'}, {name: 'bar'}],
    })
    expect(out.argv).to.deep.equal(['arg1', 'arg2'])
    expect(out.args).to.deep.equal({foo: 'arg1', bar: 'arg2'})
  })

  describe('output: array', () => {
    it('--bool', () => {
      const out = parse(['--bool'], {
        flags: {
          bool: flags.boolean(),
        },
      })
      expect(out.raw[0]).to.deep.include({flag: 'bool'})
    })

    it('arg1', () => {
      const out = parse(['arg1'], {
        args: [{name: 'foo'}],
      })
      expect(out.raw[0]).to.have.property('input', 'arg1')
    })

    it('parses args and flags', () => {
      const out = parse(['foo', '--myflag', 'bar', 'baz'], {
        args: [{name: 'myarg'}, {name: 'myarg2'}],
        flags: {myflag: flags.string()},
      })
      expect(out.argv[0]).to.equal('foo')
      expect(out.argv[1]).to.equal('baz')
      expect(out.flags.myflag).to.equal('bar')
    })

    describe('flags', () => {
      it('parses flags', () => {
        const out = parse(['--myflag', '--myflag2'], {
          flags: {myflag: flags.boolean(), myflag2: flags.boolean()},
        })
        expect(Boolean(out.flags.myflag)).to.equal(true)
        expect(Boolean(out.flags.myflag2)).to.equal(true)
      })

      it('parses short flags', () => {
        const out = parse(['-mf'], {
          flags: {
            force: flags.boolean({char: 'f'}),
            myflag: flags.boolean({char: 'm'}),
          },
        })
        expect(Boolean(out.flags.myflag)).to.equal(true)
        expect(Boolean(out.flags.force)).to.equal(true)
      })
    })
    it('parses flag value with "=" to separate', () => {
      const out = parse(['--myflag=foo'], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: 'foo'})
    })

    it('parses flag value with "=" in value', () => {
      const out = parse(['--myflag', '=foo'], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: '=foo'})
    })

    it('parses short flag value with "="', () => {
      const out = parse(['-m=foo'], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: 'foo'})
    })

    it('parses value of ""', () => {
      const out = parse(['-m', ''], {
        flags: {
          myflag: flags.string({char: 'm'}),
        },
      })
      expect(out.flags).to.deep.equal({myflag: ''})
    })

    it('requires required flag', () => {
      expect(() => {
        parse([], {
          flags: {
            myflag: flags.string({
              description: 'flag description',
              required: true,
            }),
          },
        })
      }).to.throw(
        'Missing required flag:\n --myflag MYFLAG  flag description\nSee more help with --help',
      )
    })

    it('removes flags from argv', () => {
      const out = parse(['--myflag', 'bar', 'foo'], {
        args: [{name: 'myarg'}],
        flags: {myflag: flags.string()},
      })
      expect(out.flags).to.deep.equal({myflag: 'bar'})
      expect(out.argv).to.deep.equal(['foo'])
    })

    describe('args', () => {
      it('requires required args with names', () => {
        expect(() => {
          parse(['arg1'], {
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
        }).to.throw(`Missing 2 required args:
arg2  arg2 desc
arg3  arg3 desc
See more help with --help`)
      })

      it('too many args', () => {
        expect(() => {
          parse(['arg1', 'arg2'], {
            args: [{name: 'arg1', required: true}],
          })
        }).to.throw('Unexpected argument: arg2\nSee more help with --help')
      })

      it('parses args', () => {
        const out = parse(['foo', 'bar'], {
          args: [{name: 'myarg'}, {name: 'myarg2'}],
        })
        expect(out.argv).to.deep.equal(['foo', 'bar'])
      })
      it('skips optional args', () => {
        const out = parse(['foo'], {
          args: [{name: 'myarg'}, {name: 'myarg2'}],
        })
        expect(out.argv).to.deep.equal(['foo'])
      })

      it('skips non-required args', () => {
        const out = parse(['foo'], {
          args: [
            {name: 'myarg', required: false},
            {name: 'myarg2', required: false},
          ],
        })
        expect(out.argv).to.deep.equal(['foo'])
      })

      it('parses something looking like a flag as an arg', () => {
        const out = parse(['--foo'], {
          args: [{name: 'myarg'}],
        })
        expect(out.argv).to.deep.equal(['--foo'])
      })

      it('parses - as an arg', () => {
        const out = parse(['-'], {
          args: [{name: 'myarg'}],
        })
        expect(out.argv).to.deep.equal(['-'])
      })
    })

    describe('args - no args passed in, with defaults', () => {
      it('two args: only first is required, only second has a default', () => {
        expect(() => {
          parse([], {
            args: [
              {name: 'arg1', required: true},
              {name: 'arg2', required: false, default: 'some_default'},
            ],
          })
        }).to.throw(`Missing 1 required arg:
arg1
See more help with --help`)
      })

      it('two args: only first is required, only first has a default', () => {
        expect(() => {
          parse([], {
            args: [
              {name: 'arg1', required: true, default: 'my_default'},
              {name: 'arg2', required: false},
            ],
          })
        }).to.not.throw()
      })

      it('two args: both have a default, only first is required', () => {
        expect(() => {
          parse([], {
            args: [
              {name: 'arg1', required: true, default: 'my_default'},
              {name: 'arg2', required: false, default: 'some_default'},
            ],
          })
        }).to.not.throw()
      })
    })

    describe('optional args should always be after required args', () => {
      it('required arg after optional arg', () => {
        expect(() => {
          parse([], {
            args: [
              {name: 'arg1', required: false},
              {name: 'arg2', required: true, default: 'some_default'},
            ],
          })
        }).to.throw(`Invalid argument spec:
arg1 (optional)
arg2 (required)
See more help with --help`)
      })

      it('required arg after multiple optional args', () => {
        expect(() => {
          parse([], {
            args: [
              {name: 'arg1', required: false},
              {name: 'arg2', required: false, default: 'my_default'},
              {name: 'arg3', required: false},
              {name: 'arg4', required: true},
            ],
          })
        }).to.throw(`Invalid argument spec:
arg1 (optional)
arg2 (optional)
arg3 (optional)
arg4 (required)
See more help with --help`)
      })
    })

    describe('multiple flags', () => {
      it('parses multiple flags', () => {
        const out = parse(['--bar', 'a', '--bar=b', '--foo=c', '--baz=d'], {
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
    })

    describe('strict: false', () => {
      it('skips flag parsing after "--"', () => {
        const out = parse(['foo', 'bar', '--', '--myflag'], {
          args: [{name: 'argOne'}],
          flags: {myflag: flags.boolean()},
          strict: false,
        })
        expect(out.argv).to.deep.equal(['foo', 'bar', '--myflag'])
        expect(out.args).to.deep.equal({argOne: 'foo'})
      })

      describe('--: false', () => {
        it('can be disabled', () => {
          const out = parse(['foo', 'bar', '--', '--myflag'], {
            args: [{name: 'argOne'}],
            strict: false,
            '--': false,
          })
          expect(out.argv).to.deep.equal(['foo', 'bar', '--', '--myflag'])
          expect(out.args).to.deep.equal({argOne: 'foo'})
        })
      })

      it('does not repeat arguments', () => {
        const out = parse(['foo', '--myflag=foo bar'], {
          strict: false,
        })
        expect(out.argv).to.deep.equal(['foo', '--myflag=foo bar'])
      })
    })

    describe('integer flag', () => {
      it('parses integers', () => {
        const out = parse(['--int', '100'], {
          flags: {int: flags.integer(), s: flags.string()},
        })
        expect(out.flags).to.deep.include({int: 100})
      })

      it('parses zero', () => {
        const out = parse(['--int', '0'], {
          flags: {int: flags.integer(), s: flags.string()},
        })
        expect(out.flags).to.deep.include({int: 0})
      })

      it('parses negative integers', () => {
        const out = parse(['--int', '-123'], {
          flags: {int: flags.integer(), s: flags.string()},
        })
        expect(out.flags).to.deep.include({int: -123})
      })

      it('does not parse floats', () => {
        expect(() => {
          parse(['--int', '3.14'], {
            flags: {int: flags.integer()},
          })
        }).to.throw('Expected an integer but received: 3.14')
      })

      it('does not parse fractions', () => {
        expect(() => {
          parse(['--int', '3/4'], {
            flags: {int: flags.integer()},
          })
        }).to.throw('Expected an integer but received: 3/4')
      })

      it('does not parse strings', () => {
        expect(() => {
          parse(['--int', 's10'], {
            flags: {int: flags.integer()},
          })
        }).to.throw('Expected an integer but received: s10')
      })
    })
  })

  it('--no-color', () => {
    const out = parse(['--no-color'], {})
    expect(out.flags).to.deep.include({color: false})
  })

  describe('parse', () => {
    it('parse', () => {
      const out = parse(['--foo=bar', '100'], {
        args: [{name: 'num', parse: i => parseInt(i, 10)}],
        flags: {foo: flags.string({parse: input => input.toUpperCase()})},
      })
      expect(out.flags).to.deep.include({foo: 'BAR'})
      expect(out.args).to.deep.include({num: 100})
      expect(out.argv).to.deep.equal([100])
    })

    // it('gets arg/flag in context', () => {
    //   const out = parse({
    //     args: [{ name: 'num', parse: (_, ctx) => ctx.arg.name!.toUpperCase() }],
    //     argv: ['--foo=bar', '100'],
    //     flags: { foo: flags.string({ parse: (_, ctx) => ctx.flag.name.toUpperCase() }) },
    //   })
    //   expect(out.flags).to.deep.include({ foo: 'FOO' })
    //   expect(out.args).to.deep.include({ num: 'NUM' })
    // })
  })

  describe('flag with multiple inputs', () => {
    it('flag multiple with flag in the middle', () => {
      const out = parse(['--foo=bar', '--foo', '100', '--hello', 'world'], {
        flags: {foo: flags.string({multiple: true}), hello: flags.string()},
      })
      expect(out.flags).to.deep.include({foo: ['bar', '100']})
      expect(out.flags).to.deep.include({hello: 'world'})
    })

    it('flag multiple without flag in the middle', () => {
      const out = parse(
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

    it('flag multiple with arguments', () => {
      const out = parse(
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
    it('generates metadata for defaults', () => {
      const out = parse(['-n', 'heroku'], {
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

    it('defaults', () => {
      const out = parse([], {
        args: [{name: 'baz', default: 'BAZ'}],
        flags: {foo: flags.string({default: 'bar'})},
      })
      expect(out.args).to.deep.include({baz: 'BAZ'})
      expect(out.argv).to.deep.equal(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('accepts falsy', () => {
      const out = parse([], {
        args: [{name: 'baz', default: false}],
      })
      expect(out.args).to.deep.include({baz: false})
    })

    it('default as function', () => {
      const out = parse([], {
        args: [{name: 'baz', default: () => 'BAZ'}],
        flags: {foo: flags.string({default: () => 'bar'})},
      })
      expect(out.args).to.deep.include({baz: 'BAZ'})
      expect(out.argv).to.deep.equal(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('default has options', () => {
      const def: Interfaces.Default<string | undefined> = ({options}) =>
        options.description
      const out = parse([], {
        // args: [{ name: 'baz', default: () => 'BAZ' }],
        flags: {foo: flags.string({description: 'bar', default: def})},
      })
      // expect(out.args).to.deep.include({ baz: 'BAZ' })
      // expect(out.argv).to.deep.include(['BAZ'])
      expect(out.flags).to.deep.include({foo: 'bar'})
    })

    it('can default to a different flag', () => {
      const def: Interfaces.Default<string | undefined> = opts => opts.flags.foo
      const out = parse(['--foo=bar'], {
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
    it('default is true', () => {
      const out = parse([], {
        flags: {
          color: flags.boolean({default: true}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })

    it('default is false', () => {
      const out = parse([], {
        flags: {
          color: flags.boolean({default: false}),
        },
      })
      expect(out).to.deep.include({flags: {color: false}})
    })

    it('default as function', () => {
      const out = parse([], {
        flags: {
          color: flags.boolean({default: () => true}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })

    it('overridden true default', () => {
      const out = parse(['--no-color'], {
        flags: {
          color: flags.boolean({allowNo: true, default: true}),
        },
      })
      expect(out).to.deep.include({flags: {color: false}})
    })

    it('overridden false default', () => {
      const out = parse(['--color'], {
        flags: {
          color: flags.boolean({default: false}),
        },
      })
      expect(out).to.deep.include({flags: {color: true}})
    })
  })

  describe('custom option', () => {
    it('can pass parse fn', () => {
      const foo = flags.option({char: 'f', parse: () => 100})
      const out = parse(['-f', 'bar'], {
        flags: {foo},
      })
      expect(out.flags).to.deep.include({foo: 100})
    })
  })

  describe('build', () => {
    it('can pass parse fn', () => {
      const foo = flags.build({char: 'f', parse: () => 100})
      const out = parse(['-f', 'bar'], {
        flags: {foo: foo()},
      })
      expect(out.flags).to.deep.include({foo: 100})
    })
    it('does not require parse fn', () => {
      const foo = flags.build({char: 'f'})
      const out = parse(['-f', 'bar'], {
        flags: {foo: foo()},
      })
      expect(out.flags).to.deep.include({foo: 'bar'})
    })
  })

  describe('flag options', () => {
    it('accepts valid option', () => {
      const out = parse(['--foo', 'myotheropt'], {
        flags: {foo: flags.string({options: ['myopt', 'myotheropt']})},
      })
      expect(out.flags.foo).to.equal('myotheropt')
    })

    it('fails when invalid', () => {
      expect(() => {
        parse(['--foo', 'invalidopt'], {
          flags: {foo: flags.string({options: ['myopt', 'myotheropt']})},
        })
      }).to.throw('Expected --foo=invalidopt to be one of: myopt, myotheropt')
    })
  })

  describe('arg options', () => {
    it('accepts valid option', () => {
      const out = parse(['myotheropt'], {
        args: [{name: 'foo', options: ['myopt', 'myotheropt']}],
      })
      expect(out.args.foo).to.equal('myotheropt')
    })

    it('fails when invalid', () => {
      expect(() => {
        parse(['invalidopt'], {
          args: [{name: 'foo', options: ['myopt', 'myotheropt']}],
        })
      }).to.throw('Expected invalidopt to be one of: myopt, myotheropt')
    })
  })

  describe('env', () => {
    it('accepts as environment variable', () => {
      process.env.TEST_FOO = '101'
      const out = parse([], {
        flags: {foo: flags.string({env: 'TEST_FOO'})},
      })
      expect(out.flags.foo).to.equal('101')
      delete process.env.TEST_FOO
    })
  })

  describe('flag context', () => {
    it('accepts context in parse', () => {
      const out = parse(['--foo'], {
        context: {a: 101},
        flags: {
          foo: flags.boolean({
            parse: (_: any, ctx: any) => ctx.a,
          }),
        },
      })
      expect(out.flags.foo).to.equal(101)
    })
  })

  it('parses multiple flags', () => {
    const out = parse(['--foo=a', '--foo', 'b'], {
      flags: {foo: flags.string()},
    })
    expect(out.flags.foo).to.equal('b')
  })

  describe('dependsOn', () => {
    it('ignores', () => {
      parse([], {
        flags: {
          foo: flags.string({dependsOn: ['bar']}),
          bar: flags.string({char: 'b'}),
        },
      })
    })

    it('succeeds', () => {
      const out = parse(['--foo', 'a', '-bb'], {
        flags: {
          foo: flags.string({dependsOn: ['bar']}),
          bar: flags.string({char: 'b'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
      expect(out.flags.bar).to.equal('b')
    })

    it('fails', () => {
      expect(() => {
        parse(['--foo', 'a'], {
          flags: {
            foo: flags.string({dependsOn: ['bar']}),
            bar: flags.string({char: 'b'}),
          },
        })
      }).to.throw('--bar= must also be provided when using --foo=')
    })
  })

  describe('exclusive', () => {
    it('ignores', () => {
      parse([], {
        flags: {
          foo: flags.string({exclusive: ['bar']}),
          bar: flags.string({char: 'b'}),
        },
      })
    })

    it('succeeds', () => {
      const out = parse(['--foo', 'a'], {
        flags: {
          foo: flags.string({exclusive: ['bar']}),
          bar: flags.string({char: 'b'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
    })

    it('fails', () => {
      expect(() => {
        parse(['--foo', 'a', '-bb'], {
          flags: {
            foo: flags.string({exclusive: ['bar']}),
            bar: flags.string({char: 'b'}),
          },
        })
      }).to.throw('--bar= cannot also be provided when using --foo=')
    })
  })

  describe('exactlyOne', () => {
    it('throws if neither is set', () => {
      expect(() => {
        parse([], {
          flags: {
            foo: flags.string({exactlyOne: ['bar']}),
            bar: flags.string({char: 'b', exactlyOne: ['foo']}),
          },
        })
      }).to.throw()
    })

    it('throws if multiple are set', () => {
      expect(() => {
        parse(['--foo', 'a', '--bar', 'b'], {
          flags: {
            foo: flags.string({exactlyOne: ['bar']}),
            bar: flags.string({char: 'b', exactlyOne: ['foo']}),
          },
        })
      }).to.throw('--bar= cannot also be provided when using --foo=')
    })

    it('succeeds if exactly one', () => {
      const out = parse(['--foo', 'a', '--else', '4'], {
        flags: {
          foo: flags.string({exactlyOne: ['bar']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo']}),
          else: flags.string({char: 'e'}),
        },
      })
      expect(out.flags.foo).to.equal('a')
    })

    it('succeeds if exactly one (the other option)', () => {
      const out = parse(['--bar', 'b', '--else', '4'], {
        flags: {
          foo: flags.string({exactlyOne: ['bar']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo']}),
          else: flags.string({char: 'e'}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('succeeds if exactly one of three', () => {
      const out = parse(['--bar', 'b'], {
        flags: {
          foo: flags.string({exactlyOne: ['bar', 'else']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo', 'else']}),
          else: flags.string({char: 'e', exactlyOne: ['foo', 'bar']}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('lets user list flag in its own list', () => {
      const out = parse(['--bar', 'b'], {
        flags: {
          foo: flags.string({exactlyOne: ['foo', 'bar', 'else']}),
          bar: flags.string({char: 'b', exactlyOne: ['foo', 'bar', 'else']}),
          else: flags.string({char: 'e', exactlyOne: ['foo', 'bar', 'else']}),
        },
      })
      expect(out.flags.bar).to.equal('b')
    })

    it('fails if multiple of three', () => {
      expect(() => {
        parse(['--foo', 'a', '--else', '4'], {
          flags: {
            foo: flags.string({exactlyOne: ['bar', 'else']}),
            bar: flags.string({char: 'b', exactlyOne: ['foo', 'else']}),
            else: flags.string({char: 'e', exactlyOne: ['foo', 'bar']}),
          },
        })
      }).to.throw()
    })

    it('handles cross-references/pairings that don\'t make sense', () => {
      const crazyFlags = {
        foo: flags.string({exactlyOne: ['bar']}),
        bar: flags.string({char: 'b', exactlyOne: ['else']}),
        else: flags.string({char: 'e'}),
      }
      expect(() => {
        parse(['--foo', 'a', '--bar', '4'], {
          flags: crazyFlags,
        })
      }).to.throw()

      expect(() => {
        parse(['--bar', 'a', '--else', '4'], {
          flags: crazyFlags,
        })
      }).to.throw()
      const out = parse(['--foo', 'a', '--else', '4'], {
        flags: crazyFlags,
      })
      expect(out.flags.foo).to.equal('a')
      expect(out.flags.else).to.equal('4')
      expect(out.flags.bar).to.equal(undefined)
    })
  })

  describe('allowNo', () => {
    it('is undefined if not set', () => {
      const out = parse([], {
        flags: {
          foo: flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(undefined)
    })
    it('is false', () => {
      const out = parse(['--no-foo'], {
        flags: {
          foo: flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(false)
    })
    it('is true', () => {
      const out = parse(['--foo'], {
        flags: {
          foo: flags.boolean({allowNo: true}),
        },
      })
      expect(out.flags.foo).to.equal(true)
    })
  })
})
