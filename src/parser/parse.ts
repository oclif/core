/* eslint-disable no-await-in-loop */
import {createInterface} from 'node:readline'

import {
  ArgParserContext,
  ArgToken,
  BooleanFlag,
  Flag,
  FlagParserContext,
  FlagToken,
  Metadata,
  MetadataFlag,
  OptionFlag,
  OutputArgs,
  OutputFlags,
  ParserContext,
  ParserInput,
  ParserOutput,
  ParsingToken,
} from '../interfaces/parser'
import {isTruthy, last, pickBy} from '../util/util'
import {ArgInvalidOptionError, CLIError, FailedFlagParsingError, FlagInvalidOptionError} from './errors'

let debug: any
try {
  debug =
    process.env.CLI_FLAGS_DEBUG === '1'
      ? require('debug')('../parser')
      : () => {
          // noop
        }
} catch {
  debug = () => {
    // noop
  }
}

const readStdin = async (): Promise<null | string> => {
  const {stdin, stdout} = process

  // process.stdin.isTTY is true whenever it's running in a terminal.
  // process.stdin.isTTY is undefined when it's running in a pipe, e.g. echo 'foo' | my-cli command
  // process.stdin.isTTY is undefined when it's running in a spawned process, even if there's no pipe.
  // This means that reading from stdin could hang indefinitely while waiting for a non-existent pipe.
  // Because of this, we have to set a timeout to prevent the process from hanging.

  if (stdin.isTTY) return null

  return new Promise((resolve) => {
    let result = ''
    const ac = new AbortController()
    const {signal} = ac
    const timeout = setTimeout(() => ac.abort(), 100)

    const rl = createInterface({
      input: stdin,
      output: stdout,
      terminal: false,
    })

    rl.on('line', (line) => {
      result += line
    })

    rl.once('close', () => {
      clearTimeout(timeout)
      debug('resolved from stdin', result)
      resolve(result)
    })

    signal.addEventListener(
      'abort',
      () => {
        debug('stdin aborted')
        clearTimeout(timeout)
        rl.close()
        resolve(null)
      },
      {once: true},
    )
  })
}

function isNegativeNumber(input: string): boolean {
  return /^-\d/g.test(input)
}

const validateOptions = (flag: OptionFlag<any>, input: string): string => {
  if (flag.options && !flag.options.includes(input)) throw new FlagInvalidOptionError(flag, input)
  return input
}

export class Parser<
  T extends ParserInput,
  TFlags extends OutputFlags<T['flags']>,
  BFlags extends OutputFlags<T['flags']>,
  TArgs extends OutputArgs<T['args']>,
