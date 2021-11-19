// tslint:disable interface-over-type-literal

import Deps from './deps'
import * as Errors from './errors'
import * as Util from './util'
import {ParserInput, OutputFlags, ParsingToken, OutputArgs, ArgToken, FlagToken, BooleanFlag, OptionFlag} from '../interfaces'

// eslint-disable-next-line new-cap
const m = Deps()
// eslint-disable-next-line node/no-missing-require
.add('errors', () => require('./errors') as typeof Errors)
// eslint-disable-next-line node/no-missing-require
.add('util', () => require('./util') as typeof Util)

let debug: any
try {
  // eslint-disable-next-line no-negated-condition
  debug = process.env.CLI_FLAGS_DEBUG !== '1' ? () => {} : require('debug')('../parser')
} catch {
  debug = () => {}
}

const readStdin = async () => {
  const {stdin} = process
  let result
  if (stdin.isTTY) return result
  result = ''
  stdin.setEncoding('utf8')
  for await (const chunk of stdin) {
    result += chunk
  }

  return result
}

export class Parser<T extends ParserInput, TFlags extends OutputFlags<T['flags']>, TArgs extends OutputArgs> {
  private readonly argv: string[]

  private readonly raw: ParsingToken[] = []

  private readonly booleanFlags: { [k: string]: BooleanFlag<any> }

  private readonly context: any

  private readonly metaData: any

  private currentFlag?: OptionFlag<any>

  constructor(private readonly input: T) {
    const {pickBy} = m.util
    this.context = input.context || {}
    this.argv = [...input.argv]
    this._setNames()
    this.booleanFlags = pickBy(input.flags, f => f.type === 'boolean') as any
    this.metaData = {}
  }

  public async parse() {
    this._debugInput()

    const findLongFlag = (arg: string) => {
      const name = arg.slice(2)
      if (this.input.flags[name]) {
        return name
      }

      if (arg.startsWith('--no-')) {
        const flag = this.booleanFlags[arg.slice(5)]
        if (flag && flag.allowNo) return flag.name
      }
    }

    const findShortFlag = (arg: string) => {
      return Object.keys(this.input.flags).find(k => this.input.flags[k].char === arg[1])
    }

    const parseFlag = (arg: string): boolean => {
      const long = arg.startsWith('--')
      const name = long ? findLongFlag(arg) : findShortFlag(arg)
      if (!name) {
        const i = arg.indexOf('=')
        if (i !== -1) {
          const sliced = arg.slice(i + 1)
          this.argv.unshift(sliced)

          const equalsParsed = parseFlag(arg.slice(0, i))
          if (!equalsParsed) {
            this.argv.shift()
          }

          return equalsParsed
        }

        return false
      }

      const flag = this.input.flags[name]
      if (flag.type === 'option') {
        this.currentFlag = flag
        const input = long || arg.length < 3 ? this.argv.shift() : arg.slice(arg[2] === '=' ? 3 : 2)
        if (typeof input !== 'string') {
          throw new m.errors.CLIError(`Flag --${name} expects a value`)
        }

        this.raw.push({type: 'flag', flag: flag.name, input})
      } else {
        this.raw.push({type: 'flag', flag: flag.name, input: arg})
        // push the rest of the short characters back on the stack
        if (!long && arg.length > 2) {
          this.argv.unshift(`-${arg.slice(2)}`)
        }
      }

      return true
    }

    let parsingFlags = true
    while (this.argv.length > 0) {
      const input = this.argv.shift() as string
      if (parsingFlags && input.startsWith('-') && input !== '-') {
        // attempt to parse as arg
        if (this.input['--'] !== false && input === '--') {
          parsingFlags = false
          continue
        }

        if (parseFlag(input)) {
          continue
        }
        // not actually a flag if it reaches here so parse as an arg
      }

      if (parsingFlags && this.currentFlag && this.currentFlag.multiple) {
        this.raw.push({type: 'flag', flag: this.currentFlag.name, input})
        continue
      }

      // not a flag, parse as arg
      const arg = this.input.args[this._argTokens.length]
      if (arg) arg.input = input
      this.raw.push({type: 'arg', input})
    }

    const argv = await this._argv()
    const args = this._args(argv)
    const flags = await this._flags()
    this._debugOutput(argv, args, flags)
    return {
      args,
      argv,
      flags,
      raw: this.raw,
      metadata: this.metaData,
    }
  }

