export function traverse (t, path, visitor) {
  // Collect handlers which apply to path's root node
  const node = path.node
  const rootNodeHandlers = []
  for (let type of Object.keys(visitor)) {
    if (t[`is${type}`](node)) {
      const {enter, exit} = visitor[type]
      rootNodeHandlers.push({enter, exit})
    }
  }

  function runHandlers (handleTime) {
    const node = path.node

    for (let handlerPair of rootNodeHandlers) {
      const handler = handlerPair[handleTime]

      if (typeof handler !== 'function') {
        console.log('WOOPS:', handler)
        continue
      }

      handler(path)

      if (path.shouldSkip || node !== path.node) {
        break
      }
    }
  }

  // Start actual traversing

  runHandlers('enter')
  path.traverse(visitor)
  runHandlers('exit')
}
