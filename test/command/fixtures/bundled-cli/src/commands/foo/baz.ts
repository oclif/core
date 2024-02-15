import {Command} from '../../../../../../../src/index'

export default class FooBaz extends Command {
  public static description = 'foo baz description'
  public async run(): Promise<void> {}
}
