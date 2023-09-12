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
  default: async _ctx => _ctx.options.unit === 'minutes' ? 1 : 2,
  defaultHelp: async _ctx => _ctx.options.unit === 'minutes' ? '1 minute' : '2 seconds',
  char: 'c',
})

export const arrayFlag = Flags.custom<string[]>({
  delimiter: ',',
  multiple: true,
})

const options = ['foo', 'bar'] as const

Flags.option({
  options,
  multiple: true,
  // @ts-expect-error because multiple is true, default must be an array
  default: 'foo',
})

Flags.option({options})({
  multiple: true,
  // @ts-expect-error because multiple is true, default must be an array
  default: 'foo',
})

// @ts-expect-error because multiple is false, default must be a single value
Flags.option({
  options,
  default: ['foo'],
})

// @ts-expect-error because multiple is false, default must be a single value
Flags.option({options, multiple: false})({
  default: ['foo'],
})

Flags.custom({
  options,
  multiple: true,
  // @ts-expect-error because multiple is true, default must be an array
  default: 'foo',
})

Flags.custom()({
  multiple: true,
  // @ts-expect-error because multiple is true, default must be an array
  default: 'foo',
})

Flags.custom({multiple: true})({
  // @ts-expect-error because multiple is true, default must be an array
  default: 'foo',
})

// @ts-expect-error because multiple is false, default must be a single value
Flags.custom({
  options,
  default: ['foo'],
})

// @ts-expect-error because multiple is false, default must be a single value
Flags.custom({multiple: false})({
  default: ['foo'],
})

class MyCommand extends BaseCommand {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    string: Flags.string(),
    'string#opts:required': Flags.string({required: true}),
    'string#opts:default': Flags.string({default: 'default'}),

    'string#opts:multiple,required': Flags.string({required: true, multiple: true}),
    'string#opts:multiple': Flags.string({multiple: true}),
    'string#opts:multiple,default': Flags.string({
      multiple: true,
      default: ['default'],
      defaultHelp: async _ctx => 'defaultHelp',
    }),

    boolean: Flags.boolean(),
    'boolean#opts:required': Flags.boolean({required: true}),
    'boolean#opts:default': Flags.boolean({default: true}),

    integer: Flags.integer(),
    'integer#opts:required': Flags.integer({required: true}),
    'integer#opts:default': Flags.integer({default: 1}),

    'integer#opts:multiple': Flags.integer({multiple: true}),
    'integer#opts:multiple,required': Flags.integer({multiple: true, required: true}),
    'integer#opts:multiple,default': Flags.integer({multiple: true, default: [1]}),

    directory: Flags.directory(),
    'directory#opts:required': Flags.directory({required: true}),
    'directory#opts:default': Flags.directory({default: 'my-dir'}),

    'directory#opts:multiple': Flags.directory({multiple: true}),
    'directory#opts:multiple,required': Flags.directory({multiple: true, required: true}),
    'directory#opts:multiple,default': Flags.directory({multiple: true, default: ['my-dir']}),

    file: Flags.file(),
    'file#opts:required': Flags.file({required: true}),
    'file#opts:default': Flags.file({default: 'my-file.json'}),

    'file#opts:multiple': Flags.file({multiple: true}),
    'file#opts:multiple,required': Flags.file({multiple: true, required: true}),
    'file#opts:multiple,default': Flags.file({multiple: true, default: ['my-file.json']}),

    url: Flags.url(),
    'url#opts:required': Flags.url({required: true}),
    'url#opts:default': Flags.url({
      default: new URL('http://example.com'),
      defaultHelp: async _ctx => 'Example URL',
    }),

    'url#opts:multiple': Flags.url({multiple: true}),
    'url#opts:multiple,required': Flags.url({multiple: true, required: true}),
    'url#opts:multiple,default': Flags.url({multiple: true, default: [new URL('http://example.com')]}),

    custom: Flags.custom<MyType>({
      parse: async () => ({foo: true}),
    })(),
    'custom#opts:required': Flags.custom<MyType>({
      parse: async () => ({foo: true}),
    })({required: true}),
    'custom#opts:default': Flags.custom<MyType>({
      parse: async () => ({foo: true}),
    })({
      default: async _ctx => ({foo: true}),
    }),

    'custom#opts:multiple': Flags.custom<MyType>({
      parse: async () => ({foo: true}),
    })({multiple: true}),
    'custom#opts:multiple,required': Flags.custom<MyType>({
      parse: async () => ({foo: true}),
    })({required: true, multiple: true}),
    'custom#opts:multiple,default': Flags.custom<MyType>({
      parse: async () => ({foo: true}),
    })({default: [{foo: true}], multiple: true}),

