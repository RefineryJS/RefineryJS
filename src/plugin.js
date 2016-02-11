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

export function loadPlugins (types, givenPlugins) {
  const mapVisitors = new Map()
  const state = IMap().withMutations(mapInitialStates => {
    for (let [id, plugin] of IMap(givenPlugins)) {
      if (!Array.isArray(plugin)) {
        plugin = [plugin, {}]
      }

      const [init, option] = plugin

      if (typeof init !== 'function') {
        throw new Error(`RefineryJS - Plugin ${id} is not a function`)
      }

      const {priority, visitor, ...others} = init({types, option})

      if (visitor != null) {
        visitor[PRIORITY] = priority
        mapVisitors.set(id, visitor)
      }

      const otherFields = IMap(others)
      if (otherFields.size > 0) {
        for (let [topic, initiaiState] of otherFields) {
          mapInitialStates.set(IMap({id, topic}), initiaiState)
        }
      }
    }
  })

  return {
    visitors: IMap(mapVisitors).sort(prioritySorter),
    state: MKMap(['id', 'topic'], state)
  }
}
