import {Map as IMap} from 'immutable'
import MKMap from 'mkmap'

const PRIORITY = Symbol('rjs_plugin_priority')

function numOf (value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }
  return value
}

function prioritySorter ({[PRIORITY]: left}, {[PRIORITY]: right}) {
  // Highest priority first
  return numOf(right) - numOf(left)
}

export function loadPlugins (types, listPlugins) {
  const mapVisitors = new Map()
  const state = IMap().withMutations(mapInitialStates => {
    for (let plugin of listPlugins) {
      if (typeof plugin === 'string') {
        plugin = {
          name: plugin,
          init: require(plugin).default,
          option: {},
        }
      } else if (Array.isArray(plugin)) {
        const newPluginObj = {}
        for (let elem of plugin) {
          switch (typeof elem) {
            case 'string':
              newPluginObj.name = elem
              break
            case 'function':
              newPluginObj.init = elem
              break
            case 'object':
              newPluginObj.option = elem
              break
            default:
          }
        }

        plugin = newPluginObj
      }

      let {name, init, option} = plugin

      if (typeof name !== 'string') {
        // Name must be specified
        throw new Error('RefineryJS - Nameless plugin is not allowed')
      }

      if (typeof init !== 'function') {
        // If initializer exist but not a function
        if (init != null) {
          throw new Error(`RefineryJS - Detect non-function plugin`)
        }

        // Fallback if initializer function not specified
        init = require(name).default
      }

      if (typeof option !== 'object') {
        option = {}
      }

      const {priority, visitor, ...others} = init({types, option})

      if (visitor != null) {
        visitor[PRIORITY] = priority
        mapVisitors.set(plugin, visitor)
      }

      const otherFields = IMap(others)
      if (otherFields.size > 0) {
        for (let [topic, initiaiState] of otherFields) {
          mapInitialStates.set(IMap({plugin, topic}), initiaiState)
        }
      }
    }
  })

  return {
    visitors: IMap(mapVisitors).sort(prioritySorter),
    state: MKMap(['plugin', 'topic'], state),
  }
}
