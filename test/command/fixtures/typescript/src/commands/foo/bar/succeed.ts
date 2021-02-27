export class Command {
  static description = 'succeed description'

  static run() {
    console.log('it works!')
    return 'returned success!'
  }
}
