/**
 * This test file contains no unit tests but we use the tsd package to ensure that the types are valid when the tests are compiled
 */
import {URL} from 'node:url'
import {expectNotType, expectType} from 'tsd'

import {Args, Command, Interfaces} from '../../src'

type MyArgs = Interfaces.InferredArgs<typeof MyCommand.args>

type MyType = {
  foo: boolean
}

class MyCommand extends Command {
  static args = {
    requiredString: Args.string({required: true}),
    optionalString: Args.string(),
    defaultString: Args.string({default: 'default'}),

    requiredBoolean: Args.boolean({required: true}),
    optionalBoolean: Args.boolean(),
    defaultBoolean: Args.boolean({default: true}),

    optionalInteger: Args.integer(),
    requiredInteger: Args.integer({required: true}),
    defaultInteger: Args.integer({default: 1}),

    optionalDirectory: Args.directory(),
    requiredDirectory: Args.directory({required: true}),
    defaultDirectory: Args.directory({default: 'my-dir'}),

    optionalFile: Args.file(),
    requiredFile: Args.file({required: true}),
    defaultFile: Args.file({default: 'my-file.json'}),

    optionalUrl: Args.url(),
    requiredUrl: Args.url({required: true}),
    defaultUrl: Args.url({default: new URL('http://example.com')}),

    optionalCustom: Args.custom<MyType>({
      parse: async () => ({foo: true}),
    })(),
    requiredCustom: Args.custom<MyType>({
      parse: async () => ({foo: true}),
    })({required: true}),
    defaultCustom: Args.custom<MyType>({
      parse: async () => ({foo: true}),
    })({default: {foo: true}}),
  }

  static description = 'describe the command here'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public args!: MyArgs

  public async run(): Promise<MyArgs> {
    const result = await this.parse(MyCommand)
    this.args = result.args
    expectType<MyArgs>(this.args)

    expectType<string>(this.args.requiredString)
    expectNotType<undefined>(this.args.requiredString)

    expectType<string>(this.args.defaultString)
    expectNotType<undefined>(this.args.defaultString)

    expectType<string | undefined>(this.args.optionalString)

    expectType<boolean>(this.args.requiredBoolean)
    expectNotType<undefined>(this.args.requiredBoolean)
    expectType<boolean>(this.args.defaultBoolean)
    expectNotType<undefined>(this.args.defaultBoolean)
    expectType<boolean | undefined>(this.args.optionalBoolean)

    expectType<number>(this.args.requiredInteger)
    expectNotType<undefined>(this.args.requiredInteger)
    expectType<number>(this.args.defaultInteger)
    expectNotType<undefined>(this.args.defaultInteger)
    expectType<number | undefined>(this.args.optionalInteger)

    expectType<string>(this.args.requiredDirectory)
    expectNotType<undefined>(this.args.requiredDirectory)
    expectType<string>(this.args.defaultDirectory)
    expectNotType<undefined>(this.args.defaultDirectory)
    expectType<string | undefined>(this.args.optionalDirectory)

    expectType<string>(this.args.requiredFile)
    expectNotType<undefined>(this.args.requiredFile)
    expectType<string>(this.args.defaultFile)
    expectNotType<undefined>(this.args.defaultFile)
    expectType<string | undefined>(this.args.optionalFile)

    expectType<URL>(this.args.requiredUrl)
    expectNotType<undefined>(this.args.requiredUrl)
    expectType<URL>(this.args.defaultUrl)
    expectNotType<undefined>(this.args.defaultUrl)
    expectType<URL | undefined>(this.args.optionalUrl)

    expectType<MyType>(this.args.requiredCustom)
    expectNotType<undefined>(this.args.requiredCustom)
    expectType<MyType>(this.args.defaultCustom)
    expectNotType<undefined>(this.args.defaultCustom)
    expectType<MyType | undefined>(this.args.optionalCustom)

    return result.args
  }
}
