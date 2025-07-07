export default function finallyHook(options: any): void {
  console.log('running ts finally hook')
  if (options.error) {
    console.log('an error occurred')
  }
}
