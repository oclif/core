import * as chalk from 'chalk'
import {ux} from '../../index'

export default function styledHeader(header: string): void {
  ux.info(chalk.dim('=== ') + chalk.bold(header) + '\n')
}
