import { describe, expect, it } from 'vitest'
import { makeGlobsPredicate } from '../src/utils'

describe('utils', () => {
  describe('makeGlobsPredicate', () => {
    it('makes predicate for empty glob patterns', () => {
      const predicate = makeGlobsPredicate([])
      const paths = ['/a/b.js', '/a/c.ts']
      expect(paths.filter(predicate)).toStrictEqual([])
    })
    it('makes predicate for single glob pattern', () => {
      const predicate = makeGlobsPredicate(['**/node_modules/**'])
      const paths = ['/a/b.js', '/a/node_modules/test/index.js']
      const result = ['/a/node_modules/test/index.js']
      expect(paths.filter(predicate)).toStrictEqual(result)
    })
    it('makes predicate for multi glob patterns', () => {
      const predicate = makeGlobsPredicate(['**/node_modules/**', '*.json'])
      const paths = [
        '/a/b.js',
        '/a/config.json',
        '/a/node_modules/test/index.js',
      ]
      const result = ['/a/config.json', '/a/node_modules/test/index.js']
      expect(paths.filter(predicate)).toStrictEqual(result)
    })
    it('makes predicate recognizing file paths starting with dot', () => {
      const predicate = makeGlobsPredicate(['**/node_modules/**', '*.json'])
      const paths = [
        '/a/b.js',
        '/a/config.json',
        '/a/node_modules/test/index.js',
        '/a/node_modules/.pnpm/something/index.js',
      ]
      const result = [
        '/a/config.json',
        '/a/node_modules/test/index.js',
        '/a/node_modules/.pnpm/something/index.js',
      ]
      expect(paths.filter(predicate)).toStrictEqual(result)
    })
  })
})
