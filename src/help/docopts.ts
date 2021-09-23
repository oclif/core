import {Interfaces} from '..'

type Flag = Interfaces.Command.Flag
type Flags = Flag[]

/**
 * DocOpts - See http://docopt.org/.
 *
 * flag.exclusive: groups elements when one of the mutually exclusive cases is a required flag: (--apple | --orange)
 * flag.exclusive: groups elements when none of the mutually exclusive cases is required (optional flags): [--apple | --orange]
 * flag.dependsOn: specifies that if one element is present, then another one is required: (--apple --orange)
 *
 * @example
 *  {
 *      name: 'classnames',
 *      required: true,
 *      exclusive: ['suitenames']
 *      ...
 *  },{
 *      name: 'suitenames',
 *      type: 'array'
 *      required: true
 *      ...
 *  }
 *
 *  Results in:
 *      Usage: <%= command.id %> (-n <string> | -s <array>)
 *
 * @example
 *  {
 *      name: 'classnames',
 *      ...
 *      excludes: ['suitenames']
 *  },{
 *      name: 'suitenames',
 *      ...
 *  }
 *
 *  Results in:
 *      Usage: <%= command.id %> [-n <string> | -s <string>]
 *
 * @example
 *  {
 *      name: 'classnames',
 *      ...
 *      dependsOn: ['suitenames']
 *  },{
 *      name: 'suitenames',
 *      type: 'flag'
 *      ...
 *  }
 *
 *  Results in:
 *      Usage: <%= command.id %> (-n <string> -s)
 *
 * TODO:
 *  - Support nesting, eg:
 *      Usage: my_program (--either-this <and-that> | <or-this>)
 *      Usage: my_program [(<one-argument> <another-argument>)]
 *
 */
export class DocOpts {
  private flagMap: {[index: string]: Flag}

  private flagList: Flags

  public constructor(private cmd: Interfaces.Command) {
    // Create a new map with references to the flags that we can manipulate.
    this.flagMap = {}
    this.flagList = Object.entries(cmd.flags || {})
    .filter(([_, flag]) => !flag.hidden)
    .map(([name, flag]) => {
      this.flagMap[name] = flag
      return flag
    })
  }

  public static generate(cmd: Interfaces.Command): string {
    return new DocOpts(cmd).toString()
  }

  public toString(): string {
    const opts = ['<%= command.id %>']
    if (this.cmd.args) {
      const a = this.cmd.args?.map(arg => `[${arg.name.toUpperCase()}]`) || []
      opts.push(...a)
    }

    try {
      opts.push(...Object.values(this.groupFlagElements()))
    } catch {
      // If there is an error, just return no usage so we don't fail command help.
      opts.push(...this.flagList.map(flag => {
        const name = flag.char ? `-${flag.char}` : `--${flag.name}`
        if (flag.type === 'boolean') return name
        return `${name}=<value>`
      }))
    }

    return opts.join(' ')
  }

  private groupFlagElements(): {[index: string]: string} {
    const elementMap: {[index: string]: string} = {}

    // Generate all doc opt elements for combining
    // Show required flags first
    this.generateElements(elementMap, this.flagList.filter(flag => flag.required))
    // Then show optional flags
    this.generateElements(elementMap, this.flagList.filter(flag => !flag.required))

    for (const flag of this.flagList) {
      if (Array.isArray(flag.dependsOn)) {
        this.combineElementsToFlag(elementMap, flag.name, flag.dependsOn, ' ')
      }

      if (Array.isArray(flag.exclusive)) {
        this.combineElementsToFlag(elementMap, flag.name, flag.exclusive, ' | ')
      }
    }

    // Since combineElementsToFlag deletes the references in this.flags when it combines
    // them, this will go through the remaining list of uncombined elements.
    for (const remainingFlagName of Object.keys(this.flagMap)) {
      const remainingFlag = this.flagMap[remainingFlagName] || {}

      if (!remainingFlag.required) {
        elementMap[remainingFlag.name] = `[${elementMap[remainingFlag.name] || ''}]`
      }
    }

    return elementMap
  }

  private combineElementsToFlag(
    elementMap: {[index: string]: string},
    flagName: string,
    flagNames: string[],
    unionString: string,
  ): void {
    if (!this.flagMap[flagName]) {
      return
    }

    let isRequired = this.flagMap[flagName]?.required
    if (typeof isRequired !== 'boolean' || !isRequired) {
      isRequired = flagNames.reduce(
        (required: boolean, toCombine) => required || this.flagMap[toCombine]?.required || false,
        false,
      )
    }

    for (const toCombine of flagNames) {
      elementMap[flagName] = `${elementMap[flagName] || ''}${unionString}${elementMap[toCombine] || ''}`
      // We handled this flag, don't handle it again
      delete elementMap[toCombine]
      delete this.flagMap[toCombine]
    }

    if (isRequired) {
      elementMap[flagName] = `(${elementMap[flagName] || ''})`
    } else {
      elementMap[flagName] = `[${elementMap[flagName] || ''}]`
    }

    // We handled this flag, don't handle it again
    delete this.flagMap[flagName]
  }

  // eslint-disable-next-line default-param-last
  private generateElements(elementMap: {[index: string]: string} = {}, flagGroups: Flags): string[] {
    const elementStrs = []
    for (const flag of flagGroups) {
      let type = ''
      // not all flags have short names
      const flagName = flag.char ? `-${flag.char}` : `--${flag.name}`
      if (flag.type === 'option') {
        type = flag.options ? ` ${flag.options.join('|')}` : ' <value>'
      }

      const element = `${flagName}${type}`
      elementMap[flag.name] = element
      elementStrs.push(element)
    }

    return elementStrs
  }
}
