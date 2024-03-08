import {Command, Flags, Interfaces} from '../../../../../../src'
import {BooleanFlag} from '../../../../../../src/interfaces'

type GroupAliasOption = {
  flag: string
  option?: string
}

function groupAliasFlag<T = boolean>(
  options: Partial<BooleanFlag<T> & {groupAlias: GroupAliasOption[]}> = {},
): BooleanFlag<T> {
  return {
    parse: async (b, _) => b,
    ...options,
    allowNo: Boolean(options.allowNo),
    type: 'boolean',
  } as BooleanFlag<T>
}

export default class Test extends Command {
  static args = {}

  static flags = {
    burger: Flags.string({
      char: 'b',
      default: async () => 'double',
    }),
    combo: groupAliasFlag({
      char: 'c',
      groupAlias: [
        {flag: 'burger'},
        {flag: 'fries'},
        {
          flag: 'shake',
          option: 'strawberry',
        },
      ],
    }),
    shake: Flags.option({
      options: ['chocolate', 'vanilla', 'strawberry'],
      char: 's',
    })(),
    fries: Flags.boolean({
      allowNo: true,
      char: 'f',
    }),
    'flags-dir': Flags.directory(),
    sauce: Flags.string({
      multiple: true,
      default: ['ketchup'],
    }),
  }

  async run(): Promise<{
    args: Interfaces.InferredArgs<typeof Test.args>
    flags: Interfaces.InferredFlags<typeof Test.flags>
  }> {
    const {args, flags} = await this.parse(Test)
    return {
      args,
      flags,
    }
  }
}
