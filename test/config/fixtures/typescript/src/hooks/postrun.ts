// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function postrun(options: any): void {
  console.log('running ts postrun hook')
  if (options.Command.id === 'foo:bar:test-result') {
    console.log(options.result)
  }
}
