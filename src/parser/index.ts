import * as args from './args'
import {Parser} from './parse'
import {FlagInput, Input, ParserOutput, OutputFlags, OutputArgs} from '../interfaces'
import {validate} from './validate'
export {args}
export {flagUsages} from './help'

export async function parse<TFlags extends OutputFlags<any>, BFlags extends OutputFlags<any>, TArgs extends OutputArgs>(argv: string[], options: Input<TFlags, BFlags>): Promise<ParserOutput<TFlags, BFlags, TArgs>> {
  const input = {
    argv,
    context: options.context,
    args: (options.args || []).map((a: any) => args.newArg(a as any)),
    '--': options['--'],
    flags: (options.flags ?? {}) as FlagInput<any>,
    strict: options.strict !== false,
  }
  const parser = new Parser(input)
  const output = await parser.parse()
  await validate({input, output})
  return output as ParserOutput<TFlags, BFlags, TArgs>
}

