export const Command = {
  run() {
    console.log('it fails!')
    throw new Error('random error')
  },
}
