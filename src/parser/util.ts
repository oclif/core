export function pickBy<T>(obj: T, fn: (i: T[keyof T]) => boolean): Partial<T> {
  return Object.entries(obj)
  .reduce((o, [k, v]) => {
    if (fn(v)) o[k] = v
    return o
  }, {} as any)
}

export function maxBy<T>(arr: T[], fn: (i: T) => number): T | undefined {
  let max: {element: T; i: number} | undefined
  for (const cur of arr) {
    const i = fn(cur)
    if (!max || i > max.i) {
      max = {i, element: cur}
    }
  }

  return max && max.element
}

type SortTypes = string | number | undefined | boolean

export function sortBy<T>(arr: T[], fn: (i: T) => SortTypes | SortTypes[]): T[] {
  // function castType(t: SortTypes | SortTypes[]): string | number | SortTypes[] {
  //   if (t === undefined) return 0
  //   if (t === false) return 1
  //   if (t === true) return -1
  //   return t
  // }

  function compare(a: SortTypes | SortTypes[], b: SortTypes | SortTypes[]): number {
    a = a === undefined ? 0 : a
    b = b === undefined ? 0 : b

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length === 0 && b.length === 0) return 0
      const diff = compare(a[0], b[0])
      if (diff !== 0) return diff
      return compare(a.slice(1), b.slice(1))
    }

    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  return arr.sort((a, b) => compare(fn(a), fn(b)))
}
