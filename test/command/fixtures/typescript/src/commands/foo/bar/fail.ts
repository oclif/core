export const Command = {
  description: 'fail description',

  run() {
    console.log('it fails!')
    throw new Error('random error')
  },
}
