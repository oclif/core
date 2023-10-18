import {join} from 'node:path'

import {PJSON} from '../interfaces'
import {Plugin as IPlugin, Options} from '../interfaces/plugin'
import {OCLIF_MARKER_OWNER, Performance} from '../performance'
import {readJson} from '../util/fs'
import {isProd} from '../util/util'
import * as Plugin from './plugin'
import {Debug} from './util'

// eslint-disable-next-line new-cap
const debug = Debug()

type PluginLoaderOptions = {
  plugins?: IPlugin[] | PluginsMap
  root: string
}

type LoadOpts = {
  dataDir: string
  devPlugins?: boolean
  force?: boolean
  rootPlugin: IPlugin
  userPlugins?: boolean
}

type PluginsMap = Map<string, IPlugin>

export default class PluginLoader {
  public errors: (Error | string)[] = []
  public plugins: PluginsMap = new Map()
  private pluginsProvided = false

  constructor(public options: PluginLoaderOptions) {
    if (options.plugins) {
      this.pluginsProvided = true
      this.plugins = Array.isArray(options.plugins) ? new Map(options.plugins.map((p) => [p.name, p])) : options.plugins
    }
  }

  public async loadChildren(opts: LoadOpts): Promise<{errors: (Error | string)[]; plugins: PluginsMap}> {
    if (!this.pluginsProvided || opts.force) {
      await this.loadUserPlugins(opts)
      await this.loadDevPlugins(opts)
      await this.loadCorePlugins(opts)
    }

    return {errors: this.errors, plugins: this.plugins}
  }

  public async loadRoot(): Promise<IPlugin> {
    let rootPlugin: IPlugin
    if (this.pluginsProvided) {
      const plugins = [...this.plugins.values()]
      rootPlugin = plugins.find((p) => p.root === this.options.root) ?? plugins[0]
    } else {
      const marker = Performance.mark(OCLIF_MARKER_OWNER, 'plugin.load#root')
      rootPlugin = new Plugin.Plugin({isRoot: true, root: this.options.root})
      await rootPlugin.load()
      marker?.addDetails({
        commandCount: rootPlugin.commands.length,
        hasManifest: rootPlugin.hasManifest ?? false,
        name: rootPlugin.name,
        topicCount: rootPlugin.topics.length,
        type: rootPlugin.type,
        usesMain: Boolean(rootPlugin.pjson.main),
      })
      marker?.stop()
    }

    this.plugins.set(rootPlugin.name, rootPlugin)
    return rootPlugin
  }

  private async loadCorePlugins(opts: LoadOpts): Promise<void> {
    if (opts.rootPlugin.pjson.oclif.plugins) {
      await this.loadPlugins(opts.rootPlugin.root, 'core', opts.rootPlugin.pjson.oclif.plugins)
    }
  }

  private async loadDevPlugins(opts: LoadOpts): Promise<void> {
    if (opts.devPlugins !== false) {
      // do not load oclif.devPlugins in production
      if (isProd()) return
      try {
        const {devPlugins} = opts.rootPlugin.pjson.oclif
        if (devPlugins) await this.loadPlugins(opts.rootPlugin.root, 'dev', devPlugins)
      } catch (error: any) {
        process.emitWarning(error)
      }
    }
  }

  private async loadPlugins(
    root: string,
    type: string,
    plugins: ({name?: string; root?: string; tag?: string; url?: string} | string)[],
    parent?: Plugin.Plugin,
  ): Promise<void> {
    if (!plugins || plugins.length === 0) return
    const mark = Performance.mark(OCLIF_MARKER_OWNER, `config.loadPlugins#${type}`)
    debug('loading plugins', plugins)
    await Promise.all(
      (plugins || []).map(async (plugin) => {
        try {
          const name = typeof plugin === 'string' ? plugin : plugin.name!
          const opts: Options = {
            name,
            root,
            type,
          }
          if (typeof plugin !== 'string') {
            opts.tag = plugin.tag || opts.tag
            opts.root = plugin.root || opts.root
            opts.url = plugin.url
          }

          if (parent) {
            opts.parent = parent
          }

          if (this.plugins.has(name)) return
          const pluginMarker = Performance.mark(OCLIF_MARKER_OWNER, `plugin.load#${name}`)
          const instance = new Plugin.Plugin(opts)
          await instance.load()
          pluginMarker?.addDetails({
            commandCount: instance.commands.length,
            hasManifest: instance.hasManifest,
            name: instance.name,
            topicCount: instance.topics.length,
            type: instance.type,
            usesMain: Boolean(instance.pjson.main),
          })
          pluginMarker?.stop()

          this.plugins.set(instance.name, instance)
          if (parent) {
            instance.parent = parent
            if (!parent.children) parent.children = []
            parent.children.push(instance)
          }

          await this.loadPlugins(instance.root, type, instance.pjson.oclif.plugins || [], instance)
        } catch (error: any) {
          this.errors.push(error)
        }
      }),
    )

    mark?.addDetails({pluginCount: plugins.length})
    mark?.stop()
  }

  private async loadUserPlugins(opts: LoadOpts): Promise<void> {
    if (opts.userPlugins !== false) {
      try {
        const userPJSONPath = join(opts.dataDir, 'package.json')
        debug('reading user plugins pjson %s', userPJSONPath)
        const pjson = await readJson<PJSON>(userPJSONPath)
        if (!pjson.oclif) pjson.oclif = {schema: 1}
        if (!pjson.oclif.plugins) pjson.oclif.plugins = []
        await this.loadPlugins(
          userPJSONPath,
          'user',
          pjson.oclif.plugins.filter((p: any) => p.type === 'user'),
        )
        await this.loadPlugins(
          userPJSONPath,
          'link',
          pjson.oclif.plugins.filter((p: any) => p.type === 'link'),
        )
      } catch (error: any) {
        if (error.code !== 'ENOENT') process.emitWarning(error)
      }
    }
  }
}
