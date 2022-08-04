import { join } from 'path'
import { readdir as _readdir } from 'fs'
import { promisify } from 'util'
import { flow, map, groupBy, mapValues, zipAll } from 'lodash/fp'
import { flatten, Module } from './module'
import { fileNameFromPath } from './utils'

const readdir = promisify(_readdir)

export type Single<V> = {
  fileName: string
  module: V
}
export type Dir<V> = {
  prefix: string
  children: ModuleFile<V>[]
}

export type ModuleFile<V> = Single<V> | Dir<V>

export function isSingle<V>(x: ModuleFile<V>): x is Single<V> {
  return (
    (x as Single<V>).module !== undefined &&
    (x as Dir<V>).prefix === undefined &&
    (x as Dir<V>).children === undefined
  )
}

type Deptree2FilesRet = [ModuleFile<Module>[], string]
// 将依赖图转化为文件结构
export function deptree2Files(
  entry: Module,
  stripCommonPrefix = true
): Deptree2FilesRet {
  const flattened = flatten(entry)
  let count = 0
  let commonPrefix = ''
  if (stripCommonPrefix) {
    const { count: _count, commonPrefix: _commonPrefix } =
      commonPrefixCount(flattened)
    count = _count
    commonPrefix = _commonPrefix
  }

  const files = flow(
    map((x: Module) => [x, x.filePath.split('/').slice(count).filter(Boolean)]),
    moduleToFileRecur
  )(flattened)

  return [files, commonPrefix]
}

function commonPrefixCount(modules: Module[]) {
  const zipped = flow(
    map((m: Module) => m.filePath.split('/').filter(Boolean)),
    zipAll<string>
  )(modules)

  const count = zipped.findIndex((zipCol) =>
    zipCol.some((x) => x !== zipCol[0])
  )

  const _commonPrefix = modules[0].filePath
    .split('/')
    .filter(Boolean)
    .slice(0, count - 1)
    .join('/')

  return {
    count,
    commonPrefix: `/${_commonPrefix}`,
  }
}

// 将一组路径合并为文件结构
type ModuleTuple = [Module, string[]]
function moduleToFileRecur(modules: ModuleTuple[]): ModuleFile<Module>[] {
  const groupedNewTuples = flow(
    groupBy((x: ModuleTuple) => x[1][0]),
    mapValues((items) => {
      return {
        prefix: items[0][1][0],
        newTuples: items.map(
          ([module, [, ...rest]]) => [module, rest] as ModuleTuple
        ),
      }
    })
  )(modules)

  return Object.values(groupedNewTuples).map((grouped) => {
    if (grouped.newTuples.length === 1) {
      const module = grouped.newTuples[0][0]
      return { module, fileName: fileNameFromPath(module.filePath, true) }
    }
    return {
      prefix: grouped.prefix,
      children: moduleToFileRecur(grouped.newTuples),
    }
  })
}

// 找出特定目录下依赖图之外的文件
export function findUnused(
  searchDir: string,
  depTree: Module
): Promise<string[]> {
  const [depFiles, commonPrefix] = deptree2Files(depTree)
  const firstDepDir = findFirstDepDir(searchDir, depFiles, commonPrefix)

  // todo: 支持 searchDir 更小的范围
  if (firstDepDir === undefined) {
    throw new Error('you should change your import files folder structure')
  }

  const children = firstDepDir.children
  return findUnusedRecur(searchDir, children)
}

async function findUnusedRecur(
  searchDir: string,
  files: ModuleFile<Module>[]
): Promise<string[]> {
  if (!files?.length) {
    return []
  }
  const ret: string[] = []
  const dirs = await readdir(searchDir, { withFileTypes: true })
  for (const dir of dirs) {
    const matchedFile = files.find((file) => {
      if (isSingle(file)) {
        return file.fileName === dir.name
      }
      return file.prefix === dir.name
    })

    if (matchedFile) {
      if (dir.isDirectory() && !isSingle(matchedFile)) {
        const nextSearchDir = join(searchDir, dir.name)
        const subRets = await findUnusedRecur(
          nextSearchDir,
          matchedFile.children
        )
        ret.push(...subRets)
      }
    } else {
      ret.push(join(searchDir, dir.name))
    }
  }

  return ret
}

function findFirstDepDir(
  searchDir: string,
  moduleFiles: ModuleFile<Module>[],
  prefixToJoin = '/'
): Dir<Module> | undefined {
  for (let i = 0; i < moduleFiles.length; i++) {
    const file = moduleFiles[i]
    if (!isSingle(file)) {
      const { prefix, children } = file
      const curDir = join(prefixToJoin, prefix)
      if (curDir === searchDir) {
        return file
      }
      if (searchDir.includes(curDir) && children.length) {
        return findFirstDepDir(searchDir, children, curDir)
      }
    }
  }
  return undefined
}
