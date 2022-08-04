import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import createModule, { Module } from '../src/module'

const checkModule = (moduleObj: Module, filePath: string, depLen: number) => {
  expect(moduleObj).not.toBeNull()
  expect(moduleObj.content).not.toBeNull()
  expect(moduleObj.ast).not.toBeNull()
  expect(moduleObj.dependencies.length).toBe(depLen)
  expect(moduleObj.filePath).toBe(filePath)
}

describe('module', () => {
  describe('createModule', () => {
    it('should create module object with basic ts files', async () => {
      const filePath = resolve(__dirname, './fixtures/module/basic/input.ts')
      const module = await createModule(filePath)
      checkModule(module, filePath, 2)
      const sub1Path = resolve(__dirname, './fixtures/module/basic/sub1.ts')
      const sub2Path = resolve(__dirname, './fixtures/module/basic/sub2.ts')
      checkModule(module.dependencies[0], sub1Path, 0)
      checkModule(module.dependencies[1], sub2Path, 0)
    })
    it('should create module object with jsx and decorator', async () => {
      const filePath = resolve(
        __dirname,
        './fixtures/module/jsxWithDecorator/input.tsx'
      )
      const module = await createModule(filePath)
      checkModule(module, filePath, 4)
      const sub1Path = resolve(
        __dirname,
        './fixtures/module/jsxWithDecorator/Sub1.tsx'
      )
      const sub2Path = resolve(
        __dirname,
        './fixtures/module/jsxWithDecorator/Sub2/index.tsx'
      )
      checkModule(module.dependencies[2], sub1Path, 1)
      checkModule(module.dependencies[3], sub2Path, 3)
    })

    it('should comply with ignorePatterns', async () => {
      const filePath = resolve(
        __dirname,
        './fixtures/module/jsxWithDecorator/input.tsx'
      )
      const module = await createModule(filePath, [/node_modules/])
      checkModule(module, filePath, 2)
      const sub1Path = resolve(
        __dirname,
        './fixtures/module/jsxWithDecorator/Sub1.tsx'
      )
      const sub2Path = resolve(
        __dirname,
        './fixtures/module/jsxWithDecorator/Sub2/index.tsx'
      )
      checkModule(module.dependencies[0], sub1Path, 0)
      checkModule(module.dependencies[1], sub2Path, 2)
    })

    it('should deal with mixing import and require', async () => {
      const filePath = resolve(
        __dirname,
        './fixtures/module/mixingImportAndRequire/input.ts'
      )
      const module = await createModule(filePath)
      checkModule(module, filePath, 2)
      const sub1Path = resolve(
        __dirname,
        './fixtures/module/mixingImportAndRequire/sub1.ts'
      )
      const sub2Path = resolve(
        __dirname,
        './fixtures/module/mixingImportAndRequire/sub2.ts'
      )
      checkModule(module.dependencies[0], sub1Path, 0)
      checkModule(module.dependencies[1], sub2Path, 0)
    })
  })
})
