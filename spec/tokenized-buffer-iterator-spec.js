/** @babel */

import TokenizedBufferIterator from '../src/tokenized-buffer-iterator'
import {Point} from 'text-buffer'

describe('TokenizedBufferIterator', () => {
  describe('seek(position)', function () {
    it('seeks to the leftmost tag boundary greater than or equal to the given position and returns the containing tags', function () {
      const tokenizedBuffer = {
        tokenizedLineForRow (row) {
          if (row === 0) {
            return {
              tags: [-1, -2, -3, -4, -5, 3, -3, -4, -6, -5, 4, -6, -3, -4],
              text: 'foo bar',
              openScopes: []
            }
          } else {
            return null
          }
        }
      }

      const iterator = new TokenizedBufferIterator(tokenizedBuffer)

      expect(iterator.seek(Point(0, 0))).toEqual([])
      expect(iterator.getPosition()).toEqual(Point(0, 0))
      expect(iterator.getCloseScopeIds()).toEqual([])
      expect(iterator.getOpenScopeIds()).toEqual([1])

      iterator.moveToSuccessor()
      expect(iterator.getCloseScopeIds()).toEqual([1])
      expect(iterator.getOpenScopeIds()).toEqual([2])

      expect(iterator.seek(Point(0, 1))).toEqual(['syntax--baz'])
      expect(iterator.getPosition()).toEqual(Point(0, 3))
      expect(iterator.getCloseScopeIds()).toEqual([])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--bar'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 3))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--bar', 'syntax--baz'])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--baz'])

      expect(iterator.seek(Point(0, 3))).toEqual(['syntax--baz'])
      expect(iterator.getPosition()).toEqual(Point(0, 3))
      expect(iterator.getCloseScopeIds()).toEqual([])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--bar'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 3))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--bar', 'syntax--baz'])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--baz'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 7))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--baz'])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--bar'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 7))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--bar'])
      expect(iterator.getOpenScopeIds()).toEqual([])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(1, 0))
      expect(iterator.getCloseScopeIds()).toEqual([])
      expect(iterator.getOpenScopeIds()).toEqual([])

      expect(iterator.seek(Point(0, 5))).toEqual(['syntax--baz'])
      expect(iterator.getPosition()).toEqual(Point(0, 7))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--baz'])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--bar'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 7))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--bar'])
      expect(iterator.getOpenScopeIds()).toEqual([])
    })
  })

  describe('moveToSuccessor()', function () {
    it('reports two boundaries at the same position when tags close, open, then close again without a non-negative integer separating them (regression)', () => {
      const tokenizedBuffer = {
        tokenizedLineForRow () {
          return {
            tags: [-1, -2, -1, -2],
            text: '',
            openScopes: []
          }
        },

        grammar: {
          scopeForId () {
            return 'foo'
          }
        }
      }

      const iterator = new TokenizedBufferIterator(tokenizedBuffer)

      iterator.seek(Point(0, 0))
      expect(iterator.getPosition()).toEqual(Point(0, 0))
      expect(iterator.getCloseScopeIds()).toEqual([])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--foo'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 0))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--foo'])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--foo'])

      iterator.moveToSuccessor()
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--foo'])
      expect(iterator.getOpenScopeIds()).toEqual([])
    })

    it("reports a boundary at line end if the next line's open scopes don't match the containing tags for the current line", () => {
      const tokenizedBuffer = {
        tokenizedLineForRow (row) {
          if (row === 0) {
            return {
              tags: [-1, 3, -2, -3],
              text: 'bar',
              openScopes: []
            }
          } else if (row === 1) {
            return {
              tags: [3],
              text: 'baz',
              openScopes: [-1]
            }
          } else if (row === 2) {
            return {
              tags: [-2],
              text: '',
              openScopes: [-1]
            }
          }
        },

        grammar: {
          scopeForId (id) {
            if (id === -2 || id === -1) {
              return 'foo'
            } else if (id === -3) {
              return 'qux'
            }
          }
        }
      }

      const iterator = new TokenizedBufferIterator(tokenizedBuffer)

      iterator.seek(Point(0, 0))
      expect(iterator.getPosition()).toEqual(Point(0, 0))
      expect(iterator.getCloseScopeIds()).toEqual([])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--foo'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 3))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--foo'])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--qux'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(0, 3))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--qux'])
      expect(iterator.getOpenScopeIds()).toEqual([])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(1, 0))
      expect(iterator.getCloseScopeIds()).toEqual([])
      expect(iterator.getOpenScopeIds()).toEqual(['syntax--foo'])

      iterator.moveToSuccessor()
      expect(iterator.getPosition()).toEqual(Point(2, 0))
      expect(iterator.getCloseScopeIds()).toEqual(['syntax--foo'])
      expect(iterator.getOpenScopeIds()).toEqual([])
    })
  })
})
