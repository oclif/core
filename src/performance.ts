import {performance, PerformanceObserver} from 'node:perf_hooks'

import {makeDebug} from './logger'
import {settings} from './settings'

type Details = Record<string, boolean | number | string | string[]>
type PerfResult = {
  details: Details
  duration: number
  method: string | undefined
  module: string
  name: string
  scope: string | undefined
}

type PerfHighlights = {
  hookRunTimes: Record<string, Record<string, number>>
  'oclif.commandLoadMs': number
  'oclif.commandRunMs': number
  'oclif.configLoadMs': number
  'oclif.corePluginsLoadMs': number
  'oclif.initHookMs': number
  'oclif.initMs': number
  'oclif.linkedPluginsLoadMs': number
  'oclif.postrunHookMs': number
  'oclif.prerunHookMs': number
  'oclif.runMs': number
  'oclif.userPluginsLoadMs': number
  pluginLoadTimes: Record<string, {details: Details; duration: number}>
}
export const OCLIF_MARKER_OWNER = '@oclif/core'

class Marker {
  public method: string
  public module: string
  public scope: string
  public stopped = false
  private startMarker: string
  private stopMarker: string

  constructor(
    public owner: string,
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

  public measure() {
    performance.measure(this.name, this.startMarker, this.stopMarker)
  }

  public stop() {
    this.stopped = true
    performance.mark(this.stopMarker)
  }
}

export class Performance {
  private static _oclifPerf: PerfHighlights
  /* Key: marker.owner */
  private static _results = new Map<string, PerfResult[]>()
  /* Key: marker.name */
  private static markers = new Map<string, Marker>()

