import chalk from 'chalk'
import stripAnsi from 'strip-ansi'

import * as Interfaces from '../interfaces'
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
    return this.section('DESCRIPTION', this.wrap(chalk.hex(this.config.theme.sectionDescription.hex())(description)))
  }

  root(): string {
    let description = this.config.pjson.oclif.description || this.config.pjson.description || ''
    description = this.render(description)
    description = description.split('\n')[0]
    let output = compact([
      chalk.hex(this.config.theme.sectionDescription.hex())(description),
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
        `${chalk.hex(this.config.theme.dollarSign.hex())('$')} ${chalk.hex(this.config.theme.bin.hex())(
          this.config.bin,
        )} ${chalk.hex(this.config.theme.sectionDescription.hex())('[COMMAND]')}`,
      ),
    )
  }

  protected version(): string {
    return this.section('VERSION', this.wrap(chalk.hex(this.config.theme.version.hex())(this.config.userAgent)))
  }
}
