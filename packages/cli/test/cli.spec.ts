import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { spawnAsPromise } from './helper'

describe('cli', () => {
  describe('analyze', () => {
    it('should list all unused files with default config file', async () => {
      // todo: how to run (spawn) this ts file directly
      const cliFilePath = resolve(__dirname, '../lib/cli.mjs')
      const input = resolve(__dirname, './fixtures/cli/basic/input.ts')
      const dir = resolve(__dirname, './fixtures/cli/basic')
      const args = [cliFilePath, 'analyze', input, '--searchDir', dir]
      const { stdout, stderr } = await spawnAsPromise(process.execPath, args)
      const unusedFile1 = resolve(
        __dirname,
        './fixtures/cli/basic/sub2/innerUnused.ts'
      )
      const unusedFile2 = resolve(__dirname, './fixtures/cli/basic/unused1.ts')
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
    it('should list all unused files including config file', async () => {
      const cliFilePath = resolve(__dirname, '../lib/cli.mjs')
      const input = resolve(__dirname, './fixtures/cli/basic/input.ts')
      const dir = resolve(__dirname, './fixtures/cli/basic')
      const args = [
        cliFilePath,
        'analyze',
        input,
        '--searchDir',
        dir,
        '--config',
        'nonexsist.config.json',
      ]
      const { stdout, stderr } = await spawnAsPromise(process.execPath, args)
      const unusedFile1 = resolve(
        __dirname,
        './fixtures/cli/basic/sub2/innerUnused.ts'
      )
      const unusedFile2 = resolve(__dirname, './fixtures/cli/basic/unused1.ts')
      const unusedConfig = resolve(
        __dirname,
        './fixtures/cli/basic/reddeps.config.json'
      )

      // todo 放到输出文件
      const expectedStdout =
        'reddeps config file cannot be found\n' +
        'constructing deptree...\n' +
        'finished!\n' +
        'finding unused files...\n' +
        'Unused files: \n' +
        '[\n' +
        `  '${unusedConfig}',\n` +
        `  '${unusedFile1}',\n` +
        `  '${unusedFile2}'\n` +
        ']\n'
      expect(stdout).toBe(expectedStdout)
      expect(stderr).toBe('')
    })
    it('should list all unused files with custom resolve config', async () => {
      const cliFilePath = resolve(__dirname, '../lib/cli.mjs')
      const input = resolve(__dirname, './fixtures/cli/resolveConfig/input.ts')
      const dir = resolve(__dirname, './fixtures/cli/resolveConfig')
      const args = [cliFilePath, 'analyze', input, '--searchDir', dir]
      const { stdout, stderr } = await spawnAsPromise(process.execPath, args)
      const unusedFile1 = resolve(
        __dirname,
        './fixtures/cli/resolveConfig/sub2/innerUnused.ts'
      )
      const unusedFile2 = resolve(
        __dirname,
        './fixtures/cli/resolveConfig/unused1.ts'
      )
      const unusedFile3 = resolve(
        __dirname,
        './fixtures/cli/resolveConfig/common/unused.ts'
      )

      // todo 放到输出文件
      const expectedStdout =
        'constructing deptree...\n' +
        'finished!\n' +
        'finding unused files...\n' +
        'Unused files: \n' +
        '[\n' +
        `  '${unusedFile3}',\n` +
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
      const input = resolve(__dirname, './fixtures/cli/basic/input.ts')
      const dir = resolve(__dirname, './fixtures/cli/basic')
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
