import { Dirent, readdir as _readdir } from 'fs'
import { promisify } from 'util'
import { flow, map, groupBy, mapValues, zipAll } from 'lodash/fp'
import { flatten, Module } from './module'
import { fileNameFromPath, makeGlobsPredicate } from './utils'

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
// 对 ModuleTuple 做更好的抽象，现在太裸用 index 了
// 去除掉每次递归 prefix 的设计，太复杂
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
    // 某个前缀只有一个子项并且该子项是一个文件
    if (
      grouped.newTuples.length === 1 &&
      grouped.newTuples[0][1].length === 0
    ) {
      const module = grouped.newTuples[0][0]
      return { module, fileName: fileNameFromPath(module.filePath, true) }
    }
    return {
      prefix: grouped.prefix,
      children: moduleToFileRecur(grouped.newTuples),
    }
  })
}

// 1. 先考虑最简单的情况，即 deptree 的目录结构是比较正规的，即 entry 所在目录是整个依赖目录树的最高的节点
// 2. 这种情况最简单，如果没提供 searchDir，那么默认 searchDir 就是 entry 所在目录
// 3. 如果提供了 searchDir，那么会在一个小范围里搜索未用到的文件
// 4. 是否需要处理不正规的 deptree？如何处理？可以依赖于 searchDir，它应该为 entry 与外围的公共祖先
// 找出特定目录下依赖图之外的文件
// todo: add ignore patterns

type Config = {
  searchDir?: string
  ignorePatterns?: string[]
}

export function findUnused(depTree: Module, config: Config = {}) {
  let { searchDir } = config
  const { ignorePatterns = [] } = config
  const [depFiles, commonPrefix] = deptree2Files(depTree)
  if (!searchDir) {
    if (depFiles.length !== 1) {
      throw new Error('this deptree is bad')
    }
    // 正规的目录
    if (isSingle(depFiles[0])) {
      return []
    }
    searchDir = `${commonPrefix}/${depFiles[0].prefix}`
  }
  const [dir, prefix] = findSearchDir(depFiles, commonPrefix, searchDir) || []
  if (!dir || !prefix) {
    throw new Error('`searchDir` is unresolvable')
  }

  const needIgnore = makeGlobsPredicate(ignorePatterns)
  // commonPrefix 为目标 dir 的上一层
  async function findUnusedRecur(dir: Dir<Module>, commonPrefix: string) {
    const result: string[] = []
    const dirPath = `${commonPrefix}/${dir.prefix}`
    const files = dir.children
    const dirObjects = await readdir(dirPath, { withFileTypes: true })
    for (const dirObj of dirObjects) {
      const targetFile = files.find((file) => sameFilePredicate(dirObj, file))
      const filePath = `${dirPath}/${dirObj.name}`
      if (targetFile) {
        if (!isSingle(targetFile)) {
          const subRet = await findUnusedRecur(targetFile, dirPath)
          result.push(...subRet)
        }
      } else if (!needIgnore(filePath)) {
        result.push(filePath)
      }
    }
    return result
  }

  return findUnusedRecur(dir, prefix)
}

function sameFilePredicate(dirObj: Dirent, file: ModuleFile<Module>) {
  const bothFile = dirObj.isFile() && isSingle(file)
  const bothDir = dirObj.isDirectory() && !isSingle(file)
  const sameType = bothFile || bothDir
  const name = isSingle(file) ? file.fileName : file.prefix
  const sameName = dirObj.name === name

  if (!sameType || !sameName) {
    return false
  }

  return true
}

function findSearchDir(
  depFiles: ModuleFile<Module>[],
  commonPrefix: string,
  searchDir: string
): [Dir<Module>, string] | undefined {
  const dirs = depFiles.filter((f) => !isSingle(f)) as unknown as Dir<Module>[]
  const target = dirs.find((d) => `${commonPrefix}/${d.prefix}` === searchDir)
  if (target) {
    return [target, commonPrefix]
  }
  let subSearchRet: [Dir<Module>, string] | undefined
  for (const dir of dirs) {
    subSearchRet = findSearchDir(
      dir.children,
      `${commonPrefix}/${dir.prefix}`,
      searchDir
    )
  }
  return subSearchRet
}
