import chalk from 'chalk'

import Cache from '../cache'
import {renderList} from '../cli-ux/list'
import {CLIError} from '../errors'
import {Flag, OptionFlag} from '../interfaces'
import {Arg, ArgInput, CLIParseErrorOptions} from '../interfaces/parser'
import {uniq} from '../util/util'
import {flagUsages} from './help'

export {CLIError} from '../errors'

export type Validation = {
  name: string
  reason?: string
  status: 'failed' | 'success'
  validationFn: string
}

export class CLIParseError extends CLIError {
  public parse: CLIParseErrorOptions['parse']

  constructor(options: CLIParseErrorOptions & {message: string}) {
    options.message += '\nSee more help with --help'
    super(options.message, {exit: options.exit})
    this.parse = options.parse
  }
}

export class InvalidArgsSpecError extends CLIParseError {
  public args: ArgInput

  constructor({args, exit, parse}: CLIParseErrorOptions & {args: ArgInput}) {
    let message = 'Invalid argument spec'
    const namedArgs = Object.values(args).filter((a) => a.name)
    if (namedArgs.length > 0) {
      const list = renderList(
        namedArgs.map(
          (a) => [`${a.name} (${a.required ? 'required' : 'optional'})`, a.description] as [string, string],
        ),
      )
      message += `:\n${list}`
    }

    super({exit: Cache.getInstance().get('exitCodes')?.invalidArgsSpec ?? exit, message, parse})
    this.args = args
  }
}

export class RequiredArgsError extends CLIParseError {
  public args: Arg<any>[]

  constructor({
    args,
    exit,
    flagsWithMultiple,
    parse,
  }: CLIParseErrorOptions & {args: Arg<any>[]; flagsWithMultiple?: string[]}) {
    let message = `Missing ${args.length} required arg${args.length === 1 ? '' : 's'}`
    const namedArgs = args.filter((a) => a.name)
    if (namedArgs.length > 0) {
      const list = renderList(namedArgs.map((a) => [a.name, a.description] as [string, string]))
      message += `:\n${list}`
    }

    if (flagsWithMultiple?.length) {
      const flags = flagsWithMultiple.map((f) => `--${f}`).join(', ')
      message += `\n\nNote: ${flags} allow${
        flagsWithMultiple.length === 1 ? 's' : ''
      } multiple values. Because of this you need to provide all arguments before providing ${
        flagsWithMultiple.length === 1 ? 'that flag' : 'those flags'
      }.`
      message += '\nAlternatively, you can use "--" to signify the end of the flags and the beginning of arguments.'
    }

    super({exit: Cache.getInstance().get('exitCodes')?.requiredArgs ?? exit, message, parse})
    this.args = args
  }
}

export class RequiredFlagError extends CLIParseError {
  public flag: Flag<any>

  constructor({exit, flag, parse}: CLIParseErrorOptions & {flag: Flag<any>}) {
    const usage = renderList(flagUsages([flag], {displayRequired: false}))
    const message = `Missing required flag:\n${usage}`
    super({exit, message, parse})
    super({exit: Cache.getInstance().get('exitCodes')?.requiredFlags ?? exit, message, parse})
    this.flag = flag
  }
}

export class UnexpectedArgsError extends CLIParseError {
  public args: unknown[]

  constructor({args, exit, parse}: CLIParseErrorOptions & {args: unknown[]}) {
    const message = `Unexpected argument${args.length === 1 ? '' : 's'}: ${args.join(', ')}`
    super({exit: Cache.getInstance().get('exitCodes')?.unexpectedArgs ?? exit, message, parse})
    this.args = args
  }
}

export class NonExistentFlagsError extends CLIParseError {
  public flags: string[]

  constructor({exit, flags, parse}: CLIParseErrorOptions & {flags: string[]}) {
    const message = `Nonexistent flag${flags.length === 1 ? '' : 's'}: ${flags.join(', ')}`
    super({exit: Cache.getInstance().get('exitCodes')?.nonExistentFlag ?? exit, message, parse})
    this.flags = flags
  }
}

export class FlagInvalidOptionError extends CLIParseError {
  constructor(flag: OptionFlag<any>, input: string) {
    const message = `Expected --${flag.name}=${input} to be one of: ${flag.options!.join(', ')}`
    super({message, parse: {}})
  }
}

export class ArgInvalidOptionError extends CLIParseError {
  constructor(arg: Arg<any>, input: string) {
    const message = `Expected ${input} to be one of: ${arg.options!.join(', ')}`
    super({message, parse: {}})
  }
}

export class FailedFlagValidationError extends CLIParseError {
  constructor({exit, failed, parse}: CLIParseErrorOptions & {failed: Validation[]}) {
    const reasons = failed.map((r) => r.reason)
    const deduped = uniq(reasons)
    const errString = deduped.length === 1 ? 'error' : 'errors'
    const message = `The following ${errString} occurred:\n  ${chalk.dim(deduped.join('\n  '))}`
    super({exit: Cache.getInstance().get('exitCodes')?.failedFlagValidation ?? exit, message, parse})
  }
}
