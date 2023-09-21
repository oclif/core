export default (ms = 1000): Promise<void> => new Promise(resolve => {
  setTimeout(resolve, ms)
})
