// tslint:disable restrict-plus-operands

import * as chalk from 'chalk'

export default function styledHeader(header: string) {
  process.stdout.write(chalk.dim('=== ') + chalk.bold(header) + '\n')
}
