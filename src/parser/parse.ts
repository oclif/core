/* eslint-disable no-await-in-loop */
import {ArgInvalidOptionError, CLIError, FlagInvalidOptionError} from './errors'
import {ArgToken, BooleanFlag, FlagToken, OptionFlag, OutputArgs, OutputFlags, ParserInput, ParserOutput, ParsingToken} from '../interfaces/parser'
import * as readline from 'readline'
import {isTruthy, pickBy} from '../util'

let debug: any
try {
  // eslint-disable-next-line no-negated-condition
  debug = process.env.CLI_FLAGS_DEBUG !== '1' ? () => {} : require('debug')('../parser')
} catch {
  debug = () => {}
}

const readStdin = async (): Promise<string | null> => {
  const {stdin, stdout} = process
  debug('stdin.isTTY', stdin.isTTY)
  if (stdin.isTTY) return null

  // process.stdin.isTTY is true whenever it's running in a terminal.
  // process.stdin.isTTY is undefined when it's running in a pipe, e.g. echo 'foo' | my-cli command
  // process.stdin.isTTY is undefined when it's running in a spawned process, even if there's no pipe.
  // This means that reading from stdin could hang indefinitely while waiting for a non-existent pipe.
  // Because of this, we have to set a timeout to prevent the process from hanging.
  return new Promise(resolve => {
    let result = ''
    const ac = new AbortController()
    const signal = ac.signal
    const timeout = setTimeout(() => ac.abort(), 100)

    const rl = readline.createInterface({
      input: stdin,
      output: stdout,
      terminal: false,
    })

    rl.on('line', line => {
      result += line
    })

    rl.once('close', () => {
      clearTimeout(timeout)
      debug('resolved from stdin', result)
      resolve(result)
    })

    signal.addEventListener('abort', () => {
      debug('stdin aborted')
      clearTimeout(timeout)
      rl.close()
      resolve(null)
    }, {once: true})
  })
}

function isNegativeNumber(input: string): boolean {
  return /^-\d/g.test(input)
}

export class Parser<T extends ParserInput, TFlags extends OutputFlags<T['flags']>, BFlags extends OutputFlags<T['flags']>, TArgs extends OutputArgs<T['args']>> {
  private readonly argv: string[]

  private readonly raw: ParsingToken[] = []

  private readonly booleanFlags: { [k: string]: BooleanFlag<any> }
  private readonly flagAliases: { [k: string]: BooleanFlag<any> | OptionFlag<any> }

  private readonly context: any

  private readonly metaData: any

  private currentFlag?: OptionFlag<any>

  constructor(private readonly input: T) {
    this.context = input.context || {}
    this.argv = [...input.argv]
    this._setNames()
    this.booleanFlags = pickBy(input.flags, f => f.type === 'boolean') as any
    this.flagAliases = Object.fromEntries(Object.values(input.flags).flatMap(flag => {
      return (flag.aliases ?? []).map(a => [a, flag])
    }))

    this.metaData = {}
  }

  public async parse(): Promise<ParserOutput<TFlags, BFlags, TArgs>> {
    this._debugInput()

    const findLongFlag = (arg: string) => {
      const name = arg.slice(2)
      if (this.input.flags[name]) {
        return name
      }

      if (this.flagAliases[name]) {
        return this.flagAliases[name].name
      }

      if (arg.startsWith('--no-')) {
        const flag = this.booleanFlags[arg.slice(5)]
        if (flag && flag.allowNo) return flag.name
      }
    }

    const findShortFlag = ([_, char]: string) => {
      if (this.flagAliases[char]) {
        return this.flagAliases[char].name
      }

      return Object.keys(this.input.flags).find(k => this.input.flags[k].char === char)
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
          throw new CLIError(`Flag --${name} expects a value`)
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
    const nonExistentFlags: string[] = []
    let dashdash = false
    const originalArgv = [...this.argv]

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

        if (input === '--') {
          dashdash = true
          continue
        }

        if (this.input['--'] !== false && !isNegativeNumber(input)) {
          // At this point we have a value that begins with '-' or '--'
          // but doesn't match up to a flag definition. So we assume that
          // this is a misspelled flag or a non-existent flag,
          // e.g. --hekp instead of --help
          nonExistentFlags.push(input)
          continue
        }
      }

      if (parsingFlags && this.currentFlag && this.currentFlag.multiple) {
        this.raw.push({type: 'flag', flag: this.currentFlag.name, input})
        continue
      }

      // not a flag, parse as arg
      const arg = Object.keys(this.input.args)[this._argTokens.length]
      this.raw.push({type: 'arg', arg, input})
    }

    const {argv, args} = await this._args()
    const flags = await this._flags()
    this._debugOutput(argv, args, flags)

