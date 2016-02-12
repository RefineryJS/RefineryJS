import 'babel-polyfill'

import {loadPlugins} from './plugin'
import {unifyVisitors} from './visitor'
import {traverse} from './traverse'

export default function refine (types, path, plugins) {
  const {visitors: mapVisitors, state} = loadPlugins(types, plugins)
  const visitor = unifyVisitors(mapVisitors, state)
  traverse(types, path, visitor)
}
