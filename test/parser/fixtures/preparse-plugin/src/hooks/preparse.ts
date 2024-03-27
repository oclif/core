import {readFile, readdir} from 'node:fs/promises'
import {join, parse} from 'node:path'

import {Hook} from '../../../../../../src'

const hook: Hook.Preparse = async function ({argv, options}) {
  const flagsToIgnore = new Set(
    Object.entries(options.flags ?? {})
      .filter(
        ([_, flagOptions]) =>
          // don't ignore if flag can take multiple values
          (flagOptions.type === 'option' && flagOptions.multiple !== true) || flagOptions.type === 'boolean',
      )
      .filter(
        ([flagName, flagOptions]) =>
          // ignore if short char flag is present
          argv.includes(`-${flagOptions.char}`) ||
          // ignore if long flag is present
          argv.includes(`--${flagName}`) ||
          // ignore if --no- flag is present
          (flagOptions.type === 'boolean' && flagOptions.allowNo && argv.includes(`--no-${flagName}`)),
      )
      .map(([flagName]) => flagName),
  )

  const groupAliasFlags = Object.fromEntries(
    Object.entries(options.flags ?? {}).filter(
      ([_, flagOptions]) =>
        // @ts-expect-error because the type isn't aware of the custom flag we made
        flagOptions.groupAlias,
    ),
  )

  for (const [flagName, flagOptions] of Object.entries(groupAliasFlags)) {
    const groupAliasFlagPresent = argv.includes(`--${flagName}`) || argv.includes(`-${flagOptions.char}`)

    if (groupAliasFlagPresent) {
      // @ts-expect-error because the type isn't aware of the custom flag we made
      for (const groupAliasOption of flagOptions.groupAlias) {
        if (flagsToIgnore.has(groupAliasOption.flag)) continue
        argv.push(`--${groupAliasOption.flag}`)
        if (groupAliasOption.option) argv.push(groupAliasOption.option)
        if (typeof options.flags?.[groupAliasOption.flag].default === 'function') {
          // eslint-disable-next-line no-await-in-loop
          argv.push(await options.flags?.[groupAliasOption.flag].default())
          continue
        }

        if (options.flags?.[groupAliasOption.flag].default) {
          argv.push(options.flags?.[groupAliasOption.flag].default)
        }
      }
    }
  }

  if (argv.includes('--flags-dir')) {
    const flagsDir = argv[argv.indexOf('--flags-dir') + 1]
    const filesInDir = await readdir(flagsDir)
    const flagsToInsert = await Promise.all(
      filesInDir
        // ignore files that were provided as flags
        .filter((f) => !flagsToIgnore.has(f))
        .map(async (file) => {
          const contents = await readFile(join(flagsDir, file), 'utf8')
          const values = contents?.split('\n')
          return [parse(file).name, values]
        }),
    )

    for (const [flag, values] of flagsToInsert) {
      for (const value of values) {
        argv.push(`--${flag}`)
        if (value) argv.push(value)
      }
    }
  }

  return argv
}

export default hook