  /**
   * Collect performance results into static Performance.results
   *
   * @returns Promise<void>
   */
  public static async collect(): Promise<void> {
    if (!Performance.enabled) return

    if (Performance._results.size > 0) return

    const markers = [...Performance.markers.values()]
    if (markers.length === 0) return

    for (const marker of markers.filter((m) => !m.stopped)) {
      marker.stop()
    }

    return new Promise((resolve) => {
      // eslint-disable-next-line complexity
      const perfObserver = new PerformanceObserver((items) => {
        for (const entry of items.getEntries()) {
          const marker = Performance.markers.get(entry.name)
          if (marker) {
            const result = {
              details: marker.details,
              duration: entry.duration,
              method: marker.method,
              module: marker.module,
              name: entry.name,
              scope: marker.scope,
            }

            const existing = Performance._results.get(marker.owner) ?? []
            Performance._results.set(marker.owner, [...existing, result])
          }
        }

        const oclifResults = Performance._results.get(OCLIF_MARKER_OWNER) ?? []
        const command = oclifResults.find((r) => r.name.startsWith('config.runCommand'))
        const commandLoadTime = command
          ? (Performance.getResult(
              OCLIF_MARKER_OWNER,
              `plugin.findCommand#${command.details.plugin}.${command.details.command}`,
            )?.duration ?? 0)
          : 0

        const pluginLoadTimes = Object.fromEntries(
          oclifResults
            .filter(({name}) => name.startsWith('plugin.load#'))
            .sort((a, b) => b.duration - a.duration)
            .map(({details, duration, scope}) => [scope, {details, duration}]),
        )

        const hookRunTimes = oclifResults
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
          oclifResults
            .filter(({name}) => name.startsWith('config.loadPlugins#'))
            .sort((a, b) => b.duration - a.duration)
            .map(({duration, scope}) => [scope, duration]),
        )

        Performance._oclifPerf = {
          hookRunTimes,
          'oclif.commandLoadMs': commandLoadTime,
          'oclif.commandRunMs': oclifResults.find(({name}) => name.startsWith('config.runCommand#'))?.duration ?? 0,
          'oclif.configLoadMs': Performance.getResult(OCLIF_MARKER_OWNER, 'config.load')?.duration ?? 0,
          'oclif.corePluginsLoadMs': pluginLoadTimeByType.core ?? 0,
          'oclif.initHookMs': hookRunTimes.init?.total ?? 0,
          'oclif.initMs': Performance.getResult(OCLIF_MARKER_OWNER, 'main.run#init')?.duration ?? 0,
          'oclif.linkedPluginsLoadMs': pluginLoadTimeByType.link ?? 0,

          'oclif.postrunHookMs': hookRunTimes.postrun?.total ?? 0,
          'oclif.prerunHookMs': hookRunTimes.prerun?.total ?? 0,
          'oclif.runMs': Performance.getResult(OCLIF_MARKER_OWNER, 'main.run')?.duration ?? 0,
          'oclif.userPluginsLoadMs': pluginLoadTimeByType.user ?? 0,
          pluginLoadTimes,
        }

        resolve()
      })
      perfObserver.observe({buffered: true, entryTypes: ['measure']})

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
   */
  public static debug(): void {
    if (!Performance.enabled) return

    const oclifDebug = makeDebug('perf')
    const processUpTime = (process.uptime() * 1000).toFixed(4)
    oclifDebug('Process Uptime: %sms', processUpTime)
    oclifDebug('Oclif Time: %sms', Performance.oclifPerf['oclif.runMs'].toFixed(4))
    oclifDebug('Init Time: %sms', Performance.oclifPerf['oclif.initMs'].toFixed(4))
    oclifDebug('Config Load Time: %sms', Performance.oclifPerf['oclif.configLoadMs'].toFixed(4))
    oclifDebug(
      '  • Root Plugin Load Time: %sms',
      Performance.getResult(OCLIF_MARKER_OWNER, 'plugin.load#root')?.duration.toFixed(4) ?? 0,
    )
    oclifDebug(
      '  • Plugins Load Time: %sms',
      Performance.getResult(OCLIF_MARKER_OWNER, 'config.loadAllPlugins')?.duration.toFixed(4) ?? 0,
    )
    oclifDebug(
      '  • Commands Load Time: %sms',
      Performance.getResult(OCLIF_MARKER_OWNER, 'config.loadAllCommands')?.duration.toFixed(4) ?? 0,
    )
    oclifDebug('Core Plugin Load Time: %sms', Performance.oclifPerf['oclif.corePluginsLoadMs'].toFixed(4))
    oclifDebug('User Plugin Load Time: %sms', Performance.oclifPerf['oclif.userPluginsLoadMs'].toFixed(4))
    oclifDebug('Linked Plugin Load Time: %sms', Performance.oclifPerf['oclif.linkedPluginsLoadMs'].toFixed(4))
    oclifDebug('Plugin Load Times:')
    for (const [plugin, result] of Object.entries(Performance.oclifPerf.pluginLoadTimes)) {
      if (result.details.hasManifest) {
        oclifDebug(`  ${plugin}: ${result.duration.toFixed(4)}ms`)
      } else {
        oclifDebug(`  ${plugin}: ${result.duration.toFixed(4)}ms (no manifest!)`)
      }
    }

    oclifDebug('Hook Run Times:')
    for (const [event, runTimes] of Object.entries(Performance.oclifPerf.hookRunTimes)) {
      oclifDebug(`  ${event}:`)
      for (const [plugin, duration] of Object.entries(runTimes)) {
        oclifDebug(`    ${plugin}: ${duration.toFixed(4)}ms`)
      }
    }

    oclifDebug('Command Load Time: %sms', Performance.oclifPerf['oclif.commandLoadMs'].toFixed(4))
    oclifDebug('Command Run Time: %sms', Performance.oclifPerf['oclif.commandRunMs'].toFixed(4))
    if (Performance.oclifPerf['oclif.configLoadMs'] > Performance.oclifPerf['oclif.runMs']) {
      oclifDebug(
        '! Config load time is greater than total oclif time. This might mean that Config was instantiated before oclif was run.',
      )
    }

    const nonCoreDebug = makeDebug('non-oclif-perf')

    const nonCorePerf = Performance.results
    if (nonCorePerf.size > 0) {
      nonCoreDebug('Non-Core Performance Measurements:')
      for (const [owner, results] of nonCorePerf) {
        nonCoreDebug(`  ${owner}:`)
        for (const result of results) {
          nonCoreDebug(`    ${result.name}: ${result.duration.toFixed(4)}ms`)
        }
      }
    }
  }

  public static getResult(owner: string, name: string): PerfResult | undefined {
    return Performance._results.get(owner)?.find((r) => r.name === name)
  }

  /**
   * Add a new performance marker
   *
   * @param owner An npm package like `@oclif/core` or `@salesforce/source-tracking`
   * @param name Name of the marker. Use `module.method#scope` format
   * @param details Arbitrary details to attach to the marker
   * @returns Marker instance
   */
  public static mark(owner: string, name: string, details: Details = {}): Marker | undefined {
    if (!Performance.enabled) return

    const marker = new Marker(owner, name, details)
    Performance.markers.set(marker.name, marker)

    return marker
  }

  public static get enabled(): boolean {
    return settings.performanceEnabled ?? false
  }

  public static get oclifPerf(): PerfHighlights | Record<string, never> {
    if (!Performance.enabled) return {}

    if (Performance._oclifPerf) return Performance._oclifPerf

    throw new Error('Perf results not available. Did you forget to call await Performance.collect()?')
  }

  /** returns a map of owner, PerfResult[].  Excludes oclif PerfResult, which you can get from oclifPerf */
  public static get results(): Map<string, PerfResult[]> {
    if (!Performance.enabled) return new Map()
    return new Map<string, PerfResult[]>(
      [...Performance._results.entries()].filter(([owner]) => owner !== OCLIF_MARKER_OWNER),
    )
  }
}
