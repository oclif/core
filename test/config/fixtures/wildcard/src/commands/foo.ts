import {Command} from '../../../../../../src/index'

export default class Foo extends Command {
  public static description = 'foo description'
  public async run(): Promise<void> {
    this.log('hello world!')
  }
}
