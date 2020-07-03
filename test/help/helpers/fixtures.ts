import {Command} from '@oclif/command'
import {Topic} from '@oclif/config'

// apps

export class AppsCreate extends Command {
  static id = 'apps:create'

  static description = `Create an app
  this only shows up in command help under DESCRIPTION`;

  static flags = {};

  static args = [];

  async run() {
    'run'
  }
}

export class AppsDestroy extends Command {
  static id = 'apps:destroy'

  static description = `Destroy an app
  this only shows up in command help under DESCRIPTION`;

  static flags: {};

  static args = [];

  async run() {
    'run'
  }
}

export class AppsIndex extends Command {
  static id = 'apps'

  static description = `List all apps (app index command)
  this only shows up in command help under DESCRIPTION`;

  static flags: {};

  static args = [];

  async run() {
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
  static id = 'apps:admin'

  static description = `List of admins for an app
  this only shows up in command help under DESCRIPTION`;

  static flags: {};

  static args = [];

  async run() {
    'run'
  }
}

export class AppsAdminAdd extends Command {
  static id = 'apps:admin:add'

  static description = `Add user to an app
  this only shows up in command help under DESCRIPTION`;

  static flags: {};

  static args = [];

  async run() {
    'run'
  }
}

// db

export class DbCreate extends Command {
  static id = 'db:create'

  static description = `Create a db
  this only shows up in command help under DESCRIPTION`;

  static flags = {};

  static args = [];

  async run() {
    'run'
  }
}

export const DbTopic: Topic = {
  name: 'db',
  description: 'This topic is for the db topic',
}