    'custom#opts:custom-prop': customFlagWithRequiredProp({unit: 'minutes'}),
    'custom#opts:custom-prop,required': customFlagWithRequiredProp({unit: 'minutes', required: true}),
    'custom#opts:custom-prop,default': customFlagWithRequiredProp({unit: 'minutes', default: 23}),

    'custom#defs:multiple,delimiter': arrayFlag(),
    'custom#defs:multiple,delimiter;opts:required': arrayFlag({required: true}),
    'custom#defs:multiple,delimiter;opts:default': arrayFlag({default: ['foo', 'bar']}),

    option: Flags.option({
      options,
    })(),
    'option#opts:required': Flags.option({
      options,
    })({required: true}),
    'option#opts:default': Flags.option({
      options,
    })({default: 'foo'}),

    'option#opts:multiple': Flags.option({
      options,
    })({multiple: true}),
    'option#opts:multiple,required': Flags.option({
      options,
    })({required: true, multiple: true}),
    'option#opts:multiple,default': Flags.option({
      options,
    })({default: async _ctx => ['foo'], multiple: true}),

    'custom#defs:required': Flags.custom({
      required: true,
    })(),
    'custom#defs:default': Flags.custom({
      default: 'foo',
    })(),
    'custom#defs:multiple': Flags.custom({
      multiple: true,
    })(),
    'custom#defs:multiple,required': Flags.custom({
      multiple: true,
      required: true,
    })(),
    'custom#defs:multiple,default': Flags.custom({
      multiple: true,
      default: ['foo'],
    })(),

    'option#defs:required': Flags.option({
      options,
      required: true,
    })(),
    'option#defs:default': Flags.option({
      options,
      default: async _ctx => 'foo',
    })(),
    'option#defs:multiple': Flags.option({
      options,
      multiple: true,
    })(),
    'option#defs:multiple,required': Flags.option({
      options,
      multiple: true,
      required: true,
    })(),
    'option#defs,multiple,default': Flags.option({
      options,
      multiple: true,
      default: async _ctx => ['foo'],
    })(),

    'option#defs:multiple;opts:default': Flags.option({
      options,
      multiple: true,
    })({
      default: ['foo'],
    }),

    'option#defs:multiple;opts:default-callback': Flags.option({
      options,
      multiple: true,
    })({
      default: async _ctx => ['foo'],
    }),

    'custom#defs:multiple;opts:default-callback': Flags.custom({
      options,
      multiple: true,
    })({
      default: async _ctx => ['foo'],
    }),

    'custom#defs:multiple,parse': Flags.custom({
      multiple: true,
      parse: async (input, _ctx, _opts) => input,
    })(),

    'option#defs:multiple,prase': Flags.option({
      options,
      multiple: true,
      parse: async (input, _ctx, _opts) => input as typeof options[number],
    })(),

    'custom#defs:multiple=true;opts:multiple=false': Flags.custom({
      multiple: true,
    })({
      multiple: false,
    }),
    'custom#defs:multiple=false;opts:multiple=true': Flags.custom({
      multiple: false,
    })({
      multiple: true,
    }),
    'custom#defs:required=true;opts:required=false': Flags.custom({
      required: true,
    })({
      required: false,
    }),
    'custom#defs:required=false;opts:required=true': Flags.custom({
      required: false,
    })({
      required: true,
    }),
    'custom#defs:multiple=true;opts:multiple=false,required=true': Flags.custom({
      multiple: true,
    })({
      multiple: false,
      required: true,
    }),
    'custom#defs:required=true;opts:multiple=true,required=false': Flags.custom({
      required: true,
    })({
      multiple: true,
      required: false,
    }),
    'custom#defs:required=false;opts:multiple=true,required=true': Flags.custom({
      required: false,
    })({
      multiple: true,
      required: true,
    }),

    'custom#defs:multiple=true,required=true;opts:multiple=false,required=false': Flags.custom({
      multiple: true,
      required: true,
    })({
      multiple: false,
      required: false,
    }),

    'custom#defs:multiple=false,required=false;opts:multiple=true,required=true': Flags.custom({
      multiple: false,
      required: false,
    })({
      multiple: true,
      required: true,
    }),

    'custom#defs:multiple=true;opts:multiple=false,default': Flags.custom({
      multiple: true,
    })({
      multiple: false,
      // TODO: THIS IS A BUG. It should enforce a single value instead of allowing a single value or an array
      default: ['foo'],
    }),
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

    expectType<string>(this.flags['string#opts:required'])
    expectNotType<undefined>(this.flags['string#opts:required'])

    expectType<string>(this.flags['string#opts:default'])
    expectNotType<undefined>(this.flags['string#opts:default'])

