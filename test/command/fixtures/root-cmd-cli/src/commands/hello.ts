import {Command} from '../../../../../../src/index'

export default class HelloCommand extends Command {
  public static description = 'Hello subcommand'

  public async run(): Promise<void> {
    this.log('hello from subcommand!')
  }
}
