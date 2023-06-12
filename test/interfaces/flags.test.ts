/**
 * This test file contains no unit tests but we use the tsd package to ensure that the types are valid when the tests are compiled
 */

import {Command, Flags, Interfaces} from '../../src'
import {expectType, expectNotType} from 'tsd'
import {URL} from 'url'

abstract class BaseCommand extends Command {
  static enableJsonFlag = true

  static baseFlags = {
    optionalGlobalFlag: Flags.string(),
    requiredGlobalFlag: Flags.string({required: true}),
    defaultGlobalFlag: Flags.string({default: 'default'}),
  }
}

type MyFlags = Interfaces.InferredFlags<typeof MyCommand.flags & typeof MyCommand.baseFlags>

type MyType = {
  foo: boolean;
}

export const customFlagWithRequiredProp = Flags.custom<number, {unit: 'minutes' | 'seconds'}>({
  parse: async (input, _, opts) => {
    const value = opts.unit === 'minutes' ? new Date(input).getMinutes() : new Date(input).getSeconds()
    return Promise.resolve(value)
  },
  default: async _ctx => Promise.resolve(_ctx.options.unit === 'minutes' ? 1 : 2),
  defaultHelp: async _ctx => Promise.resolve(_ctx.options.unit === 'minutes' ? '1 minute' : '2 seconds'),
  char: 'c',
})

export const arrayFlag = Flags.custom<string[]>({
  delimiter: ',',
  multiple: true,
})

class MyCommand extends BaseCommand {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    requiredString: Flags.string({required: true}),
    optionalString: Flags.string(),
    defaultString: Flags.string({default: 'default'}),

    requiredMultiString: Flags.string({required: true, multiple: true}),
    optionalMultiString: Flags.string({multiple: true}),
    defaultMultiString: Flags.string({
      multiple: true,
      default: ['default'],
      defaultHelp: async _ctx => Promise.resolve('defaultHelp'),
    }),

    requiredBoolean: Flags.boolean({required: true}),
    optionalBoolean: Flags.boolean(),
    defaultBoolean: Flags.boolean({default: true}),

    optionalInteger: Flags.integer(),
    requiredInteger: Flags.integer({required: true}),
    defaultInteger: Flags.integer({default: 1}),

    optionalMultiInteger: Flags.integer({multiple: true}),
    requiredMultiInteger: Flags.integer({multiple: true, required: true}),
    defaultMultiInteger: Flags.integer({multiple: true, default: [1]}),

    optionalDirectory: Flags.directory(),
    requiredDirectory: Flags.directory({required: true}),
    defaultDirectory: Flags.directory({default: 'my-dir'}),

    optionalMultiDirectory: Flags.directory({multiple: true}),
    requiredMultiDirectory: Flags.directory({multiple: true, required: true}),
    defaultMultiDirectory: Flags.directory({multiple: true, default: ['my-dir']}),

    optionalFile: Flags.file(),
    requiredFile: Flags.file({required: true}),
    defaultFile: Flags.file({default: 'my-file.json'}),

    optionalMultiFile: Flags.file({multiple: true}),
    requiredMultiFile: Flags.file({multiple: true, required: true}),
    defaultMultiFile: Flags.file({multiple: true, default: ['my-file.json']}),

    optionalUrl: Flags.url(),
    requiredUrl: Flags.url({required: true}),
    defaultUrl: Flags.url({
      default: new URL('http://example.com'),
      defaultHelp: async _ctx => Promise.resolve('Example URL'),
    }),

    optionalMultiUrl: Flags.url({multiple: true}),
    requiredMultiUrl: Flags.url({multiple: true, required: true}),
    defaultMultiUrl: Flags.url({multiple: true, default: [new URL('http://example.com')]}),

    optionalCustom: Flags.custom<MyType>({
      parse: async () => Promise.resolve({foo: true}),
    })(),
    requiredCustom: Flags.custom<MyType>({
      parse: async () => Promise.resolve({foo: true}),
    })({required: true}),
    defaultCustom: Flags.custom<MyType>({
      parse: async () => Promise.resolve({foo: true}),
      default: async _ctx => Promise.resolve({foo: true}),
    })({default: {foo: true}}),

    optionalMultiCustom: Flags.custom<MyType>({
      parse: async () => Promise.resolve({foo: true}),
    })({multiple: true}),
    requiredMultiCustom: Flags.custom<MyType>({
      parse: async () => Promise.resolve({foo: true}),
    })({required: true, multiple: true}),
    defaultMultiCustom: Flags.custom<MyType>({
      parse: async () => Promise.resolve({foo: true}),
    })({default: [{foo: true}], multiple: true}),

    optionalCustomFlagWithRequiredProp: customFlagWithRequiredProp({unit: 'minutes'}),
    requiredCustomFlagWithRequiredProp: customFlagWithRequiredProp({unit: 'minutes', required: true}),
    defaultCustomFlagWithRequiredProp: customFlagWithRequiredProp({unit: 'minutes', default: 23}),

