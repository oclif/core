import * as args from './args'
import Deps from './deps'
import * as flags from './flags'
import {Parser} from './parse'
import {FlagInput, Input, ParserOutput, OutputFlags, FlagOutput} from '../interfaces'
import * as Validate from './validate'
export {args}
export {flags}
export {flagUsages} from './help'

// eslint-disable-next-line new-cap
const m = Deps()
// eslint-disable-next-line node/no-missing-require
.add('validate', () => require('./validate').validate as typeof Validate.validate)

export async function parse<TFlags extends OutputFlags<any>, GFlags extends FlagOutput, TArgs extends { [name: string]: string }>(argv: string[], options: Input<TFlags, GFlags>): Promise<ParserOutput<TFlags, GFlags, TArgs>> {
  const input = {
    argv,
    context: options.context,
    args: (options.args || []).map((a: any) => args.newArg(a as any)),
    '--': options['--'],
    flags: {
      color: flags.defaultFlags.color,
      ...options.flags,
    } as FlagInput<any>,
    strict: options.strict !== false,
  }
  const parser = new Parser(input)
  const output = await parser.parse()
  await m.validate({input, output})
  return output as ParserOutput<TFlags, GFlags, TArgs>
}

export {boolean, integer, url, directory, file, string, build, option, custom} from './flags'
