import {Errors, stdout} from '..'

function timeout(p: Promise<any>, ms: number) {
  function wait(ms: number, unref = false) {
    return new Promise(resolve => {
      const t: any = setTimeout(() => resolve(null), ms)
      if (unref) t.unref()
    })
  }

  return Promise.race([p, wait(ms, true).then(() => Errors.error('timed out'))])
}

async function _flush() {
  const p = new Promise(resolve => {
    stdout.once('drain', () => resolve(null))
  })
  const flushed = stdout.write('')

  if (flushed) {
    return Promise.resolve()
  }

  return p
}

export async function flush(ms = 10_000): Promise<void> {
  await timeout(_flush(), ms)
}
