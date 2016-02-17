import {describe, it} from 'mocha'
import {expect} from 'chai'
import {normalizeVisitor} from '../src/visitor'

describe('visitor.normalizeVisitor()', () => {
  it('should handle function', () => {
    const input = {
      nodeType () {
        console.log(42)
      },
    }
    const result = normalizeVisitor(input)

    const handlers = result.get('nodeType')

    expect(handlers.enter.length).to.equal(1)
    expect(handlers.exit.length).to.equal(0)

    expect(handlers.enter[0]).to.equal(input.nodeType)
  })

  it('should handle visitor name separated with "|"', () => {
    const input = {
      'nodeType1|nodeType2' () {
        console.log(43)
      },
    }
    const result = normalizeVisitor(input)

    const handlers1 = result.get('nodeType1')
    const handlers2 = result.get('nodeType2')

    expect(handlers1.enter.length).to.equal(1)
    expect(handlers1.exit.length).to.equal(0)
    expect(handlers2.enter.length).to.equal(1)
    expect(handlers2.exit.length).to.equal(0)

    const handlerFunc = input['nodeType1|nodeType2']
    expect(handlers1.enter[0]).to.equal(handlerFunc)
    expect(handlers2.exit[0]).to.equal(handlerFunc)
  })

  it('should handle visitor with both enter and exit', () => {
    const input = {
      nodeType: {
        enter () {
          console.log(44)
        },
        exit () {
          console.log(45)
        },
      },
    }
    const result = normalizeVisitor(input)

    const handlers = result.get('nodeType')

    expect(handlers.enter.length).to.equal(1)
    expect(handlers.exit.length).to.equal(1)

    expect(handlers.enter[0]).to.equal(input.nodeType.enter)
    expect(handlers.exit[0]).to.equal(input.nodeType.exit)
  })

  it('should handle visitor only with exit', () => {
    const input = {
      nodeType: {
        exit () {
          console.log(46)
        },
      },
    }
    const result = normalizeVisitor(input)

    const handlers = result.get('nodeType')

    expect(handlers.enter.length).to.equal(0)
    expect(handlers.exit.length).to.equal(1)

    expect(handlers.exit[0]).to.equal(input.nodeType.exit)
  })
})
