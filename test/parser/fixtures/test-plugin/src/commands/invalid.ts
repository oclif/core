import {Args, Command, Flags} from '../../../../../../src'

export default class Invalid extends Command {
  public static readonly args = {
    arg1: Args.string({
      required: false,
    }),
    arg2: Args.string({
      required: true,
    }),
  }

  public static readonly flags = {
    flag1: Flags.integer({
      min: 1,
      max: 10,
      required: true,
    }),
    flag2: Flags.boolean({
      dependsOn: ['flag1'],
    }),
  }

  public async run(): Promise<unknown> {
    const {args, flags} = await this.parse(Invalid)
    return {args, flags}
  }
}
