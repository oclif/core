export const Command = {
  run(): void {
    console.log('it fails!')
    throw new Error('random error')
  },
}
