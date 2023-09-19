import {arch} from 'node:os'
import {config as chaiConfig, expect} from 'chai'
import {Executor, Result, setup} from './util'

chaiConfig.truncateThreshold = 0

describe('oclif plugins', () => {
  let executor: Executor
  before(async () => {
    executor = await setup(__filename, {
      repo: 'https://github.com/oclif/hello-world',
      plugins: [
        '@oclif/plugin-autocomplete',
        '@oclif/plugin-commands',
        '@oclif/plugin-help',
        '@oclif/plugin-not-found',
        '@oclif/plugin-plugins',
        '@oclif/plugin-update',
        '@oclif/plugin-version',
        '@oclif/plugin-which',
      ],
    })
  })

  describe('plugin-help', () => {
    describe('<CLI> help', () => {
      let help: Result
      before(async () => {
        help = await executor.executeCommand('help')
      })

      it('should show description', () => {
        expect(help.stdout).to.include('oclif example Hello World CLI')
      })
      it('should show version', () => {
        expect(help.stdout).to.include('VERSION\n  oclif-hello-world/0.0.0')
      })
      it('should show usage', () => {
        expect(help.stdout).to.include('USAGE\n  $ oclif-hello-world [COMMAND]')
      })
      it('should show topics', () => {
        expect(help.stdout).to.include('TOPICS\n  plugins')
      })
      it('should show commands', () => {
        const regex = /COMMANDS\n\s\sautocomplete|\s\scommands|\s\shelp|\s\splugins|\s\sversion|\s\supdate|\s\swhich/
        expect(regex.test(help.stdout!)).to.be.true
      })
    })

    describe('help <TOPIC>', () => {
      let help: Result
      before(async () => {
        help = await executor.executeCommand('help plugins')
      })

      it('should show summary', () => {
        expect(help.stdout).to.include('List installed plugins.')
      })
      it('should show usage', () => {
        expect(help.stdout).to.include('USAGE\n  $ oclif-hello-world plugins [--json] [--core]')
      })
      it('should show description', () => {
        expect(help.stdout).to.include('DESCRIPTION\n  List installed plugins.')
      })
      it('should show examples', () => {
        expect(help.stdout).to.include('EXAMPLES\n  $ oclif-hello-world plugins')
      })
      it('should show commands', () => {
        const regex = /COMMANDS\n\s\splugins:inspect|\s\splugins:install|\s\splugins:link|\s\splugins:uninstall|\s\splugins:update/
        expect(regex.test(help.stdout!)).to.be.true
      })
    })

    describe('help <COMMAND>', () => {
      let help: Result
      before(async () => {
        help = await executor.executeCommand('help plugins:install')
      })

      it('should show summary', () => {
        expect(help.stdout).to.include('Installs a plugin into the CLI.')
      })
      it('should show usage', () => {
        expect(help.stdout).to.include('USAGE\n  $ oclif-hello-world plugins:install PLUGIN...')
      })
      it('should show arguments', () => {
        expect(help.stdout).to.include('ARGUMENTS\n  PLUGIN  Plugin to install.')
      })
      it('should show flags', () => {
        expect(help.stdout).to.include('FLAGS\n')
        expect(help.stdout).to.include('-f, --force    Run yarn install with force flag.')
        expect(help.stdout).to.include('-h, --help     Show CLI help.')
        expect(help.stdout).to.include('-v, --verbose')
      })
      it('should show description', () => {
        expect(help.stdout).to.include('DESCRIPTION\n  Installs a plugin into the CLI.')
      })
      it('should show aliases', () => {
        expect(help.stdout).to.include('ALIASES\n  $ oclif-hello-world plugins:add')
      })
      it('should show examples', () => {
        expect(help.stdout).to.include('EXAMPLES\n')
        expect(help.stdout).to.include('$ oclif-hello-world plugins:install myplugin')
        expect(help.stdout).to.include('$ oclif-hello-world plugins:install https://github.com/someuser/someplugin')
        expect(help.stdout).to.include('$ oclif-hello-world plugins:install someuser/someplugin')
      })
    })
  })

  describe('plugin-commands', () => {
    let commands: Result

    it('should show commands', async () => {
      commands = await executor.executeCommand('commands')
      expect(commands.stdout).to.include('commands')
      expect(commands.stdout).to.include('help')
      expect(commands.stdout).to.include('plugins')
      expect(commands.stdout).to.include('plugins:inspect')
      expect(commands.stdout).to.include('plugins:install')
      expect(commands.stdout).to.include('plugins:link')
      expect(commands.stdout).to.include('plugins:uninstall')
      expect(commands.stdout).to.include('plugins:update')
      expect(commands.stdout).to.include('version')
      expect(commands.stdout).to.include('which')
    })

    it('should filter commands', async () => {
      commands = await executor.executeCommand('commands --filter "command=plugins"')
      expect(commands.stdout).to.include('plugins')
      expect(commands.stdout).to.include('plugins:inspect')
      expect(commands.stdout).to.include('plugins:install')
      expect(commands.stdout).to.include('plugins:link')
      expect(commands.stdout).to.include('plugins:uninstall')
      expect(commands.stdout).to.include('plugins:update')

      expect(commands.stdout).to.not.include('commands')
      expect(commands.stdout).to.not.include('help')
      expect(commands.stdout).to.not.include('version')
      expect(commands.stdout).to.not.include('which')
    })

    it('should extend columns', async () => {
      commands = await executor.executeCommand('commands --extended')
      expect(commands.stdout).to.include('Command')
      expect(commands.stdout).to.include('Summary')
      expect(commands.stdout).to.include('Description')
      expect(commands.stdout).to.include('Usage')
      expect(commands.stdout).to.include('Plugin')
      expect(commands.stdout).to.include('Type')
      expect(commands.stdout).to.include('Hidden')
    })

    it('should filter columns', async () => {
      commands = await executor.executeCommand('commands --columns Command')
      expect(commands.stdout).to.include('Command')
      expect(commands.stdout).to.not.include('Summary')
    })

    it('should show commands in csv', async () => {
      commands = await executor.executeCommand('commands --csv')
      expect(commands.stdout).to.include('Command,Summary\n')
      expect(commands.stdout).to.include('commands')
      expect(commands.stdout).to.include('help')
      expect(commands.stdout).to.include('plugins')
      expect(commands.stdout).to.include('plugins:inspect')
      expect(commands.stdout).to.include('plugins:install')
      expect(commands.stdout).to.include('plugins:link')
      expect(commands.stdout).to.include('plugins:uninstall')
      expect(commands.stdout).to.include('plugins:update')
      expect(commands.stdout).to.include('version')
      expect(commands.stdout).to.include('which')
    })

    it('should show commands in json', async () => {
      commands = await executor.executeCommand('commands --json')
      const json = JSON.parse(commands.stdout!) as Array<{ id: string }>
      const commandIds = json.map(j => j.id)
      expect(commandIds).to.include('commands')
      expect(commandIds).to.include('help')
      expect(commandIds).to.include('plugins')
      expect(commandIds).to.include('plugins:inspect')
      expect(commandIds).to.include('plugins:install')
      expect(commandIds).to.include('plugins:link')
      expect(commandIds).to.include('plugins:uninstall')
      expect(commandIds).to.include('plugins:update')
      expect(commandIds).to.include('version')
      expect(commandIds).to.include('which')
    })
  })

  describe('plugin-plugins', () => {
    afterEach(async () => {
      await executor.executeCommand('plugins:uninstall @oclif/plugin-warn-if-update-available')
    })

    describe('installing a plugin by name', () => {
      it('should install the plugin', async () => {
        const result = await executor.executeCommand('plugins:install @oclif/plugin-warn-if-update-available 2>&1')
        expect(result.code).to.equal(0)
        expect(result.stdout).to.include('@oclif/plugin-warn-if-update-available@latest... installed v')

        const pluginsResult = await executor.executeCommand('plugins')
        expect(pluginsResult.code).to.equal(0)
        expect(pluginsResult.stdout).to.include('@oclif/plugin-warn-if-update-available')
      })
    })

    describe('installing a plugin by github url', () => {
      after(async () => {
        await executor.executeCommand('plugins:uninstall @oclif/plugin-warn-if-update-available 2>&1')
      })

      it('should install the plugin', async () => {
        const result = await executor.executeCommand('plugins:install https://github.com/oclif/plugin-warn-if-update-available')
        expect(result.code).to.equal(0)

        const pluginsResult = await executor.executeCommand('plugins --core')
        expect(pluginsResult.code).to.equal(0)
        expect(pluginsResult.stdout).to.include('@oclif/plugin-warn-if-update-available')
      })
    })

    describe('forcefully installing a plugin', () => {
      it('should install the plugin', async () => {
        const result = await executor.executeCommand('plugins:install @oclif/plugin-warn-if-update-available --force 2>&1')
        expect(result.code).to.equal(0)
        expect(result.stdout).to.include('@oclif/plugin-warn-if-update-available@latest... installed v')

        const pluginsResult = await executor.executeCommand('plugins')
        expect(pluginsResult.code).to.equal(0)
        expect(pluginsResult.stdout).to.include('@oclif/plugin-warn-if-update-available')
      })
    })

    describe('uninstalling a plugin', () => {
      beforeEach(async () => {
        await executor.executeCommand('plugins:install @oclif/plugin-warn-if-update-available')
      })

      it('should uninstall the plugin', async () => {
        const result = await executor.executeCommand('plugins:uninstall @oclif/plugin-warn-if-update-available 2>&1')
        expect(result.code).to.equal(0)
        expect(result.stdout).to.include('Uninstalling @oclif/plugin-warn-if-update-available... done\n')

        const pluginsResult = await executor.executeCommand('plugins')
        expect(pluginsResult.code).to.equal(0)
        expect(pluginsResult.stdout).to.not.include('@oclif/plugin-warn-if-update-available')
      })
    })
  })

  describe('plugin-version', () => {
    let version: Result
    before(async () => {
      version = await executor.executeCommand('version')
    })

    it('should show version', () => expect(version.stdout).to.include('oclif-hello-world/0.0.0'))
    it('should show platform', () => expect(version.stdout).to.include(process.platform))
    it('should show arch', () => expect(version.stdout).to.include(arch()))
    it('should show node version', () => expect(version.stdout).to.include(process.version))
  })

  describe('plugin-which', () => {
    it('should show the plugin that a command belongs to', async () => {
      const result = await executor.executeCommand('which plugins:install')
      expect(result.stdout).to.include('@oclif/plugin-plugins')
    })
  })
})
