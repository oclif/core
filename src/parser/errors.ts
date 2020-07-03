import {CLIError} from '../errors'

import {Arg} from './args'
import Deps from './deps'
import * as flags from './flags'
import * as Help from './help'
import * as List from './list'
import {ParserInput, ParserOutput} from './parse'

export {CLIError} from '../errors'

// eslint-disable-next-line new-cap
const m = Deps()
// eslint-disable-next-line node/no-missing-require
.add('help', () => require('./help') as typeof Help)
// eslint-disable-next-line node/no-missing-require
.add('list', () => require('./list') as typeof List)

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ICLIParseErrorOptions {
  parse: {
    input?: ParserInput;
    output?: ParserOutput<any, any>;
  };
}

export class CLIParseError extends CLIError {
  public parse: ICLIParseErrorOptions['parse']

  constructor(options: ICLIParseErrorOptions & { message: string }) {
    options.message += '\nSee more help with --help'
    super(options.message)
    this.parse = options.parse
  }
}

export class InvalidArgsSpecError extends CLIParseError {
  public args: Arg<any>[]

  constructor({args, parse}: ICLIParseErrorOptions & { args: Arg<any>[] }) {
    let message = 'Invalid argument spec'
    const namedArgs = args.filter(a => a.name)
    if (namedArgs.length > 0) {
      const list = m.list.renderList(namedArgs.map(a => [`${a.name} (${a.required ? 'required' : 'optional'})`, a.description] as [string, string]))
      message += `:\n${list}`
    }
    super({parse, message})
    this.args = args
  }
}

export class RequiredArgsError extends CLIParseError {
  public args: Arg<any>[]

  constructor({args, parse}: ICLIParseErrorOptions & { args: Arg<any>[] }) {
    let message = `Missing ${args.length} required arg${args.length === 1 ? '' : 's'}`
    const namedArgs = args.filter(a => a.name)
    if (namedArgs.length > 0) {
      const list = m.list.renderList(namedArgs.map(a => [a.name, a.description] as [string, string]))
      message += `:\n${list}`
    }
    super({parse, message})
    this.args = args
  }
}

export class RequiredFlagError extends CLIParseError {
  public flag: flags.IFlag<any>

  constructor({flag, parse}: ICLIParseErrorOptions & { flag: flags.IFlag<any> }) {
    const usage = m.list.renderList(m.help.flagUsages([flag], {displayRequired: false}))
    const message = `Missing required flag:\n${usage}`
    super({parse, message})
    this.flag = flag
  }
}

export class UnexpectedArgsError extends CLIParseError {
  public args: string[]

  constructor({parse, args}: ICLIParseErrorOptions & { args: string[] }) {
    const message = `Unexpected argument${args.length === 1 ? '' : 's'}: ${args.join(', ')}`
    super({parse, message})
    this.args = args
  }
}

export class FlagInvalidOptionError extends CLIParseError {
  constructor(flag: flags.IOptionFlag<any>, input: string) {
    const message = `Expected --${flag.name}=${input} to be one of: ${flag.options!.join(', ')}`
    super({parse: {}, message})
  }
}

export class ArgInvalidOptionError extends CLIParseError {
  constructor(arg: Arg<any>, input: string) {
    const message = `Expected ${input} to be one of: ${arg.options!.join(', ')}`
    super({parse: {}, message})
  }
}
