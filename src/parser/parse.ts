/* eslint-disable no-await-in-loop */
import {ArgInvalidOptionError, CLIError, FlagInvalidOptionError} from './errors'
import {ArgToken, BooleanFlag, CompletableFlag, FlagToken, Metadata, MetadataFlag, OptionFlag, OutputArgs, OutputFlags, ParserInput, ParserOutput, ParsingToken} from '../interfaces/parser'
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

  private currentFlag?: OptionFlag<any>

  constructor(private readonly input: T) {
    this.context = input.context || {}
    this.argv = [...input.argv]
    this._setNames()
    this.booleanFlags = pickBy(input.flags, f => f.type === 'boolean') as any
    this.flagAliases = Object.fromEntries(Object.values(input.flags).flatMap(flag => {
      return (flag.aliases ?? []).map(a => [a, flag])
    }))
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

    const [{argv, args}, {flags, metadata}] = await Promise.all([this._args(), this._flags()])
    this._debugOutput(argv, args, flags)

    const unsortedArgv = (dashdash ? [...argv, ...nonExistentFlags, '--'] : [...argv, ...nonExistentFlags]) as string[]

    return {
      argv: unsortedArgv.sort((a, b) => originalArgv.indexOf(a) - originalArgv.indexOf(b)),
      flags,
      args: args as TArgs,
      raw: this.raw,
      metadata,
      nonExistentFlags,
    }
  }

  private async _flags(): Promise<{
    flags: TFlags & BFlags & { json: boolean | undefined }, metadata: Metadata
  }> {
    type ValueFunction = (fws: FlagWithStrategy, flags?: Record<string, string>) => Promise<any>

    const validateOptions = (flag: OptionFlag<any>, input: string): string =>  {
      if (flag.options && !flag.options.includes(input))
        throw new FlagInvalidOptionError(flag, input)
      return input
    }

    const parseFlagOrThrowError = async (input: any, flag: BooleanFlag<any> | OptionFlag<any>, token?: FlagToken, context: typeof this.context = {}) => {
      if (!flag.parse) return input

      try {
        if (flag.type === 'boolean') {
          return await flag.parse(input, {...context, token}, flag)
        }

        return await flag.parse(input, {...context, token}, flag)
      } catch (error: any) {
        error.message = `Parsing --${flag.name} \n\t${error.message}\nSee more help with --help`
        throw error
      }
    }

    /* Could add a valueFunction (if there is a value/env/default) and could metadata.
    *  Value function can be resolved later.
    */
    const addValueFunction = (fws: FlagWithStrategy): FlagWithStrategy => {
      const tokenLength = fws.tokens?.length
      // user provided some input
      if (tokenLength) {
        // boolean
        if (fws.inputFlag.flag.type === 'boolean' && fws.tokens?.at(-1)?.input) {
          return {...fws, valueFunction: async (i: FlagWithStrategy) => parseFlagOrThrowError(i.tokens?.at(-1)?.input !== `--no-${i.inputFlag.name}`, i.inputFlag.flag, i.tokens?.at(-1), this.context)}
        }

        // multiple with custom delimiter
        if (fws.inputFlag.flag.type === 'option' && fws.inputFlag.flag.delimiter && fws.inputFlag.flag.multiple) {
          return {
            ...fws, valueFunction: async (i: FlagWithStrategy) => (await Promise.all(
              ((i.tokens ?? []).flatMap(token => (token.input as string).split(i.inputFlag.flag.delimiter as string)))
              // trim, and remove surrounding doubleQuotes (which would hav been needed if the elements contain spaces)
              .map(v => v.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'))
              .map(async v => parseFlagOrThrowError(v, i.inputFlag.flag, {...i.tokens?.at(-1) as FlagToken, input: v}, this.context)),
            )).map(v => validateOptions(i.inputFlag.flag as OptionFlag<any>, v)),
          }
        }

        // multiple in the oclif-core style
        if (fws.inputFlag.flag.type === 'option' && fws.inputFlag.flag.multiple) {
          return {...fws, valueFunction: async (i: FlagWithStrategy) => Promise.all((fws.tokens ?? []).map(token => parseFlagOrThrowError(validateOptions(i.inputFlag.flag as OptionFlag<any>, token.input as string), i.inputFlag.flag, token, this.context)))}
        }

        // simple option flag
        if (fws.inputFlag.flag.type === 'option') {
          return {...fws, valueFunction: async (i: FlagWithStrategy) => parseFlagOrThrowError(validateOptions(i.inputFlag.flag as OptionFlag<any>, fws.tokens?.at(-1)?.input as string), i.inputFlag.flag, fws.tokens?.at(-1), this.context)}
        }
      }

      // no input: env flags
      if (fws.inputFlag.flag.env && process.env[fws.inputFlag.flag.env]) {
        const valueFromEnv = process.env[fws.inputFlag.flag.env]
        if (fws.inputFlag.flag.type === 'option' && typeof valueFromEnv === 'string') {
          return {...fws, valueFunction: async (i: FlagWithStrategy) => parseFlagOrThrowError(validateOptions(i.inputFlag.flag as OptionFlag<any>, valueFromEnv), i.inputFlag.flag, this.context)}
        }

        if (fws.inputFlag.flag.type === 'boolean') {
          return {...fws, valueFunction: async (i: FlagWithStrategy) => Promise.resolve(isTruthy(process.env[i.inputFlag.flag.env as string] ?? 'false'))}
        }
      }

      // no input, but flag has default value
      if (typeof fws.inputFlag.flag.default !== undefined) {
        return {
          ...fws, metadata: {setFromDefault: true},
          valueFunction: typeof fws.inputFlag.flag.default === 'function' ?
            (i: FlagWithStrategy, allFlags = {}) => fws.inputFlag.flag.default({options: i.inputFlag.flag, flags: allFlags}) :
            async () => fws.inputFlag.flag.default,
        }
      }

      // base case (no value function)
      return fws
    }

    const addHelpFunction = (fws: FlagWithStrategy): FlagWithStrategy => {
      if (fws.inputFlag.flag.type === 'option' && fws.inputFlag.flag.defaultHelp) {
        return {
          ...fws, helpFunction: typeof fws.inputFlag.flag.defaultHelp === 'function' ?
            // @ts-expect-error flag type isn't specific enough to know defaultHelp will definitely be there
            (i: FlagWithStrategy, flags: Record<string, string>, ...context) => i.inputFlag.flag.defaultHelp({options: i.inputFlag, flags}, ...context) :
            // @ts-expect-error flag type isn't specific enough to know defaultHelp will definitely be there
            (i: FlagWithStrategy) => i.inputFlag.flag.defaultHelp,
        }
      }

      return fws
    }

    const addDefaultHelp = async (fws: FlagWithStrategy[]): Promise<FlagWithStrategy[]> => {
      const valueReferenceForHelp = fwsArrayToObject(flagsWithAllValues.filter(fws => !fws.metadata?.setFromDefault))
      return Promise.all(fws.map(async fws => fws.helpFunction ? ({...fws, metadata: {...fws.metadata, defaultHelp: await fws.helpFunction?.(fws, valueReferenceForHelp, this.context)}}) : fws))
    }

    const fwsArrayToObject = (fwsArray: FlagWithStrategy[]) => Object.fromEntries(fwsArray.map(fws => [fws.inputFlag.name, fws.value]))

    type FlagWithStrategy = {
      inputFlag: {
        name: string,
        flag: CompletableFlag<any>
      }
      tokens?: FlagToken[],
      valueFunction?: ValueFunction;
      helpFunction?: (fws: FlagWithStrategy, flags: Record<string, string>, ...args: any) => Promise<string | undefined>;
      metadata?: MetadataFlag
      value?: any;
    }

    const flagTokenMap = this.mapAndValidateFlags()

    const flagsWithValues = await Promise.all(Object.entries(this.input.flags)
    // we check them if they have a token, or might have env, default, or defaultHelp.  Also include booleans so they get their default value
    .filter(([name, flag]) => flag.type === 'boolean' || flag.env || flag.default || 'defaultHelp' in flag || flagTokenMap.has(name))
    // match each possible flag to its token, if there is one
    .map(([name, flag]): FlagWithStrategy => ({inputFlag: {name, flag}, tokens: flagTokenMap.get(name)}))
    .map(fws => addValueFunction(fws))
    .filter(fws => fws.valueFunction !== undefined)
    .map(fws => addHelpFunction(fws))
    // we can't apply the default values until all the other flags are resolved because `flag.default` can reference other flags
    .map(async fws => (fws.metadata?.setFromDefault ? fws : {...fws, value: await fws.valueFunction?.(fws)})))

    const valueReference = fwsArrayToObject(flagsWithValues.filter(fws => !fws.metadata?.setFromDefault))

    const flagsWithAllValues = await Promise.all(flagsWithValues
    .map(async fws => (fws.metadata?.setFromDefault ? {...fws, value: await fws.valueFunction?.(fws, valueReference)} : fws)))

    const finalFlags = (flagsWithAllValues.some(fws => typeof fws.helpFunction === 'function')) ? await addDefaultHelp(flagsWithAllValues) : flagsWithAllValues

    return {
      // @ts-ignore original version returned an any.  Not sure how to get to the return type for `flags` prop
      flags: fwsArrayToObject(finalFlags),
      metadata: {flags: Object.fromEntries(finalFlags.filter(fws => fws.metadata).map(fws => [fws.inputFlag.name, fws.metadata as MetadataFlag]))},
    }
  }

  private async _args(): Promise<{ argv: unknown[]; args: Record<string, unknown> }> {
    const argv: unknown[] = []
    const args = {} as Record<string, unknown>
    const tokens = this._argTokens
    let stdinRead = false
    const ctx = this.context

    for (const [name, arg] of Object.entries(this.input.args)) {
      const token = tokens.find(t => t.arg === name)
      ctx.token = token
      if (token) {
        if (arg.options && !arg.options.includes(token.input)) {
          throw new ArgInvalidOptionError(arg, token.input)
        }

        const parsed = await arg.parse(token.input, ctx, arg)
        argv.push(parsed)
        args[token.arg] = parsed
      } else if (!arg.ignoreStdin && !stdinRead) {
        let stdin = await readStdin()
        if (stdin) {
          stdin = stdin.trim()
          const parsed = await arg.parse(stdin, ctx, arg)
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

  private _setNames() {
    for (const k of Object.keys(this.input.flags)) {
      this.input.flags[k].name = k
    }

    for (const k of Object.keys(this.input.args)) {
      this.input.args[k].name = k
    }
  }

  private mapAndValidateFlags(): Map<string, FlagToken[]>  {
    const flagTokenMap = new Map<string, FlagToken[]>()
    for (const token of (this.raw.filter(o => o.type === 'flag') as FlagToken[])) {
      // fail fast if there are any invalid flags
      if (!(token.flag in this.input.flags)) {
        throw new CLIError(`Unexpected flag ${token.flag}`)
      }

      const existing = flagTokenMap.get(token.flag) ?? []
      flagTokenMap.set(token.flag, [...existing, token])
    }

    return flagTokenMap
  }
}