    optionalArrayFlag: arrayFlag(),
    requiredArrayFlag: arrayFlag({required: true}),
    defaultArrayFlag: arrayFlag({default: ['foo', 'bar']}),
  }

  public static '--' = true

  public flags!: MyFlags

  public async run(): Promise<MyFlags> {
    const result = await this.parse(MyCommand)
    this.flags = result.flags
    expectType<MyFlags>(this.flags)

    expectType<string>(this.flags.requiredGlobalFlag)
    expectNotType<undefined>(this.flags.requiredGlobalFlag)
    expectType<string>(this.flags.defaultGlobalFlag)
    expectNotType<undefined>(this.flags.defaultGlobalFlag)
    expectType<string | undefined>(this.flags.optionalGlobalFlag)

    expectType<string>(this.flags.requiredString)
    expectNotType<undefined>(this.flags.requiredString)

    expectType<string>(this.flags.defaultString)
    expectNotType<undefined>(this.flags.defaultString)

    expectType<string | undefined>(this.flags.optionalString)

    expectType<string[]>(this.flags.requiredMultiString)
    expectNotType<undefined>(this.flags.requiredMultiString)

    expectType<string[] | undefined>(this.flags.optionalMultiString)
    expectType<string[]>(this.flags.defaultMultiString)
    expectNotType<undefined>(this.flags.defaultMultiString)

    expectType<boolean>(this.flags.requiredBoolean)
    expectNotType<undefined>(this.flags.requiredBoolean)
    expectType<boolean>(this.flags.defaultBoolean)
    expectNotType<undefined>(this.flags.defaultBoolean)
    expectType<boolean | undefined>(this.flags.optionalBoolean)

    expectType<number>(this.flags.requiredInteger)
    expectNotType<undefined>(this.flags.requiredInteger)
    expectType<number>(this.flags.defaultInteger)
    expectNotType<undefined>(this.flags.defaultInteger)
    expectType<number | undefined>(this.flags.optionalInteger)

    expectType<number[]>(this.flags.requiredMultiInteger)
    expectNotType<undefined>(this.flags.requiredMultiInteger)
    expectType<number[]>(this.flags.defaultMultiInteger)
    expectNotType<undefined>(this.flags.defaultMultiInteger)
    expectType<number[] | undefined>(this.flags.optionalMultiInteger)

    expectType<string>(this.flags.requiredDirectory)
    expectNotType<undefined>(this.flags.requiredDirectory)
    expectType<string>(this.flags.defaultDirectory)
    expectNotType<undefined>(this.flags.defaultDirectory)
    expectType<string | undefined>(this.flags.optionalDirectory)

    expectType<string[]>(this.flags.requiredMultiDirectory)
    expectNotType<undefined>(this.flags.requiredMultiDirectory)
    expectType<string[]>(this.flags.defaultMultiDirectory)
    expectNotType<undefined>(this.flags.defaultMultiDirectory)
    expectType<string[] | undefined>(this.flags.optionalMultiDirectory)

    expectType<string>(this.flags.requiredFile)
    expectNotType<undefined>(this.flags.requiredFile)
    expectType<string>(this.flags.defaultFile)
    expectNotType<undefined>(this.flags.defaultFile)
    expectType<string | undefined>(this.flags.optionalFile)

    expectType<string[]>(this.flags.requiredMultiFile)
    expectNotType<undefined>(this.flags.requiredMultiFile)
    expectType<string[]>(this.flags.defaultMultiFile)
    expectNotType<undefined>(this.flags.defaultMultiFile)
    expectType<string[] | undefined>(this.flags.optionalMultiFile)

    expectType<URL>(this.flags.requiredUrl)
    expectNotType<undefined>(this.flags.requiredUrl)
    expectType<URL>(this.flags.defaultUrl)
    expectNotType<undefined>(this.flags.defaultUrl)
    expectType<URL | undefined>(this.flags.optionalUrl)

    expectType<URL[]>(this.flags.requiredMultiUrl)
    expectNotType<undefined>(this.flags.requiredMultiUrl)
    expectType<URL[]>(this.flags.defaultMultiUrl)
    expectNotType<undefined>(this.flags.defaultMultiUrl)
    expectType<URL[] | undefined>(this.flags.optionalMultiUrl)

    expectType<MyType>(this.flags.requiredCustom)
    expectNotType<undefined>(this.flags.requiredCustom)
    expectType<MyType>(this.flags.defaultCustom)
    expectNotType<undefined>(this.flags.defaultCustom)
    expectType<MyType | undefined>(this.flags.optionalCustom)

    expectType<MyType[]>(this.flags.requiredMultiCustom)
    expectNotType<undefined>(this.flags.requiredMultiCustom)
    expectType<MyType[]>(this.flags.defaultMultiCustom)
    expectNotType<undefined>(this.flags.defaultMultiCustom)
    expectType<MyType[] | undefined>(this.flags.optionalMultiCustom)

    expectType<number | undefined>(this.flags.optionalCustomFlagWithRequiredProp)
    expectType<number>(this.flags.requiredCustomFlagWithRequiredProp)
    expectNotType<undefined>(this.flags.requiredCustomFlagWithRequiredProp)
    expectType<number>(this.flags.defaultCustomFlagWithRequiredProp)
    expectNotType<undefined>(this.flags.defaultCustomFlagWithRequiredProp)

    return result.flags
  }
}

