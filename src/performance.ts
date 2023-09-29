import {PerformanceObserver, performance} from 'node:perf_hooks'
import {settings} from './settings'

type Details = Record<string, string | boolean | number | string[]>
type PerfResult = {
  name: string
  duration: number
  details: Details
  module: string
  method: string | undefined
  scope: string | undefined
}

type PerfHighlights = {
  configLoadTime: number
  runTime: number
  initTime: number
  commandLoadTime: number
  commandRunTime: number
  pluginLoadTimes: Record<string, {duration: number; details: Details}>
  corePluginsLoadTime: number
  userPluginsLoadTime: number
  linkedPluginsLoadTime: number
  hookRunTimes: Record<string, Record<string, number>>
}

class Marker {
  public module: string
  public method: string
  public scope: string
  public stopped = false

  private startMarker: string
  private stopMarker: string

  constructor(
    public name: string,
    public details: Details = {},
  ) {
    this.startMarker = `${this.name}-start`
    this.stopMarker = `${this.name}-stop`
    const [caller, scope] = name.split('#')
    const [module, method] = caller.split('.')
    this.module = module
    this.method = method
    this.scope = scope

    performance.mark(this.startMarker)
  }

  public addDetails(details: Details): void {
    this.details = {...this.details, ...details}
  }

  public stop() {
    this.stopped = true
    performance.mark(this.stopMarker)
  }

  public measure() {
    performance.measure(this.name, this.startMarker, this.stopMarker)
  }
}

export class Performance {
  private static markers: Record<string, Marker> = {}
  private static _results: PerfResult[] = []
  private static _highlights: PerfHighlights

  public static get enabled(): boolean {
    return settings.performanceEnabled ?? false
  }

  public static get results(): PerfResult[] {
    if (!Performance.enabled) return []
    if (Performance._results.length > 0) return Performance._results

    throw new Error('Perf results not available. Did you forget to call await Performance.collect()?')
  }

  public static getResult(name: string): PerfResult | undefined {
    return Performance.results.find((r) => r.name === name)
  }

  public static get highlights(): PerfHighlights {
    if (!Performance.enabled) return {} as PerfHighlights

    if (Performance._highlights) return Performance._highlights

    throw new Error('Perf results not available. Did you forget to call await Performance.collect()?')
  }

  /**
   * Add a new performance marker
   *
   * @param name Name of the marker. Use `module.method#scope` format
   * @param details Arbitrary details to attach to the marker
   * @returns Marker instance
   */
  public static mark(name: string, details: Details = {}): Marker | undefined {
    if (!Performance.enabled) return

    const marker = new Marker(name, details)
    Performance.markers[marker.name] = marker
    return marker
  }

