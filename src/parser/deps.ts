export default () => {
  const cache: {[k: string]: any} = {}
  return {
    add<T, K extends string, U>(this: T, name: K, fn: () => U): T & {[P in K]: U} {
      Object.defineProperty(this, name, {
        enumerable: true,
        get: () => {
          cache[name] = cache[name] || fn()
          return cache[name]
        },
      })
      return this as any
    },
  }
}
