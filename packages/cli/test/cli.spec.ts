import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { spawnAsPromise } from './helper'

describe('cli', () => {
  describe('analyze', () => {
    it('should list all unused files', async () => {
      // todo: how to run (spawn) this ts file directly
      const cliFilePath = resolve(__dirname, '../lib/cli.mjs')
      const input = resolve(__dirname, './fixtures/cli/input.ts')
      const dir = resolve(__dirname, './fixtures/cli')
      const args = [cliFilePath, 'analyze', input, '--searchDir', dir]
      const { stdout, stderr } = await spawnAsPromise(process.execPath, args)
      const unusedFile1 = resolve(
        __dirname,
        './fixtures/cli/sub2/innerUnused.ts'
      )
      const unusedFile2 = resolve(__dirname, './fixtures/cli/unused1.ts')
      // todo 放到输出文件
      const expectedStdout =
        'constructing deptree...\n' +
        'finished!\n' +
        'finding unused files...\n' +
        'Unused files: \n' +
        '[\n' +
        `  '${unusedFile1}',\n` +
        `  '${unusedFile2}'\n` +
        ']\n'
      expect(stdout).toBe(expectedStdout)
      expect(stderr).toBe('')
    })
  })

  describe('clean', () => {
    it('should remove all unused files', async () => {
      // todo: how to run (spawn) this ts file directly
      const cliFilePath = resolve(__dirname, '../lib/cli.mjs')
      const input = resolve(__dirname, './fixtures/cli/input.ts')
      const dir = resolve(__dirname, './fixtures/cli')
      const args = [cliFilePath, 'clean', input, '--searchDir', dir]
      const { stdout, stderr } = await spawnAsPromise(process.execPath, args)
      const expectedStdout =
        'constructing deptree...\n' +
        'finished!\n' +
        'finding unused files...\n' +
        'found!\n' +
        'clean...\n' +
        'cleaned!\n'
      expect(stdout).toBe(expectedStdout)
      expect(stderr).toBe('')
    })
  })
})