  private _args(argv: any[]): TArgs {
    const args = {} as any
    for (let i = 0; i < this.input.args.length; i++) {
      const arg = this.input.args[i]
      args[arg.name!] = argv[i]
    }

    return args
  }

  private async _flags(): Promise<TFlags> {
    const flags = {} as any
    this.metaData.flags = {} as any
    for (const token of this._flagTokens) {
      const flag = this.input.flags[token.flag]
      if (!flag) throw new m.errors.CLIError(`Unexpected flag ${token.flag}`)
      if (flag.type === 'boolean') {
        if (token.input === `--no-${flag.name}`) {
          flags[token.flag] = false
        } else {
          flags[token.flag] = true
        }

        // eslint-disable-next-line no-await-in-loop
        flags[token.flag] = await flag.parse(flags[token.flag], this.context)
      } else {
        const input = token.input
        if (flag.options && !flag.options.includes(input)) {
          throw new m.errors.FlagInvalidOptionError(flag, input)
        }

        // eslint-disable-next-line no-await-in-loop
        const value = flag.parse ? await flag.parse(input, this.context) : input
        if (flag.multiple) {
          flags[token.flag] = flags[token.flag] || []
          flags[token.flag].push(value)
        } else {
          flags[token.flag] = value
        }
      }
    }

    for (const k of Object.keys(this.input.flags)) {
      const flag = this.input.flags[k]
      if (flags[k]) continue
      if (flag.type === 'option' && flag.env) {
        const input = process.env[flag.env]
        // eslint-disable-next-line no-await-in-loop
        if (input) flags[k] = await flag.parse(input, this.context)
      }

      if (!(k in flags) && flag.default !== undefined) {
        this.metaData.flags[k] = {setFromDefault: true}
        // eslint-disable-next-line no-await-in-loop
        const defaultValue = (typeof flag.default === 'function' ? await flag.default({options: flag, flags, ...this.context}) : flag.default) as string
        const parsedValue = flag.type === 'option' && flag.parse ?
          // eslint-disable-next-line no-await-in-loop
          await flag.parse(defaultValue, this.context) :
          defaultValue
        flags[k] = parsedValue
      }
    }

    return flags
  }

  private async _argv(): Promise<any[]> {
    const args: any[] = []
    const tokens = this._argTokens
    let stdinRead = false
    for (let i = 0; i < Math.max(this.input.args.length, tokens.length); i++) {
      const token = tokens[i]
      const arg = this.input.args[i]
      if (token) {
        if (arg) {
          if (arg.options && !arg.options.includes(token.input)) {
            throw new m.errors.ArgInvalidOptionError(arg, token.input)
          }

          // eslint-disable-next-line no-await-in-loop
          args[i] = await arg.parse(token.input)
        } else {
          args[i] = token.input
        }
      } else if (!arg.ignoreStdin && !stdinRead) {
        // eslint-disable-next-line no-await-in-loop
        let stdin = await readStdin()
        if (stdin) {
          stdin = stdin.trim()
          args[i] = stdin
        }

        stdinRead = true
      }

      if (!args[i] && 'default' in arg) {
        if (typeof arg.default === 'function') {
          // eslint-disable-next-line no-await-in-loop
          const f = await arg.default()
          args[i] = f
        } else {
          args[i] = arg.default
        }
      }
    }

    return args
  }

  private _debugOutput(args: any, flags: any, argv: any) {
    if (argv.length > 0) {
      debug('argv: %o', argv)
    }

    if (Object.keys(args).length > 0) {
      debug('args: %o', args)
    }

    if (Object.keys(flags).length > 0) {
      debug('flags: %o', flags)
    }
  }

  private _debugInput() {
    debug('input: %s', this.argv.join(' '))
    if (this.input.args.length > 0) {
      debug('available args: %s', this.input.args.map(a => a.name).join(' '))
    }

    if (Object.keys(this.input.flags).length === 0) return
    debug(
      'available flags: %s',
      Object.keys(this.input.flags)
      .map(f => `--${f}`)
      .join(' '),
    )
  }

  private get _argTokens(): ArgToken[] {
    return this.raw.filter(o => o.type === 'arg') as ArgToken[]
  }

  private get _flagTokens(): FlagToken[] {
    return this.raw.filter(o => o.type === 'flag') as FlagToken[]
  }

  private _setNames() {
    for (const k of Object.keys(this.input.flags)) {
      this.input.flags[k].name = k
    }
  }
}
