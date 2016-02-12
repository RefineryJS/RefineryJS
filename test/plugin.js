import {describe, it} from 'mocha'
import {expect} from 'chai'

import * as types from 'babel-types'

import {loadPlugins} from '../src/plugin.js'

describe('loadPlugins()', () => {
  const visitor1 = {foo () {}}
  const visitor2 = {bar () {}}

  const someState1 = {foo: 'bar'}
  const someState2 = {foo: 'baz'}

  const plugins = {
    plugin1: () => ({
      priority: 1,
      visitor: visitor1,
      someState: someState1,
    }),
    plugin2: [() => ({
      priority: 2,
      visitor: visitor2,
      someState: someState2,
    }), {key: 'value'}],
  }

  it('should load plugin visitors sorted by priority', () => {
    const {visitors} = loadPlugins(types, plugins)
    const listVisitors = [...visitors]

    expect(listVisitors[0][0]).to.equal('plugin2')
    expect(listVisitors[1][0]).to.equal('plugin1')
    expect(listVisitors[0][1]).to.equal(visitor2)
    expect(listVisitors[1][1]).to.equal(visitor1)
  })

  it('should load plugin states as MKMap', () => {
    const {state} = loadPlugins(types, plugins)

    expect(state.get({id: 'plugin1', topic: 'someState'})).to.equal(someState1)
    expect(state.get({id: 'plugin2', topic: 'someState'})).to.equal(someState2)
  })
})
