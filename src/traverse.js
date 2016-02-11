export function traverse (t, path, visitor) {
  // Collect handlers which apply to path's root node
  const node = path.node
  const rootNodeHandlers = []
  for (let type of Object.keys(visitor)) {
    if (t[`is${type}`](node)) {
      rootNodeHandlers.push(type)
    }
  }

  function runHandlers (handleTime) {
    const node = path.node

    for (let type of rootNodeHandlers) {
      const handler = visitor[type][handleTime]

      if (typeof handler !== 'function') continue

      handler(path)

      if (path.shouldSkip || node !== path.node) break
    }
  }

  // Start actual traversing

  runHandlers('enter')
  path.traverse(visitor)
  runHandlers('exit')
}
