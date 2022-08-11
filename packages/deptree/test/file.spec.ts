/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect } from 'vitest'
import { resolve } from 'path'
import createModule from '../src/module'
import { deptree2Files, findUnused, isSingle } from '../src/file'

describe('file', () => {
  describe('deptree2Files', () => {
    it('should create folder structure for a basic deptree', async () => {
      const filePath = resolve(__dirname, './fixtures/file/basic/input.ts')
      const module = await createModule(filePath)
      const [files] = deptree2Files(module)
      expect(files.length).toBe(1)
      const dir = files[0]
      if (isSingle(dir)) {
        throw new Error()
      }
      expect(dir.children.length).toBe(3)
      const singleInput = dir.children.find(
        (x) => isSingle(x) && x.fileName === 'input.ts'
      )
      expect(singleInput).not.toBeUndefined()
      // @ts-ignore
      expect(singleInput.module).toBe(module)
      const singleSub1 = dir.children.find(
        (x) => isSingle(x) && x.fileName === 'sub1.ts'
      )
      expect(singleSub1).not.toBeUndefined()
      // @ts-ignore
      expect(singleSub1.module).toBe(module.dependencies[0])
      const singleSub2 = dir.children.find(
        (x) => isSingle(x) && x.fileName === 'sub2.ts'
      )
      expect(singleSub2).not.toBeUndefined()
      // @ts-ignore
      expect(singleSub2.module).toBe(module.dependencies[1])
    })

    it('should create folder structure for a deptree with nested deps', async () => {
      const filePath = resolve(__dirname, './fixtures/file/nested/input.ts')
      const module = await createModule(filePath)
      const [files] = deptree2Files(module)

      expect(files.length).toBe(1)
      const dir = files[0]
      if (isSingle(dir)) {
        throw new Error()
      }
      expect(dir.children.length).toBe(3)
      const singleInput = dir.children.find(
        (x) => isSingle(x) && x.fileName === 'input.ts'
      )
      expect(singleInput).not.toBeUndefined()
      // @ts-ignore
      expect(singleInput.module).toBe(module)
      const singleSub1 = dir.children.find(
        (x) => isSingle(x) && x.fileName === 'sub1.ts'
      )
      expect(singleSub1).not.toBeUndefined()
      // @ts-ignore
      expect(singleSub1.module).toBe(module.dependencies[0])
      const nestedSub2 = dir.children.find(
        (x) => !isSingle(x) && x.prefix === 'sub2'
      )
      expect(nestedSub2).not.toBeUndefined()
      if (!nestedSub2 || isSingle(nestedSub2)) {
        throw new Error()
      }
      expect(nestedSub2.children.length).toBe(1)
      if (!isSingle(nestedSub2.children[0])) {
        throw new Error()
      }
      expect(nestedSub2.children[0].module).toBe(module.dependencies[1])
    })
  })

  describe('findUnused', () => {
    it('should find all unused files for basic case', async () => {
      const filePath = resolve(__dirname, './fixtures/file/basic/input.ts')
      const module = await createModule(filePath)
      const unusedFiles = await findUnused(module, {
        searchDir: resolve(__dirname, './fixtures/file/basic'),
      })
      expect(unusedFiles?.length).toBe(2)
      expect(
        unusedFiles.findIndex(
          (f) => f === resolve(__dirname, './fixtures/file/basic/unused.ts')
        )
      ).not.toBe(-1)
      expect(
        unusedFiles.findIndex(
          (f) => f === resolve(__dirname, './fixtures/file/basic/test.json')
        )
      ).not.toBe(-1)
    })
    it('should obey ignore patterns', async () => {
      const filePath = resolve(__dirname, './fixtures/file/basic/input.ts')
      const module = await createModule(filePath)
      const unusedFiles = await findUnused(module, {
        searchDir: resolve(__dirname, './fixtures/file/basic'),
        ignorePatterns: [/test\.json/],
      })
      expect(unusedFiles?.length).toBe(1)
      expect(unusedFiles[0]).toBe(
        resolve(__dirname, './fixtures/file/basic/unused.ts')
      )
    })
    it('should find all unused files without search dir', async () => {
      const filePath = resolve(__dirname, './fixtures/file/basic/input.ts')
      const module = await createModule(filePath)
      const unusedFiles = await findUnused(module)
      expect(unusedFiles?.length).toBe(2)
      expect(
        unusedFiles.findIndex(
          (f) => f === resolve(__dirname, './fixtures/file/basic/unused.ts')
        )
      ).not.toBe(-1)
      expect(
        unusedFiles.findIndex(
          (f) => f === resolve(__dirname, './fixtures/file/basic/test.json')
        )
      ).not.toBe(-1)
    })
    it('should find nested unused files ', async () => {
      const filePath = resolve(__dirname, './fixtures/file/nested/input.ts')
      const module = await createModule(filePath)
      const unusedFiles = await findUnused(module, {
        searchDir: resolve(__dirname, './fixtures/file/nested'),
      })
      expect(unusedFiles?.length).toBe(2)
      expect(
        unusedFiles.findIndex(
          (x) => x === resolve(__dirname, './fixtures/file/nested/unused1.ts')
        )
      ).not.toBe(-1)
      expect(
        unusedFiles.findIndex(
          (x) =>
            x ===
            resolve(__dirname, './fixtures/file/nested/sub2/innerUnused.ts')
        )
      ).not.toBe(-1)
    })
  })
})
