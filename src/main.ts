import * as Config from './config'
import {HelpBase, getHelpClass} from './help'
import Command from './command'

const ROOT_INDEX_CMD_ID = ''

export class Main extends Command {
  static run(argv = process.argv.slice(2), options?: Config.LoadOptions) {
    return super.run(argv, options || (module.parent && module.parent.parent && module.parent.parent.filename) || __dirname)
  }

  async init() {
    const [id, ...argv] = this.argv
    await this.config.runHook('init', {id, argv})
    return super.init()
  }

  async run() {
    let [id, ...argv] = this.argv
    this.parse({strict: false, '--': false, ...this.ctor as any})
    if (!this.config.findCommand(id)) {
      const topic = this.config.findTopic(id)
      if (topic) return this._help()
      if (this.config.findCommand(ROOT_INDEX_CMD_ID)) {
        id = ROOT_INDEX_CMD_ID
        argv = this.argv
      }
    }
    await this.config.runCommand(id, argv)
  }

  protected _helpOverride(): boolean {
    if (['-v', '--version', 'version'].includes(this.argv[0])) return this._version() as any
    if (['-h', 'help'].includes(this.argv[0])) return true
    if (this.argv.length === 0 && !this.config.findCommand(ROOT_INDEX_CMD_ID)) return true
    for (const arg of this.argv) {
      if (arg === '--help') return true
      if (arg === '--') return false
    }
    return false
  }

  protected _help() {
    const HelpClass = getHelpClass(this.config)
    const help: HelpBase = new HelpClass(this.config)
    help.showHelp(this.argv)
    return this.exit(0)
  }
}

export function run(argv = process.argv.slice(2), options?: Config.LoadOptions) {
  return Main.run(argv, options)
}
