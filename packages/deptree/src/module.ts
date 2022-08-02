import { dirname } from 'path'
import { parse as _parse, traverse } from '@babel/core'
import _resolve, { Resolve } from './resolve'
import { babelParse, fileNameFromPath, readFile } from './utils'

export interface Module {
  filePath: string
  content: string
  ast: ReturnType<typeof _parse>
  dependencies: Module[]
}

function findDependencies(
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
  })
  return Promise.all(
    Array.from(modules).map(async (module) => {
      const fileDir = dirname(filePath)
      return resolve(fileDir, module)
    })
  )
}

async function createModule(
  filePath: string,
  ignorePatterns: RegExp[] = [],
  resolve: Resolve = _resolve
): Promise<Module> {
  const content = await readFile(filePath, 'utf-8')
  const filename = fileNameFromPath(filePath)
  // todo: 抽象一下这里的配置，做成可变
  const ast = await babelParse(content, {
    filename,
    babelrc: false,
    configFile: false,
    parserOpts: {
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    },
  })

  const depFilePaths = await findDependencies(filePath, ast, resolve)
  const filtered = depFilePaths.filter((path) =>
    ignorePatterns.every((pat) => !pat.test(path))
  )

  const dependencies = await Promise.all(
    filtered.map((path) => createModule(path, ignorePatterns, resolve))
  )

  return {
    filePath,
    content,
    ast,
    dependencies,
  }
}

export default createModule
