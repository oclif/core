import FooBar from './commands/foo/bar'
import FooBaz from './commands/foo/baz'
export {default as initHook} from './hooks/init'

export const commands = {
  'foo:bar': FooBar,
  'foo:baz': FooBaz,
  'foo:alias': FooBar,
}
