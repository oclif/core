import spinners from './spinners'

export type Options = {
  stdout?: boolean
  style?: keyof typeof spinners
}

export type StatusOptions = {
  newline?: boolean
}
