import { resolve } from 'path'
import createModule, { Module } from '../src/module'
import { describe, expect, it } from 'vitest'

const checkModule = (moduleObj: Module, filePath: string, depLen: number) => {
  expect(moduleObj).not.toBeNull()
  expect(moduleObj.content).not.toBeNull()
  expect(moduleObj.ast).not.toBeNull()
  expect(moduleObj.dependencies.length).toBe(depLen)
  expect(moduleObj.filePath).toBe(filePath)
}

describe('module', () => {
  describe('createModule', () => {
    it('should create module object with simple ts files', async () => {
      const filePath = resolve(__dirname, './fixtures/module/input.ts')
      const module = await createModule(filePath)
      checkModule(module, filePath, 2)
      const sub1Path = resolve(__dirname, './fixtures/module/sub1.ts')
      const sub2Path = resolve(__dirname, './fixtures/module/sub2.ts')
      checkModule(module.dependencies[0], sub1Path, 0)
      checkModule(module.dependencies[1], sub2Path, 0)
    })
  })
})