    expectType<string | undefined>(this.flags.string)

    expectType<string[]>(this.flags['string#opts:multiple,required'])
    expectNotType<undefined>(this.flags['string#opts:multiple,required'])

    expectType<string[] | undefined>(this.flags['string#opts:multiple'])
    expectType<string[]>(this.flags['string#opts:multiple,default'])
    expectNotType<undefined>(this.flags['string#opts:multiple,default'])

    expectType<boolean>(this.flags['boolean#opts:required'])
    expectNotType<undefined>(this.flags['boolean#opts:required'])
    expectType<boolean>(this.flags['boolean#opts:default'])
    expectNotType<undefined>(this.flags['boolean#opts:default'])
    expectType<boolean | undefined>(this.flags.boolean)

    expectType<number>(this.flags['integer#opts:required'])
    expectNotType<undefined>(this.flags['integer#opts:required'])
    expectType<number>(this.flags['integer#opts:default'])
    expectNotType<undefined>(this.flags['integer#opts:default'])
    expectType<number | undefined>(this.flags.integer)

    expectType<number[]>(this.flags['integer#opts:multiple,required'])
    expectNotType<undefined>(this.flags['integer#opts:multiple,required'])
    expectType<number[]>(this.flags['integer#opts:multiple,default'])
    expectNotType<undefined>(this.flags['integer#opts:multiple,default'])
    expectType<number[] | undefined>(this.flags['integer#opts:multiple'])

    expectType<string>(this.flags['directory#opts:required'])
    expectNotType<undefined>(this.flags['directory#opts:required'])
    expectType<string>(this.flags['directory#opts:default'])
    expectNotType<undefined>(this.flags['directory#opts:default'])
    expectType<string | undefined>(this.flags.directory)

    expectType<string[]>(this.flags['directory#opts:multiple,required'])
    expectNotType<undefined>(this.flags['directory#opts:multiple,required'])
    expectType<string[]>(this.flags['directory#opts:multiple,default'])
    expectNotType<undefined>(this.flags['directory#opts:multiple,default'])
    expectType<string[] | undefined>(this.flags['directory#opts:multiple'])

    expectType<string>(this.flags['file#opts:required'])
    expectNotType<undefined>(this.flags['file#opts:required'])
    expectType<string>(this.flags['file#opts:default'])
    expectNotType<undefined>(this.flags['file#opts:default'])
    expectType<string | undefined>(this.flags.file)

    expectType<string[]>(this.flags['file#opts:multiple,required'])
    expectNotType<undefined>(this.flags['file#opts:multiple,required'])
    expectType<string[]>(this.flags['file#opts:multiple,default'])
    expectNotType<undefined>(this.flags['file#opts:multiple,default'])
    expectType<string[] | undefined>(this.flags['file#opts:multiple'])

    expectType<URL>(this.flags['url#opts:required'])
    expectNotType<undefined>(this.flags['url#opts:required'])
    expectType<URL>(this.flags['url#opts:default'])
    expectNotType<undefined>(this.flags['url#opts:default'])
    expectType<URL | undefined>(this.flags.url)

    expectType<URL[]>(this.flags['url#opts:multiple,required'])
    expectNotType<undefined>(this.flags['url#opts:multiple,required'])
    expectType<URL[]>(this.flags['url#opts:multiple,default'])
    expectNotType<undefined>(this.flags['url#opts:multiple,default'])
    expectType<URL[] | undefined>(this.flags['url#opts:multiple'])

    expectType<MyType>(this.flags['custom#opts:required'])
    expectNotType<undefined>(this.flags['custom#opts:required'])
    expectType<MyType>(this.flags['custom#opts:default'])
    expectNotType<undefined>(this.flags['custom#opts:default'])
    expectType<MyType | undefined>(this.flags.custom)

    expectType<MyType[]>(this.flags['custom#opts:multiple,required'])
    expectNotType<undefined>(this.flags['custom#opts:multiple,required'])
    expectType<MyType[]>(this.flags['custom#opts:multiple,default'])
    expectNotType<undefined>(this.flags['custom#opts:multiple,default'])
    expectType<MyType[] | undefined>(this.flags['custom#opts:multiple'])

    expectType<number | undefined>(this.flags['custom#opts:custom-prop'])
    expectType<number>(this.flags['custom#opts:custom-prop,required'])
    expectNotType<undefined>(this.flags['custom#opts:custom-prop,required'])
    expectType<number>(this.flags['custom#opts:custom-prop,default'])
    expectNotType<undefined>(this.flags['custom#opts:custom-prop,default'])

