import * as chalk from 'chalk'
import {CliUx} from '../../index'

export default function styledHeader(header: string) {
  CliUx.ux.info(chalk.dim('=== ') + chalk.bold(header) + '\n')
}
