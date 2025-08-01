import {Args, Command, Flags} from '../../../../../../src/index'

export default class RootCommand extends Command {
  public static description = 'This is the root command of a multi-command CLI'

  public static args = {
    name: Args.string({description: 'name to print', required: false}),
  }

  public static flags = {
    version: Flags.version(),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(RootCommand)
    this.log(`hello from root command${args.name ? ` ${args.name}` : ''}!`)
  }
}
