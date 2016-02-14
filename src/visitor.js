import {Map as IMap} from 'immutable'

function normalizeVisitor (visitor) {
  return IMap().withMutations(visitorMap => {
    for (let key of Object.keys(visitor)) {
      const handler = visitor[key]
      for (let type of key.split('|')) {
        if (typeof handler === 'function') {
          visitorMap.set(type, {enter: handler})
          continue
        }

        let {enter, exit} = handler || {}
        if (typeof enter !== 'function') {
          enter = null
        }
        if (typeof exit !== 'function') {
          exit = null
        }

        if (!enter && !exit) {
          return
        }

        visitorMap.set(type, {enter, exit})
      }
    }
  })
}

export function unifyVisitors (mapVisitors, state) {
  const typeToVisitors = new Map()
  for (let [plugin, visitor] of mapVisitors.map(normalizeVisitor)) {
    for (let [type, {enter, exit}] of visitor) {
      let existingVisitors = typeToVisitors.get(type)
      if (!existingVisitors) {
        existingVisitors = {listEnter: [], listExit: []}
        typeToVisitors.set(type, existingVisitors)
      }
      const {listEnter, listExit} = existingVisitors

      if (enter) {
        listEnter.push({plugin, visitor: enter})
      }
      if (exit) {
        listExit.push({plugin, visitor: exit})
      }
    }
  }

  const mergeVisitors = listVisitors => path => {
    const initialNode = path.node

    const getState = plugin => topic => state.get({plugin, topic})
    const mutateState = (topic, mutator) => {
      for (let [plugin, oldState] of state.get({topic})) {
        const newState = mutator(oldState)
        state = state.set({plugin, topic}, newState)
      }
    }

    for (let {plugin, visitor} of listVisitors) {
      visitor(path, getState(plugin), mutateState)

      if (path.shouldStop) {
        // Do not call path.stop() in RefineryJS plugin
        path.shouldStop = false
      }

      if (path.shouldSkip) {
        // Plugin visitor called path.skip()
        return
      }

      if (path.node !== initialNode) {
        // Plugin visitor replaced the node
        return
      }
    }
  }

  const resultVisitor = {}
  for (let [type, {listEnter, listExit}] of typeToVisitors) {
    const visitorElem = {}

    if (listEnter.length) {
      visitorElem.enter = mergeVisitors(listEnter)
    }
    if (listExit.length) {
      visitorElem.exit = mergeVisitors(listExit)
    }

    resultVisitor[type] = visitorElem
  }

  return resultVisitor
}
