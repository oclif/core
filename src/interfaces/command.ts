// import {Config, LoadOptions} from './config'
// import {ArgInput, BooleanFlagProps, Deprecation, FlagInput, OptionFlagProps} from './parser'
// import {Plugin as IPlugin} from './plugin'

export type Example = string | {
  description: string;
  command: string;
}

// export interface CommandProps {
//   /** A command ID, used mostly in error or verbose reporting. */
//   id: string;

//   /** Hide the command from help */
//   hidden: boolean;

//   /** Mark the command as a given state (e.g. beta or deprecated) in help */
//   state?: 'beta' | 'deprecated' | string;

//   /**
//    * Provide details to the deprecation warning if state === 'deprecated'
//    */
//   deprecationOptions?: Deprecation;

//   /** An array of aliases for this command. */
//   aliases: string[];

//   /**
//    * The tweet-sized description for your class, used in a parent-commands
//    * sub-command listing and as the header for the command help.
//    */
//   summary?: string;

//   /**
//    * A full description of how to use the command.
//    *
//    * If no summary, the first line of the description will be used as the summary.
//    */
//   description?: string;

//   /**
//    * An override string (or strings) for the default usage documentation.
//    */
//   usage?: string | string[];

//   /**
//    * An array of examples to show at the end of the command's help.
//    *
//    * IF only a string is provide, it will try to look for a line that starts
//    * with the cmd.bin as the example command and the rest as the description.
//    * If found, the command will be formatted appropriately.
//    *
//    * ```
//    * EXAMPLES:
//    *   A description of a particular use case.
//    *
//    *     $ <%= config.bin => command flags
//    * ```
//    */
//   examples?: Example[];

//   /** When set to false, allows a variable amount of arguments */
//   strict?: boolean;
// }

// export interface Command extends CommandProps {
//   [key: string]: unknown;
//   type?: string;
//   pluginName?: string;
//   pluginType?: string;
//   pluginAlias?: string;
//   flags: {[name: string]: Command.Flag};
//   args: Command.Arg[];
//   hasDynamicHelp?: boolean;
// }

// export namespace Command {
//   export interface Arg {
//     name: string;
//     description?: string;
//     required?: boolean;
//     hidden?: boolean;
//     default?: string;
//     options?: string[];
//   }

//   export type Flag = Flag.Boolean | Flag.Option

//   export namespace Flag {
//     // We can't use "export OptionFlagProps as Option" in the namespace export.
//     // eslint-disable-next-line @typescript-eslint/no-empty-interface
//     export interface Boolean extends BooleanFlagProps {}
//     export interface Option extends OptionFlagProps {
//       default?: string;
//       defaultHelp?: () => Promise<string>
//     }
//   }

//   // This represents the static properties of a command class.
//   export interface Base extends CommandProps {
//     _base: string;
//   }

//   // This represents the uninstantiated Command with properties added by Plugin.findCommand
//   export interface Class extends Base {
//     plugin?: IPlugin;
//     flags?: FlagInput<any>;
//     args?: ArgInput;
//     strict: boolean;
//     hasDynamicHelp?: boolean;

//     new(argv: string[], config: Config): Instance;
//     run(argv?: string[], config?: LoadOptions): PromiseLike<any>;
//   }

//   // This represents the instantiated Command
//   export interface Instance {
//     _run(argv: string[]): Promise<any>;
//   }

//   // This represents the cached command with added load() method
//   export interface Loadable extends Command {
//     load(): Promise<Class>;
//   }

//   /**
//    * @deprecated use Command.Loadable instead.
//    */
//   export interface Plugin extends Command {
//     load(): Promise<Class>;
//   }
// }
