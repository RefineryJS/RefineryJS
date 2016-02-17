import {Map as IMap} from 'immutable'

export function normalizeVisitor (visitor) {
  console.log('VISITORIS:', Object.keys(visitor))
  const visitorMap = new Map()

  for (let key of Object.keys(visitor)) {
    const handler = visitor[key]
    for (let type of key.split('|')) {
      console.log('TYPEIS:', type)
      let {enter, exit} = handler || {}

      if (typeof handler === 'function') {
        enter = handler
        exit = null
      } else {
        if (typeof enter !== 'function') {
          enter = null
        }
        if (typeof exit !== 'function') {
          exit = null
        }
      }

      if (!enter && !exit) {
        break
      }

      let typeHandlers = visitorMap.get(type)
      if (!typeHandlers) {
        enter = enter ? [enter] : []
        exit = exit ? [exit] : []
        visitorMap.set(type, {enter, exit})
        continue
      }

      if (enter) {
        typeHandlers.enter.push(enter)
      }
      if (exit) {
        typeHandlers.exit.push(exit)
      }
    }
  }

  return IMap(visitorMap)
}

export function unifyVisitors (mapVisitors, state) {
  const typeToVisitors = new Map()
  for (let [plugin, visitor] of mapVisitors.map(normalizeVisitor)) {
    for (let [type, {enter, exit}] of visitor) {
      let visitorsPair = typeToVisitors.get(type)
      if (!visitorsPair) {
        visitorsPair = {listEnter: [], listExit: []}
        typeToVisitors.set(type, visitorsPair)
      }
      const {listEnter, listExit} = visitorsPair

      if (enter && enter.length) {
        const pluginEnter = enter.map(handler => ({plugin, handler}))
        visitorsPair.listEnter = listEnter.concat(pluginEnter)
      }
      if (exit && exit.length) {
        const pluginExit = exit.map(handler => ({plugin, handler}))
        visitorsPair.listExit = listExit.concat(pluginExit)
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

    for (let {plugin, handler} of listVisitors) {
      handler(path, getState(plugin), mutateState)

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