    expectType<string[]>(this.flags['custom#defs:multiple,delimiter;opts:required'])
    expectNotType<undefined>(this.flags['custom#defs:multiple,delimiter;opts:required'])
    expectType<string[]>(this.flags['custom#defs:multiple,delimiter;opts:default'])
    expectNotType<undefined>(this.flags['custom#defs:multiple,delimiter;opts:default'])
    expectType<string[] | undefined>(this.flags['custom#defs:multiple,delimiter'])

    expectType<typeof options[number]>(this.flags['option#opts:required'])
    expectNotType<undefined>(this.flags['option#opts:required'])
    expectType<typeof options[number]>(this.flags['option#opts:default'])
    expectNotType<undefined>(this.flags['option#opts:default'])
    expectType<typeof options[number] | undefined>(this.flags.option)

    expectType<typeof options[number][]>(this.flags['option#opts:multiple,required'])
    expectNotType<undefined>(this.flags['option#opts:multiple,required'])
    expectType<typeof options[number][]>(this.flags['option#opts:multiple,default'])
    expectNotType<undefined>(this.flags['option#opts:multiple,default'])
    expectType<typeof options[number][] | undefined>(this.flags['option#opts:multiple'])

    expectType<string>(this.flags['custom#defs:required'])
    expectNotType<undefined>(this.flags['custom#defs:required'])
    expectType<string>(this.flags['custom#defs:default'])
    expectNotType<undefined>(this.flags['custom#defs:default'])
    expectType<string[] | undefined>(this.flags['custom#defs:multiple'])
    expectNotType<undefined>(this.flags['custom#defs:multiple'])
    expectType<string[]>(this.flags['custom#defs:multiple,required'])
    expectNotType<undefined>(this.flags['custom#defs:multiple,required'])
    expectType<string[]>(this.flags['custom#defs:multiple,default'])
    expectNotType<undefined>(this.flags['custom#defs:multiple,default'])

    expectType<string>(this.flags['option#defs:required'])
    expectNotType<undefined>(this.flags['option#defs:required'])
    expectType<string>(this.flags['option#defs:default'])
    expectNotType<undefined>(this.flags['option#defs:default'])
    expectType<string[] | undefined>(this.flags['option#defs:multiple'])
    expectNotType<undefined>(this.flags['option#defs:multiple'])
    expectType<string[]>(this.flags['option#defs:multiple,required'])
    expectNotType<undefined>(this.flags['option#defs:multiple,required'])
    expectType<string[]>(this.flags['option#defs,multiple,default'])
    expectNotType<undefined>(this.flags['option#defs,multiple,default'])

    expectType<string[]>(this.flags['option#defs:multiple;opts:default'])
    expectNotType<undefined>(this.flags['option#defs:multiple;opts:default'])

    expectType<string[]>(this.flags['option#defs:multiple;opts:default-callback'])
    expectNotType<undefined>(this.flags['option#defs:multiple;opts:default-callback'])

    expectType<string[]>(this.flags['custom#defs:multiple;opts:default-callback'])

    expectType<string[] | undefined>(this.flags['custom#defs:multiple,parse'])

    expectType<(typeof options[number])[] | undefined>(this.flags['option#defs:multiple,prase'])

    expectType<string | undefined>(this.flags['custom#defs:multiple=true;opts:multiple=false'])
    expectType<string[] | undefined>(this.flags['custom#defs:multiple=false;opts:multiple=true'])
    expectType<string | undefined>(this.flags['custom#defs:required=true;opts:required=false'])
    expectType<string>(this.flags['custom#defs:required=false;opts:required=true'])
    expectNotType<undefined>(this.flags['custom#defs:required=false;opts:required=true'])
    expectType<string>(this.flags['custom#defs:multiple=true;opts:multiple=false,required=true'])
    expectNotType<undefined>(this.flags['custom#defs:multiple=true;opts:multiple=false,required=true'])
    expectType<string[] | undefined>(this.flags['custom#defs:required=true;opts:multiple=true,required=false'])
    expectType<string[]>(this.flags['custom#defs:required=false;opts:multiple=true,required=true'])
    expectNotType<undefined>(this.flags['custom#defs:required=false;opts:multiple=true,required=true'])
    expectType<string | undefined>(this.flags['custom#defs:multiple=true,required=true;opts:multiple=false,required=false'])
    expectType<string[]>(this.flags['custom#defs:multiple=false,required=false;opts:multiple=true,required=true'])
    expectNotType<undefined>(this.flags['custom#defs:multiple=false,required=false;opts:multiple=true,required=true'])

    // TODO: Known issue with `default` not enforcing the correct type whenever multiple is defaulted to true but then overridden to false
    // expectType<string>(this.flags['custom#defs:multiple=true;opts:multiple=false,default'])

    return result.flags
  }
}

