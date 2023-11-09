import stripAnsi from 'strip-ansi'

import * as Interfaces from '../interfaces'
import {colorize} from '../util/theme'
import {compact} from '../util/util'
import {HelpFormatter} from './formatter'

export default class RootHelp extends HelpFormatter {
  constructor(
    public config: Interfaces.Config,
    public opts: Interfaces.HelpOptions,
  ) {
    super(config, opts)
  }

  protected description(): string | undefined {
    let description = this.config.pjson.oclif.description || this.config.pjson.description || ''
    description = this.render(description)
    description = description.split('\n').slice(1).join('\n')
    if (!description) return
    return this.section('DESCRIPTION', this.wrap(colorize(this.config?.theme?.sectionDescription, description)))
  }

  root(): string {
    let description = this.config.pjson.oclif.description || this.config.pjson.description || ''
    description = this.render(description)
    description = description.split('\n')[0]
    let output = compact([
      colorize(this.config?.theme?.commandSummary, description),
      this.version(),
      this.usage(),
      this.description(),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output
  }

  protected usage(): string {
    return this.section(
      this.opts.usageHeader || 'USAGE',
      this.wrap(
        `${colorize(this.config?.theme?.dollarSign, '$')} ${colorize(
          this.config?.theme?.bin,
          this.config.bin,
        )} ${colorize(this.config?.theme?.sectionDescription, '[COMMAND]')}`,
      ),
    )
  }

  protected version(): string {
    return this.section('VERSION', this.wrap(colorize(this.config?.theme?.version, this.config.userAgent)))
  }
}
