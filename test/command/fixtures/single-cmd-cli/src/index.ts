import {Command} from '../../../../../src/index'

export default class FooBar extends Command {
  public static description = 'Description of single command CLI.'
  public async run(): Promise<void> {
    this.log('hello world!')
  }
}
