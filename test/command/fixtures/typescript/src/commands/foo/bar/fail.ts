export const Command = {
  description: 'fail description',

  run(): void {
    console.log('it fails!')
    throw new Error('random error')
  },
}