    const unsortedArgv = (dashdash ? [...argv, ...nonExistentFlags, '--'] : [...argv, ...nonExistentFlags]) as string[]

    return {
      argv: unsortedArgv.sort((a, b) => originalArgv.indexOf(a) - originalArgv.indexOf(b)),
      flags,
      args: args as TArgs,
      raw: this.raw,
      metadata: this.metaData,
      nonExistentFlags,
    }
  }

  // eslint-disable-next-line complexity
  private async _flags(): Promise<TFlags & BFlags & { json: boolean | undefined }> {
    const flags = {} as any
    this.metaData.flags = {} as any
    for (const token of this._flagTokens) {
      const flag = this.input.flags[token.flag]

      if (!flag) throw new CLIError(`Unexpected flag ${token.flag}`)
      if (flag.type === 'boolean') {
        if (token.input === `--no-${flag.name}`) {
          flags[token.flag] = false
        } else {
          flags[token.flag] = true
        }

        flags[token.flag] = await this._parseFlag(flags[token.flag], flag)
      } else {
        const input = token.input
        this._validateOptions(flag, input)

        if (flag.delimiter && flag.multiple) {
          const values = await Promise.all(input.split(flag.delimiter).map(async v => this._parseFlag(v.trim(), flag)))
          flags[token.flag] = flags[token.flag] || []
          flags[token.flag].push(...values)
        } else {
          const value = await this._parseFlag(input, flag)
          if (flag.multiple) {
            flags[token.flag] = flags[token.flag] || []
            flags[token.flag].push(value)
          } else {
            flags[token.flag] = value
          }
        }
      }
    }

    for (const k of Object.keys(this.input.flags)) {
      const flag = this.input.flags[k]
      if (flags[k]) continue
      if (flag.env && Object.prototype.hasOwnProperty.call(process.env, flag.env)) {
        const input = process.env[flag.env]
        if (flag.type === 'option') {
          if (input) {
            this._validateOptions(flag, input)

            flags[k] = await this._parseFlag(input, flag)
          }
        } else if (flag.type === 'boolean') {
          // eslint-disable-next-line no-negated-condition
          flags[k] = input !== undefined ? isTruthy(input) : false
        }
      }

      if (!(k in flags) && flag.default !== undefined) {
        this.metaData.flags[k] = {setFromDefault: true}
        const defaultValue = (typeof flag.default === 'function' ? await flag.default({options: flag, flags, ...this.context}) : flag.default)
        flags[k] = defaultValue
      }
    }

    return flags
  }

  private async _parseFlag(input: any, flag: BooleanFlag<any> | OptionFlag<any>) {
    if (!flag.parse) return input

    try {
      if (flag.type === 'boolean') {
        return await flag.parse(input, this.context, flag)
      }

      return flag.parse ? await flag.parse(input, this.context, flag) : input
    } catch (error: any) {
      error.message = `Parsing --${flag.name} \n\t${error.message}\nSee more help with --help`
      throw error
    }
  }

  private _validateOptions(flag: OptionFlag<any>, input: string) {
    if (flag.options && !flag.options.includes(input))
      throw new FlagInvalidOptionError(flag, input)
  }

  private async _args(): Promise<{ argv: unknown[]; args: Record<string, unknown>}> {
    const argv: unknown[] = []
    const args = {} as Record<string, unknown>
    const tokens = this._argTokens
    let stdinRead = false

    for (const [name, arg] of Object.entries(this.input.args)) {
      const token = tokens.find(t => t.arg === name)
      if (token) {
        if (arg.options && !arg.options.includes(token.input)) {
          throw new ArgInvalidOptionError(arg, token.input)
        }

        const parsed = await arg.parse(token.input, this.context, arg)
        argv.push(parsed)
        args[token.arg] = parsed
      } else if (!arg.ignoreStdin && !stdinRead) {
        let stdin = await readStdin()
        if (stdin) {
          stdin = stdin.trim()
          const parsed = await arg.parse(stdin, this.context, arg)
          argv.push(parsed)
          args[name] = parsed
        }

        stdinRead = true
      }

      if (!args[name] && (arg.default || arg.default === false)) {
        if (typeof arg.default === 'function') {
          const f = await arg.default()
          argv.push(f)
          args[name] = f
        } else {
          argv.push(arg.default)
          args[name] = arg.default
        }
      }
    }

    for (const token of tokens) {
      if (args[token.arg]) continue
      argv.push(token.input)
    }

    return {argv, args: args}
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
    const args = Object.keys(this.input.args)
    if (args.length > 0) {
      debug('available args: %s', args.join(' '))
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

    for (const k of Object.keys(this.input.args)) {
      this.input.args[k].name = k
    }
  }
}
