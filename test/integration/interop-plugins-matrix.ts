export type PluginConfig = {
  name: string
  command: string
  package: string
  repo: string
  commandText: string
  hookText: string
  expectJson: {
    whenProvided: {
      args: Record<string, string | boolean>
      flags: Record<string, string | boolean>
    }
    whenNotProvided: {
      args: Record<string, string | null | boolean>
      flags: Record<string, string | null | boolean>
    }
  }
}

const commonProps = {
  expectJson: {
    whenProvided: {
      args: {
        optionalArg: 'arg1',
        defaultArg: 'arg2',
        defaultFnArg: 'arg3',
      },
      flags: {
        optionalString: 'flag1',
        defaultString: 'flag2',
        defaultFnString: 'flag3',
        json: true,
      },
    },
    whenNotProvided: {
      args: {
        defaultArg: 'simple string default',
        defaultFnArg: 'async fn default',
      },
      flags: {
        defaultString: 'simple string default',
        defaultFnString: 'async fn default',
        json: true,
      },
    },
  },
}

export const plugins: Record<string, PluginConfig> = {
  esm1: {
    name: 'plugin-test-esm-1',
    command: 'esm1',
    package: '@oclif/plugin-test-esm-1',
    repo: 'https://github.com/oclif/plugin-test-esm-1',
    commandText: 'hello I am an ESM plugin',
    hookText: 'Greetings! from plugin-test-esm-1 init hook',
    ...commonProps,
  },
  esm2: {
    name: 'plugin-test-esm-2',
    command: 'esm2',
    package: '@oclif/plugin-test-esm-2',
    repo: 'https://github.com/oclif/plugin-test-esm-2',
    commandText: 'hello I am an ESM plugin',
    hookText: 'Greetings! from plugin-test-esm-2 init hook',
    ...commonProps,
  },
  cjs1: {
    name: 'plugin-test-cjs-1',
    command: 'cjs1',
    package: '@oclif/plugin-test-cjs-1',
    repo: 'https://github.com/oclif/plugin-test-cjs-1',
    commandText: 'hello I am a CJS plugin',
    hookText: 'Greetings! from plugin-test-cjs-1 init hook',
    ...commonProps,
  },
  cjs2: {
    name: 'plugin-test-cjs-2',
    command: 'cjs2',
    package: '@oclif/plugin-test-cjs-2',
    repo: 'https://github.com/oclif/plugin-test-cjs-2',
    commandText: 'hello I am a CJS plugin',
    hookText: 'Greetings! from plugin-test-cjs-2 init hook',
    ...commonProps,
  },
  precore: {
    name: 'plugin-test-pre-core',
    command: 'pre-core',
    package: '@oclif/plugin-test-pre-core',
    repo: 'https://github.com/oclif/plugin-test-pre-core',
    commandText: 'hello I am a pre-core plugin',
    hookText: 'Greetings! from plugin-test-pre-core init hook',
    expectJson: {
      whenProvided: commonProps.expectJson.whenProvided,
      whenNotProvided: {
        args: {
          defaultArg: 'simple string default',
          defaultFnArg: 'fn default',
        },
        flags: {
          defaultString: 'simple string default',
          defaultFnString: 'fn default',
          json: true,
        },
      },
    },
  },
  coreV1: {
    name: 'plugin-test-core-v1',
    command: 'core-v1',
    package: '@oclif/plugin-test-core-v1',
    repo: 'https://github.com/oclif/plugin-test-core-v1',
    commandText: 'hello I am an @oclif/core@v1 plugin',
    hookText: 'Greetings! from plugin-test-core-v1 init hook',
    ...commonProps,
  },
  coreV2: {
    name: 'plugin-test-core-v2',
    command: 'core-v2',
    package: '@oclif/plugin-test-core-v2',
    repo: 'https://github.com/oclif/plugin-test-core-v2',
    commandText: 'hello I am an @oclif/core@v2 plugin',
    hookText: 'Greetings! from plugin-test-core-v2 init hook',
    ...commonProps,
  },
}
