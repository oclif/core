import * as args from './args'
import {Parser} from './parse'
import {FlagInput, Input, ParserOutput, OutputFlags, FlagOutput} from '../interfaces'
import {validate} from './validate'
export {args}
export {flagUsages} from './help'

// TODO: why dont TFlags and GFlags extend the same type?
export async function parse<TFlags extends OutputFlags<any>, GFlags extends FlagOutput, TArgs extends { [name: string]: string }>(argv: string[], options: Input<TFlags, GFlags>): Promise<ParserOutput<TFlags, GFlags, TArgs>> {
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
  // TODO: why is this cast needed?
  return output as ParserOutput<TFlags, GFlags, TArgs>
}