  /**
   * Collect performance results into static Performance.results
   *
   * @returns Promise<void>
   */
  public static async collect(): Promise<void> {
    if (!Performance.enabled) return

    if (Performance._results.length > 0) return

    const markers = Object.values(Performance.markers)
    if (markers.length === 0) return

    for (const marker of markers.filter((m) => !m.stopped)) {
      marker.stop()
    }

    return new Promise((resolve) => {
      const perfObserver = new PerformanceObserver((items) => {
        for (const entry of items.getEntries()) {
          if (Performance.markers[entry.name]) {
            const marker = Performance.markers[entry.name]
            Performance._results.push({
              name: entry.name,
              module: marker.module,
              method: marker.method,
              scope: marker.scope,
              duration: entry.duration,
              details: marker.details,
            })
          }
        }

        const command = Performance.results.find((r) => r.name.startsWith('config.runCommand'))
        const commandLoadTime = command
          ? Performance.getResult(`plugin.findCommand#${command.details.plugin}.${command.details.command}`)
              ?.duration ?? 0
          : 0

        const pluginLoadTimes = Object.fromEntries(
          Performance.results
            .filter(({name}) => name.startsWith('plugin.load#'))
            .sort((a, b) => b.duration - a.duration)
            .map(({scope, duration, details}) => [scope, {duration, details}]),
        )

        const hookRunTimes = Performance.results
          .filter(({name}) => name.startsWith('config.runHook#'))
          .reduce(
            (acc, perfResult) => {
              const event = perfResult.details.event as string
              if (event) {
                if (!acc[event]) acc[event] = {}
                acc[event][perfResult.scope!] = perfResult.duration
              } else {
                const event = perfResult.scope!
                if (!acc[event]) acc[event] = {}
                acc[event].total = perfResult.duration
              }

              return acc
            },
            {} as Record<string, Record<string, number>>,
          )

        const pluginLoadTimeByType = Object.fromEntries(
          Performance.results
            .filter(({name}) => name.startsWith('config.loadPlugins#'))
            .sort((a, b) => b.duration - a.duration)
            .map(({scope, duration}) => [scope, duration]),
        )

        const commandRunTime =
          Performance.results.find(({name}) => name.startsWith('config.runCommand#'))?.duration ?? 0

        Performance._highlights = {
          configLoadTime: Performance.getResult('config.load')?.duration ?? 0,
          runTime: Performance.getResult('main.run')?.duration ?? 0,
          initTime: Performance.getResult('main.run#init')?.duration ?? 0,
          commandRunTime,
          commandLoadTime,
          pluginLoadTimes,
          hookRunTimes,
          corePluginsLoadTime: pluginLoadTimeByType.core ?? 0,
          userPluginsLoadTime: pluginLoadTimeByType.user ?? 0,
          linkedPluginsLoadTime: pluginLoadTimeByType.link ?? 0,
        }

        resolve()
      })
      perfObserver.observe({entryTypes: ['measure'], buffered: true})

      for (const marker of markers) {
        try {
          marker.measure()
        } catch {
          // ignore
        }
      }

      performance.clearMarks()
    })
  }

  /**
   * Add debug logs for plugin loading performance
   * @returns void
   */
  public static debug(): void {
    if (!Performance.enabled) return

    const debug = require('debug')('perf')
    debug('Total Time: %sms', Performance.highlights.runTime.toFixed(4))
    debug('Init Time: %sms', Performance.highlights.initTime.toFixed(4))
    debug('Config Load Time: %sms', Performance.highlights.configLoadTime.toFixed(4))
    debug('  • Plugins Load Time: %sms', Performance.getResult('config.loadAllPlugins')?.duration.toFixed(4) ?? 0)
    debug('  • Commands Load Time: %sms', Performance.getResult('config.loadAllCommands')?.duration.toFixed(4) ?? 0)
    debug('Core Plugin Load Time: %sms', Performance.highlights.corePluginsLoadTime.toFixed(4))
    debug('User Plugin Load Time: %sms', Performance.highlights.userPluginsLoadTime.toFixed(4))
    debug('Linked Plugin Load Time: %sms', Performance.highlights.linkedPluginsLoadTime.toFixed(4))
    debug('Plugin Load Times:')
    for (const [plugin, result] of Object.entries(Performance.highlights.pluginLoadTimes)) {
      if (result.details.hasManifest) {
        debug(`  ${plugin}: ${result.duration.toFixed(4)}ms`)
      } else {
        debug(`  ${plugin}: ${result.duration.toFixed(4)}ms (no manifest!)`)
      }
    }

    debug('Hook Run Times:')
    for (const [event, runTimes] of Object.entries(Performance.highlights.hookRunTimes)) {
      debug(`  ${event}:`)
      for (const [plugin, duration] of Object.entries(runTimes)) {
        debug(`    ${plugin}: ${duration.toFixed(4)}ms`)
      }
    }

    debug('Command Load Time: %sms', Performance.highlights.commandLoadTime.toFixed(4))
    debug('Command Run Time: %sms', Performance.highlights.commandRunTime.toFixed(4))
  }
}
