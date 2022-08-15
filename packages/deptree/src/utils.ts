import { readFile as _readFile } from 'fs'
import { promisify } from 'util'
import { parse as _parse, ParseResult, TransformOptions } from '@babel/core'
import { basename, extname } from 'path'
import minimatch from 'minimatch'

export const readFile = promisify(_readFile)

export const fileNameFromPath = (filePath: string, withExt = false) => {
  if (withExt) {
    return basename(filePath)
  }
  return basename(filePath, extname(filePath))
}

export const babelParse = promisify<string, TransformOptions, ParseResult>(
  _parse
)

export const matchSomeRegex = (str: string, regExps: RegExp[]) =>
  regExps.some((reg) => reg.test(str))

// todo: 可以暴露出 minimacth 本身的配置
export const makeGlobsPredicate = (patterns: string[]) => (path: string) =>
  patterns.some((pat) => minimatch(path, pat, { matchBase: true, dot: true }))
