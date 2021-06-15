import stripAnsi = require('strip-ansi')

import {compact} from '../util'
import * as Interfaces from '../interfaces'
import {HelpFormatter} from './formatter'
import {EOL} from 'os'

export default class RootHelp extends HelpFormatter {
  constructor(public config: Interfaces.Config, public opts: Interfaces.HelpOptions) {
    super(config, opts)
  }

  root(): string {
    let description = this.config.pjson.oclif.description || this.config.pjson.description || ''
    description = this.render(description)
    description = description.split(EOL)[0]
    let output = compact([
      description,
      this.version(),
      this.usage(),
      this.description(),
    ]).join(EOL + EOL)
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output
  }

  protected usage(): string {
    return this.section(this.opts.usageHeader || 'USAGE', this.wrap(`$ ${this.config.bin} [COMMAND]`))
  }

  protected description(): string | undefined {
    let description = this.config.pjson.oclif.description || this.config.pjson.description || ''
    description = this.render(description)
    description = description.split(EOL).slice(1).join(EOL)
    if (!description) return
    return this.section('DESCRIPTION', this.wrap(description))
  }

  protected version(): string {
    return this.section('VERSION', this.wrap(this.config.userAgent))
  }
}
