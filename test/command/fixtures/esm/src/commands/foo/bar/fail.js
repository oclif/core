export class Command {
  static description = 'fail description'

  static run() {
    console.log('it fails!')
    throw new Error('random error')
  }
}
