import {Args, Command, Constraints, Flags} from '../../../../../../src'

export default class Test extends Command {
  public static readonly args = {
    arg1: Args.string({
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
    flag3: Flags.string(),
    flag4: Flags.string(),
  }

  public static readonly constraints = [Constraints.flags('flag3', 'flag4').are.mutuallyDependent()]

  public async run(): Promise<unknown> {
    const {args, flags} = await this.parse(Test)
    return {args, flags}
  }
}
