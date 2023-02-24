export const Command = {
  description: 'succeed description',

  run(): string {
    console.log('it works!')
    return 'returned success!'
  },
}
