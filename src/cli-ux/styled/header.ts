import * as chalk from 'chalk'
import {CliUx} from '../../index'

export default function styledHeader(header: string): void {
  CliUx.ux.info(chalk.dim('=== ') + chalk.bold(header) + '\n')
}
