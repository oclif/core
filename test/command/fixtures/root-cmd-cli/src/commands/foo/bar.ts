import {Command} from '../../../../../../../src/index'

export default class FooBarCommand extends Command {
  public static description = 'Nested foo bar command'

  public static strict = false

  public async run(): Promise<void> {
    const {argv} = await this.parse(FooBarCommand)
    this.log(`hello from foo bar! ${argv.join(' ')}`.trim())
  }
}
