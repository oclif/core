export default function postrun(options) {
  console.log('running esm postrun hook')
  if (options.Command.id === 'foo:bar:test-result') {
    console.log(options.result)
  }
}
