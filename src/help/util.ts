import * as ejs from 'ejs'

import {collectUsableIds} from '../config/util'
import {Deprecation, Config as IConfig} from '../interfaces'
import {ROOT_COMMAND_SYMBOL} from '../symbols'
import {toStandardizedId} from '../util/ids'

export function template(context: any): (t: string) => string {
  function render(t: string): string {
    return ejs.render(t, context)
  }

  return render
}

const isFlag = (s: string) => s.startsWith('-')
const isArgWithValue = (s: string) => s.includes('=')

/**
 * Creates a function to check if a command has arguments defined.
 *
 * @param config - CLI configuration object
 * @returns Function that checks if a command ID has arguments
 */
function createHasArgsFunction(config: IConfig): (id: string) => boolean {
  return (id: string) => {
    const cmd = config.findCommand(id)
    return Boolean(cmd && (cmd.strict === false || Object.keys(cmd.args ?? {}).length > 0))
  }
}

/**
 * Determines if command ID building should stop based on current argument and state.
 *
 * @param arg - Current argument being processed
 * @param cmdParts - Current command parts built so far
 * @param shouldStopForArgs - Function to check if building should stop for current command
 * @returns True if building should stop, false otherwise
 */
function shouldStopBuilding(
  arg: string,
  cmdParts: string[],
  shouldStopForArgs: (id: string) => boolean,
  ids: Set<string>,
): boolean {
  // Stop if we hit flags or args with values
  if (isFlag(arg) || isArgWithValue(arg)) return true

  // Can't stop if we haven't built a command yet
  if (cmdParts.length === 0) return false

  const currentId = cmdParts.join(':')
  // If the current ID isn't a command that can take args, we can't stop.
  if (!shouldStopForArgs(currentId)) return false

  // At this point, we have a runnable command that takes args.
  // We should stop, UNLESS the next part (`arg`) forms a more specific command.
  const potentialNextId = [...cmdParts, arg].join(':')
  const isNextPartOfLongerCommand =
    ids.has(potentialNextId) || [...ids].some((id) => id.startsWith(potentialNextId + ':'))

  return !isNextPartOfLongerCommand
}

/**
 * Core logic for building command IDs from arguments.
 * Shared between root command and regular command processing.
 *
 * @param args - Array of arguments to process
 * @param startingConsumedArgs - Number of arguments already consumed (e.g., ROOT_COMMAND_SYMBOL)
 * @param ids - Set of available command IDs
 * @param shouldStopForArgs - Function to check if building should stop for current command
 * @returns Object with command ID and total consumed arguments, or undefined if no valid command found
 */
function buildCommandIdFromArgs(
  args: string[],
  startingConsumedArgs: number,
  ids: Set<string>,
  shouldStopForArgs: (id: string) => boolean,
): {consumedArgs: number; id: string} | undefined {
  const cmdParts: string[] = []
  let consumedArgs = startingConsumedArgs

  for (const arg of args) {
    // Skip empty strings but count them
    if (arg === '') {
      consumedArgs++
      continue
    }

    if (shouldStopBuilding(arg, cmdParts, shouldStopForArgs, ids)) break

    const potentialId = [...cmdParts, arg].join(':')

    // Stop if this doesn't form a valid command and we haven't started building yet
    if (cmdParts.length === 0 && !ids.has(potentialId) && ![...ids].some((id) => id.startsWith(potentialId + ':'))) {
      break
    }

    // Continue building the command ID
    cmdParts.push(arg)
    consumedArgs++
  }

  const id = cmdParts.join(':')
  return id ? {consumedArgs, id} : undefined
}

/**
 * Handles command ID processing for both root and regular command scenarios.
 *
 * @param argv - Complete argument array
 * @param ids - Set of available command IDs
 * @param isRootCommand - Whether this is a root command scenario
 * @param shouldStopForArgs - Function to check if building should stop for current command
 * @returns Array with command ID as first element, remaining args as rest
 */
function resolveArgv(
  argv: string[],
  ids: Set<string>,
  isRootCommand: boolean,
  shouldStopForArgs: (id: string) => boolean,
): string[] {
  const startingConsumedArgs = isRootCommand ? 1 : 0
  const argsToProcess = isRootCommand ? argv.slice(1) : argv

  const result = buildCommandIdFromArgs(argsToProcess, startingConsumedArgs, ids, shouldStopForArgs)

  if (result) {
    const remainingArgs = argv.slice(result.consumedArgs)
    // Filter empty strings for root commands only
    const filteredRemainingArgs = isRootCommand ? remainingArgs.filter((arg) => arg !== '') : remainingArgs
    return [result.id, ...filteredRemainingArgs]
  }

  // No valid command ID found
  if (isRootCommand) {
    // Return ROOT_COMMAND_SYMBOL with remaining args (filtered)
    return [ROOT_COMMAND_SYMBOL, ...argsToProcess.filter((arg) => arg !== '')]
  }

  // Return original argv for regular commands
  return argv
}

/**
 * Collates spaced command IDs from command line arguments.
 *
 * Processes argv to construct valid command IDs by matching argument sequences
 * against available commands in the configuration. Handles both root commands
 * (starting with ROOT_COMMAND_SYMBOL) and regular commands.
 *
 * @param argv - Array of command line arguments to process
 * @param config - CLI configuration object containing available command IDs
 * @returns Array where first element is the command ID, remaining are unconsumed args
 */
function collateSpacedCmdIDFromArgs(argv: string[], config: IConfig): string[] {
  if (argv.length === 1) return argv

  const ids = collectUsableIds(config.commandIDs)
  const isRootCommand = argv[0] === ROOT_COMMAND_SYMBOL

  const shouldStopForArgs = createHasArgsFunction(config)
  return resolveArgv(argv, ids, isRootCommand, shouldStopForArgs)
}

export function standardizeIDFromArgv(argv: string[], config: IConfig): string[] {
  if (argv.length === 0) return argv
  if (config.topicSeparator === ' ') argv = collateSpacedCmdIDFromArgs(argv, config)
  else if (config.topicSeparator !== ':') argv[0] = toStandardizedId(argv[0], config)
  return argv
}

export function getHelpFlagAdditions(config: IConfig): string[] {
  const helpFlags = ['--help']
  const additionalHelpFlags = config.pjson.oclif.additionalHelpFlags ?? []
  return [...new Set([...additionalHelpFlags, ...helpFlags]).values()]
}

export function formatFlagDeprecationWarning(flag: string, opts: Deprecation | true): string {
  let message = `The "${flag}" flag has been deprecated`
  if (opts === true) return `${message}.`
  if (opts.message) return opts.message

  if (opts.version) {
    message += ` and will be removed in version ${opts.version}`
  }

  message += opts.to ? `. Use "${opts.to}" instead.` : '.'

  return message
}

export function formatCommandDeprecationWarning(command: string, opts?: Deprecation): string {
  let message = `The "${command}" command has been deprecated`
  if (!opts) return `${message}.`

  if (opts.message) return opts.message

  if (opts.version) {
    message += ` and will be removed in version ${opts.version}`
  }

  message += opts.to ? `. Use "${opts.to}" instead.` : '.'

  return message
}

export function normalizeArgv(config: IConfig, argv = process.argv.slice(2)): string[] {
  if (config.topicSeparator !== ':' && !argv[0]?.includes(':')) argv = standardizeIDFromArgv(argv, config)
  return argv
}
