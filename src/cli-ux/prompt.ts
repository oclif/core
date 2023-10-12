import chalk from 'chalk'

import * as Errors from '../errors'
import {config} from './config'
import {stderr} from './stream'

export interface IPromptOptions {
  default?: string
  prompt?: string
  /**
   * Requires user input if true, otherwise allows empty input
   */
  required?: boolean
  timeout?: number
  type?: 'hide' | 'mask' | 'normal' | 'single'
}

interface IPromptConfig {
  default?: string
  isTTY: boolean
  name: string
  prompt: string
  required: boolean
  timeout?: number
  type: 'hide' | 'mask' | 'normal' | 'single'
}

function normal(options: IPromptConfig, retries = 100): Promise<string> {
  if (retries < 0) throw new Error('no input')
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout
    if (options.timeout) {
      timer = setTimeout(() => {
        process.stdin.pause()
        reject(new Error('Prompt timeout'))
      }, options.timeout)
      timer.unref()
    }

    process.stdin.setEncoding('utf8')
    stderr.write(options.prompt)
    process.stdin.resume()
    process.stdin.once('data', (b) => {
      if (timer) clearTimeout(timer)
      process.stdin.pause()
      const data: string = (typeof b === 'string' ? b : b.toString()).trim()
      if (!options.default && options.required && data === '') {
        resolve(normal(options, retries - 1))
      } else {
        resolve(data || (options.default as string))
      }
    })
  })
}

function getPrompt(name: string, type?: string, defaultValue?: string) {
  let prompt = '> '

  if (defaultValue && type === 'hide') {
    defaultValue = '*'.repeat(defaultValue.length)
  }

  if (name && defaultValue) prompt = name + ' ' + chalk.yellow('[' + defaultValue + ']') + ': '
  else if (name) prompt = `${name}: `

  return prompt
}

async function single(options: IPromptConfig): Promise<string> {
  const raw = process.stdin.isRaw
  if (process.stdin.setRawMode) process.stdin.setRawMode(true)
  options.required = options.required ?? false
  const response = await normal(options)
  if (process.stdin.setRawMode) process.stdin.setRawMode(Boolean(raw))
  return response
}

function replacePrompt(prompt: string) {
  const ansiEscapes = require('ansi-escapes')
  stderr.write(
    ansiEscapes.cursorHide +
      ansiEscapes.cursorUp(1) +
      ansiEscapes.cursorLeft +
      prompt +
      ansiEscapes.cursorDown(1) +
      ansiEscapes.cursorLeft +
      ansiEscapes.cursorShow,
  )
}

async function _prompt(name: string, inputOptions: Partial<IPromptOptions> = {}): Promise<string> {
  const prompt = getPrompt(name, inputOptions.type, inputOptions.default)
  const options: IPromptConfig = {
    default: '',
    isTTY: Boolean(process.env.TERM !== 'dumb' && process.stdin.isTTY),
    name,
    prompt,
    required: true,
    type: 'normal',
    ...inputOptions,
  }
  const passwordPrompt = require('password-prompt')

  switch (options.type) {
    case 'normal': {
      return normal(options)
    }

    case 'single': {
      return single(options)
    }

    case 'mask': {
      return passwordPrompt(options.prompt, {
        default: options.default,
        method: options.type,
        required: options.required,
      }).then((value: string) => {
        replacePrompt(getPrompt(name, 'hide', inputOptions.default))
        return value
      })
    }

    case 'hide': {
      return passwordPrompt(options.prompt, {
        default: options.default,
        method: options.type,
        required: options.required,
      })
    }

    default: {
      throw new Error(`unexpected type ${options.type}`)
    }
  }
}

/**
 * prompt for input
 * @param name - prompt text
 * @param options - @see IPromptOptions
 * @returns Promise<string>
 */
export async function prompt(name: string, options: IPromptOptions = {}): Promise<string> {
  return config.action.pauseAsync(() => _prompt(name, options), chalk.cyan('?'))
}

/**
 * confirmation prompt (yes/no)
 * @param message - confirmation text
 * @returns Promise<boolean>
 */
export function confirm(message: string): Promise<boolean> {
  return config.action.pauseAsync(async () => {
    const confirm = async (): Promise<boolean> => {
      const raw = await _prompt(message)
      const response = raw.toLowerCase()
      if (['n', 'no'].includes(response)) return false
      if (['y', 'yes'].includes(response)) return true
      return confirm()
    }

    return confirm()
  }, chalk.cyan('?'))
}

/**
 * "press anykey to continue"
 * @param message - optional message to display to user
 * @returns Promise<string>
 */
export async function anykey(message?: string): Promise<string> {
  const tty = Boolean(process.stdin.setRawMode)
  if (!message) {
    message = tty
      ? `Press any key to continue or ${chalk.yellow('q')} to exit`
      : `Press enter to continue or ${chalk.yellow('q')} to exit`
  }

  const char = await prompt(message, {required: false, type: 'single'})
  if (tty) stderr.write('\n')
  if (char === 'q') Errors.error('quit')
  if (char === '\u0003') Errors.error('ctrl-c')
  return char
}