> {
  private readonly argv: string[]

  private readonly booleanFlags: {[k: string]: BooleanFlag<any>}

  private readonly context: ParserContext
  private currentFlag?: OptionFlag<any>

  private readonly flagAliases: {[k: string]: BooleanFlag<any> | OptionFlag<any>}

  private readonly raw: ParsingToken[] = []

  constructor(private readonly input: T) {
    this.context = input.context ?? ({} as ParserContext)
    this.argv = [...input.argv]
    this._setNames()
    this.booleanFlags = pickBy(input.flags, (f) => f.type === 'boolean') as any
    this.flagAliases = Object.fromEntries(
      Object.values(input.flags).flatMap((flag) =>
        [...(flag.aliases ?? []), ...(flag.charAliases ?? [])].map((a) => [a, flag]),
      ),
    )
  }

  public async parse(): Promise<ParserOutput<TFlags, BFlags, TArgs>> {
    this._debugInput()

    const parseFlag = (arg: string): boolean => {
      const {isLong, name} = this.findFlag(arg)
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
        if (!flag.multiple && this.raw.some((o) => o.type === 'flag' && o.flag === name)) {
          throw new CLIError(`Flag --${name} can only be specified once`)
        }

        this.currentFlag = flag
        const input = isLong || arg.length < 3 ? this.argv.shift() : arg.slice(arg[2] === '=' ? 3 : 2)
        // if the value ends up being one of the command's flags, the user didn't provide an input
        if (typeof input !== 'string' || this.findFlag(input).name) {
          throw new CLIError(`Flag --${name} expects a value`)
        }

        this.raw.push({flag: flag.name, input, type: 'flag'})
      } else {
        this.raw.push({flag: flag.name, input: arg, type: 'flag'})
        // push the rest of the short characters back on the stack
        if (!isLong && arg.length > 2) {
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

      if (parsingFlags && this.currentFlag && this.currentFlag.multiple && !this.currentFlag.multipleNonGreedy) {
        this.raw.push({flag: this.currentFlag.name, input, type: 'flag'})
        continue
      }

      // not a flag, parse as arg
      const arg = Object.keys(this.input.args)[this._argTokens.length]
      this.raw.push({arg, input, type: 'arg'})
    }

    const [{args, argv}, {flags, metadata}] = await Promise.all([this._args(), this._flags()])
    this._debugOutput(argv, args, flags)

    const unsortedArgv = (dashdash ? [...argv, ...nonExistentFlags, '--'] : [...argv, ...nonExistentFlags]) as string[]

    return {
      args: args as TArgs,
      argv: unsortedArgv.sort((a, b) => originalArgv.indexOf(a) - originalArgv.indexOf(b)),
      flags,
      metadata,
      nonExistentFlags,
      raw: this.raw,
    }
  }

  private async _args(): Promise<{args: Record<string, unknown>; argv: unknown[]}> {
    const argv: unknown[] = []
    const args = {} as Record<string, unknown>
    const tokens = this._argTokens
    let stdinRead = false
    const ctx = this.context as ArgParserContext

    for (const [name, arg] of Object.entries(this.input.args)) {
      const token = tokens.find((t) => t.arg === name)
      ctx.token = token!

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

    return {args, argv}
  }

  private get _argTokens(): ArgToken[] {
    return this.raw.filter((o) => o.type === 'arg') as ArgToken[]
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
        .map((f) => `--${f}`)
        .join(' '),
    )
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

  private async _flags(): Promise<{
    flags: TFlags & BFlags & {json: boolean | undefined}
    metadata: Metadata
  }> {
    type ValueFunction = (fws: FlagWithStrategy, flags?: Record<string, string>) => Promise<any>

    const parseFlagOrThrowError = async (
      input: any,
      flag: BooleanFlag<any> | OptionFlag<any>,
      context: ParserContext | undefined,
      token?: FlagToken,
    ) => {
      if (!flag.parse) return input

      const ctx = {
        ...context,
        error: context?.error,
        exit: context?.exit,
        log: context?.log,
        logToStderr: context?.logToStderr,
        token,
        warn: context?.warn,
      } as FlagParserContext

      try {
        if (flag.type === 'boolean') {
          return await flag.parse(input, ctx, flag)
        }

        return await flag.parse(input, ctx, flag)
      } catch (error: any) {
        throw new FailedFlagParsingError({flag: flag.name, message: error.message})
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
        if (fws.inputFlag.flag.type === 'boolean' && last(fws.tokens)?.input) {
          return {
            ...fws,
            valueFunction: async (i) =>
              parseFlagOrThrowError(
                last(i.tokens)?.input !== `--no-${i.inputFlag.name}`,
                i.inputFlag.flag,
                this.context,
                last(i.tokens),
              ),
          }
        }

        // multiple with custom delimiter
        if (fws.inputFlag.flag.type === 'option' && fws.inputFlag.flag.delimiter && fws.inputFlag.flag.multiple) {
          return {
            ...fws,
            valueFunction: async (i) =>
              (
                await Promise.all(
                  (i.tokens ?? [])
                    .flatMap((token) => token.input.split((i.inputFlag.flag as OptionFlag<any>).delimiter ?? ','))
                    // trim, and remove surrounding doubleQuotes (which would hav been needed if the elements contain spaces)
                    .map((v) =>
                      v
                        .trim()
                        .replace(/^"(.*)"$/, '$1')
                        .replace(/^'(.*)'$/, '$1'),
                    )
                    .map(async (v) =>
                      parseFlagOrThrowError(v, i.inputFlag.flag, this.context, {
                        ...(last(i.tokens) as FlagToken),
                        input: v,
                      }),
                    ),
                )
              )
                // eslint-disable-next-line unicorn/no-await-expression-member
                .map((v) => validateOptions(i.inputFlag.flag as OptionFlag<any>, v)),
          }
        }

        // multiple in the oclif-core style
        if (fws.inputFlag.flag.type === 'option' && fws.inputFlag.flag.multiple) {
          return {
            ...fws,
            valueFunction: async (i: FlagWithStrategy) =>
              Promise.all(
                (fws.tokens ?? []).map((token) =>
                  parseFlagOrThrowError(
                    validateOptions(i.inputFlag.flag as OptionFlag<any>, token.input as string),
                    i.inputFlag.flag,
                    this.context,
                    token,
                  ),
                ),
              ),
          }
        }

        // simple option flag
        if (fws.inputFlag.flag.type === 'option') {
          return {
            ...fws,
            valueFunction: async (i: FlagWithStrategy) =>
              parseFlagOrThrowError(
                validateOptions(i.inputFlag.flag as OptionFlag<any>, last(fws.tokens)?.input as string),
                i.inputFlag.flag,
                this.context,
                last(fws.tokens),
              ),
          }
        }
      }

      // no input: env flags
      if (fws.inputFlag.flag.env && process.env[fws.inputFlag.flag.env]) {
        const valueFromEnv = process.env[fws.inputFlag.flag.env]
        if (fws.inputFlag.flag.type === 'option' && valueFromEnv) {
          return {
            ...fws,
            valueFunction: async (i: FlagWithStrategy) =>
              parseFlagOrThrowError(
                validateOptions(i.inputFlag.flag as OptionFlag<any>, valueFromEnv),
                i.inputFlag.flag,
                this.context,
              ),
          }
        }

        if (fws.inputFlag.flag.type === 'boolean') {
          return {
            ...fws,
            valueFunction: async (i: FlagWithStrategy) =>
              isTruthy(process.env[i.inputFlag.flag.env as string] ?? 'false'),
          }
        }
      }

      // no input, but flag has default value
      // eslint-disable-next-line no-constant-binary-expression, valid-typeof
      if (typeof fws.inputFlag.flag.default !== undefined) {
        return {
          ...fws,
          metadata: {setFromDefault: true},
          valueFunction:
            typeof fws.inputFlag.flag.default === 'function'
              ? (i: FlagWithStrategy, allFlags = {}) =>
                  fws.inputFlag.flag.default({flags: allFlags, options: i.inputFlag.flag})
              : async () => fws.inputFlag.flag.default,
        }
      }

      // base case (no value function)
      return fws
    }

    const addHelpFunction = (fws: FlagWithStrategy): FlagWithStrategy => {
      if (fws.inputFlag.flag.type === 'option' && fws.inputFlag.flag.defaultHelp) {
        return {
          ...fws,
          helpFunction:
            typeof fws.inputFlag.flag.defaultHelp === 'function'
              ? (i: FlagWithStrategy, flags: Record<string, string>, ...context) =>
                  // @ts-expect-error flag type isn't specific enough to know defaultHelp will definitely be there
                  i.inputFlag.flag.defaultHelp({flags, options: i.inputFlag}, ...context)
              : // @ts-expect-error flag type isn't specific enough to know defaultHelp will definitely be there
                (i: FlagWithStrategy) => i.inputFlag.flag.defaultHelp,
        }
      }

      return fws
    }

    const addDefaultHelp = async (fwsArray: FlagWithStrategy[]): Promise<FlagWithStrategy[]> => {
      const valueReferenceForHelp = fwsArrayToObject(flagsWithAllValues.filter((fws) => !fws.metadata?.setFromDefault))
      return Promise.all(
        fwsArray.map(async (fws) => {
          try {
            if (fws.helpFunction) {
              return {
                ...fws,
                metadata: {
                  ...fws.metadata,
                  defaultHelp: await fws.helpFunction?.(fws, valueReferenceForHelp, this.context),
                },
              }
            }
          } catch {
            // no-op
          }

          return fws
        }),
      )
    }

    const fwsArrayToObject = (fwsArray: FlagWithStrategy[]) =>
      Object.fromEntries(
        fwsArray.filter((fws) => fws.value !== undefined).map((fws) => [fws.inputFlag.name, fws.value]),
      ) as TFlags & BFlags & {json: boolean | undefined}

    type FlagWithStrategy = {
      helpFunction?: (fws: FlagWithStrategy, flags: Record<string, string>, ...args: any) => Promise<string | undefined>
      inputFlag: {
        flag: Flag<any>
        name: string
      }
      metadata?: MetadataFlag
      tokens?: FlagToken[]
      value?: any
      valueFunction?: ValueFunction
    }

    const flagTokenMap = this.mapAndValidateFlags()
    const flagsWithValues = await Promise.all(
      Object.entries(this.input.flags)
        // we check them if they have a token, or might have env, default, or defaultHelp.  Also include booleans so they get their default value
        .filter(
          ([name, flag]) =>
            flag.type === 'boolean' ||
            flag.env ||
            flag.default !== undefined ||
            'defaultHelp' in flag ||
            flagTokenMap.has(name),
        )
        // match each possible flag to its token, if there is one
        .map(([name, flag]): FlagWithStrategy => ({inputFlag: {flag, name}, tokens: flagTokenMap.get(name)}))
        .map((fws) => addValueFunction(fws))
        .filter((fws) => fws.valueFunction !== undefined)
        .map((fws) => addHelpFunction(fws))
        // we can't apply the default values until all the other flags are resolved because `flag.default` can reference other flags
        .map(async (fws) => (fws.metadata?.setFromDefault ? fws : {...fws, value: await fws.valueFunction?.(fws)})),
    )

    const valueReference = fwsArrayToObject(flagsWithValues.filter((fws) => !fws.metadata?.setFromDefault))

    const flagsWithAllValues = await Promise.all(
      flagsWithValues.map(async (fws) =>
        fws.metadata?.setFromDefault ? {...fws, value: await fws.valueFunction?.(fws, valueReference)} : fws,
      ),
    )

    const finalFlags = flagsWithAllValues.some((fws) => typeof fws.helpFunction === 'function')
      ? await addDefaultHelp(flagsWithAllValues)
      : flagsWithAllValues

    return {
      flags: fwsArrayToObject(finalFlags),
      metadata: {
        flags: Object.fromEntries(
          finalFlags.filter((fws) => fws.metadata).map((fws) => [fws.inputFlag.name, fws.metadata as MetadataFlag]),
        ),
      },
    }
  }

  private _setNames() {
    for (const k of Object.keys(this.input.flags)) {
      this.input.flags[k].name = k
    }

    for (const k of Object.keys(this.input.args)) {
      this.input.args[k].name = k
    }
  }

  private findFlag(arg: string): {isLong: boolean; name?: string} {
    const isLong = arg.startsWith('--')
    const short = isLong ? false : arg.startsWith('-')
    const name = isLong ? this.findLongFlag(arg) : short ? this.findShortFlag(arg) : undefined
    return {isLong, name}
  }

  private findLongFlag(arg: string): string | undefined {
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

  private findShortFlag([_, char]: string): string | undefined {
    if (this.flagAliases[char]) {
      return this.flagAliases[char].name
    }

    return Object.keys(this.input.flags).find(
      (k) => this.input.flags[k].char === char && char !== undefined && this.input.flags[k].char !== undefined,
    )
  }

  private mapAndValidateFlags(): Map<string, FlagToken[]> {
    const flagTokenMap = new Map<string, FlagToken[]>()
    for (const token of this.raw.filter((o) => o.type === 'flag') as FlagToken[]) {
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
