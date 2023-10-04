import {Command} from '../../../src'
import {Topic} from '../../../src/interfaces'

// apps

export class AppsCreate extends Command {
  static args = {}

  static description = 'this only shows up in command help under DESCRIPTION'

  static flags = {}

  static id = 'apps:create'

  static summary = 'Create an app'

  async run(): Promise<void> {
    'run'
  }
}

export class AppsDestroy extends Command {
  static args = {}

  static description = `Destroy an app
  this only shows up in command help under DESCRIPTION`

  static flags: Record<string, never> = {}

  static id = 'apps:destroy'

  async run(): Promise<void> {
    'run'
  }
}

export class AppsIndex extends Command {
  static args = {}

  static flags: Record<string, never> = {}

  static id = 'apps'

  static summary = 'List all apps (app index command)'

  async run(): Promise<void> {
    'run'
  }
}

export class AppsIndexWithDesc extends Command {
  static args = {}

  static description = `List all apps (app index command)
this only shows up in command help under DESCRIPTION`

  static flags: Record<string, never> = {}

  static id = 'apps'

  async run(): Promise<void> {
    'run'
  }
}

export const AppsTopic: Topic = {
  name: 'apps',
  description: 'This topic is for the apps topic',
}

// apps:admin

export const AppsAdminTopic: Topic = {
  name: 'apps:admin',
  description: 'This topic is for the apps topic',
}

export class AppsAdminIndex extends Command {
  static args = {}

  static description = `List of admins for an app
  this only shows up in command help under DESCRIPTION`

  static flags: Record<string, never> = {}

  static id = 'apps:admin'

  async run(): Promise<void> {
    'run'
  }
}

export class AppsAdminAdd extends Command {
  static args = {}

  static description = `Add user to an app
  this only shows up in command help under DESCRIPTION`

  static flags: Record<string, never> = {}

  static id = 'apps:admin:add'

  async run(): Promise<void> {
    'run'
  }
}

// db

export class DbCreate extends Command {
  static args = {}

  static description = `Create a db
  this only shows up in command help under DESCRIPTION`

  static flags = {}

  static id = 'db:create'

  async run(): Promise<void> {
    'run'
  }
}

export const DbTopic: Topic = {
  name: 'db',
  description: 'This topic is for the db topic',
}

// deprecateAliases
export class DeprecateAliases extends Command {
  static aliases = ['foo:bar:alias']

  static args = {}

  static deprecateAliases = true

  static flags = {}

  static id = 'foo:bar'

  async run(): Promise<void> {
    'run'
  }
}
