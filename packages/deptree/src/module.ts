import { dirname, extname } from 'path'
import { parse as _parse, traverse } from '@babel/core'
import _resolve, { Resolve } from './resolve'
import {
  babelParse,
  makeGlobsPredicate,
  fileNameFromPath,
  readFile,
} from './utils'

export interface Module {
  filePath: string
  content: string
  ast: ReturnType<typeof _parse> | null
  dependencies: Module[]
}

async function findDependencies(
  filePath: string,
  ast: Module['ast'],
  resolve: Resolve
): Promise<string[]> {
  const modules: Set<string> = new Set()
  // currently just checking import source
  // todo: collect module export usage
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/import
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      modules.add(node.source.value)
    },
    CallExpression: ({ node }) => {
      const nodeCallee = node?.callee
      const arg = node?.arguments?.[0]
      const isRequire =
        nodeCallee?.type === 'Identifier' && nodeCallee?.name === 'require'
      const isDynamicImport = nodeCallee?.type === 'Import'
      const isRequireOrDynamicImport = isRequire || isDynamicImport
      if (
        isRequireOrDynamicImport &&
        arg?.type === 'StringLiteral' &&
        arg?.value
      ) {
        modules.add(arg?.value)
      }
    },
    ExportAllDeclaration: ({ node }) => {
      const source = node.source
      const sourceType = source?.type
      const moduleName = source?.value
      if (sourceType === 'StringLiteral' && moduleName) {
        modules.add(moduleName)
      }
    },
    ExportNamedDeclaration: ({ node }) => {
      const source = node.source
      const sourceType = source?.type
      const moduleName = source?.value
      if (sourceType === 'StringLiteral' && moduleName) {
        modules.add(moduleName)
      }
    },
  })
  const resolutions = await Promise.allSettled(
    Array.from(modules).map(async (module) => {
      const fileDir = dirname(filePath)
      return resolve(fileDir, module)
    })
  )
  const result: string[] = []
  resolutions.forEach((resolution) => {
    if (resolution.status === 'fulfilled') {
      result.push(resolution.value)
    } else {
      console.error(resolution.reason)
    }
  })
  return result
}

const PARSABLE_EXTENSIONS = [
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.jsx',
  '.tsx',
  '.d.ts',
]

function createModule(
  filePath: string,
  ignorePatterns: string[] = [],
  resolve: Resolve = _resolve
) {
  // avoid infinite loop for circular deps
  const generated = new Map<string, Module>()
  const predicate = makeGlobsPredicate(ignorePatterns)

  async function createModuleRecur(curFilePath: string): Promise<Module> {
    const partialModule = generated.get(curFilePath)
    if (partialModule) {
      return partialModule
    }
    const content = await readFile(curFilePath, 'utf-8')
    const filename = fileNameFromPath(curFilePath)
    const ext = extname(curFilePath)

    let ast = null
    // todo: ???????????? webpack ??????
    const ableToParse = PARSABLE_EXTENSIONS.includes(ext)
    if (ableToParse) {
      // todo: ??????????????????????????????????????????
      ast = await babelParse(content, {
        filename,
        babelrc: false,
        configFile: false,
        parserOpts: {
          plugins: ['typescript', 'jsx', 'decorators-legacy'],
        },
      })
    }

    const curModule: Module = {
      filePath: curFilePath,
      content,
      ast,
      dependencies: [],
    }

    generated.set(curFilePath, curModule)

    const depFilePaths = ableToParse
      ? await findDependencies(curFilePath, ast, resolve)
      : []
    const filteredPaths = ignorePatterns.length
      ? depFilePaths.filter((p) => !predicate(p))
      : depFilePaths

    const dependencies = await Promise.all(
      filteredPaths.map((path) => createModuleRecur(path))
    )
    curModule.dependencies = dependencies

    return curModule
  }

  return createModuleRecur(filePath)
}

export function flatten(module: Module) {
  const ret: Module[] = []
  const queue: Module[] = [module]
  const visited = new Set<string>([module.filePath])
  let cur: Module | undefined = undefined
  while (queue.length) {
    cur = queue.shift()
    if (cur) {
      ret.push(cur)
      cur.dependencies?.forEach((dep) => {
        if (!visited.has(dep.filePath)) {
          queue.push(dep)
          visited.add(dep.filePath)
        }
      })
    }
  }
  return ret
}

export default createModule
