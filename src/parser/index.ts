import {ArgInput, FlagInput, Input, OutputArgs, OutputFlags, ParserOutput} from '../interfaces/parser'
import {Parser} from './parse'
import {validate} from './validate'

export {flagUsages} from './help'

export async function parse<TFlags extends OutputFlags<any>, TArgs extends OutputArgs<any>>(
  argv: string[],
  options: Input<TFlags, TArgs>,
): Promise<ParserOutput<TFlags, TArgs>> {
  const input = {
    '--': options['--'],
    args: (options.args ?? {}) as ArgInput<any>,
    argv,
    context: options.context,
    flags: (options.flags ?? {}) as FlagInput<any>,
    strict: options.strict !== false,
  }
  const parser = new Parser(input)
  const output = await parser.parse()
  await validate({input, output})
  return output as ParserOutput<TFlags, TArgs>
}
