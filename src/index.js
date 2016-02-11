import {loadPlugins} from './plugin'
import {unifyVisitors} from './visitor'
import {traverse} from './traverse'

export default function Refinery (types, plugins, options = {}) {
  const {visitors: mapVisitors, state} = loadPlugins(types, plugins, options)
  const visitor = unifyVisitors(mapVisitors, state)
  return function refine (path) {
    traverse(types, path, visitor)
  }
}
