import { readFile as _readFile } from 'fs'
import { promisify } from 'util'
import { parse as _parse, ParseResult, TransformOptions } from '@babel/core'
import { basename, extname } from 'path'

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
