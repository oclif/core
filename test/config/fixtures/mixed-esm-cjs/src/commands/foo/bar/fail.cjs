class Command {
  static run() {
    console.log('it fails!')
    throw new Error('random error')
  }
}

module.exports = Command
