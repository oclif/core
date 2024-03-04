import {Command} from '../../../../../../../src/index'

export default class FooBar extends Command {
  public static description = 'foo bar description'
  public async run(): Promise<void> {
    this.log('hello world!')
  }
}
