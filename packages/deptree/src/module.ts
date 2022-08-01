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
): Promise<Module[]> {
  const modules: Set<string> = new Set()
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      modules.add(node.source.value)
    },
  })
  return Promise.all(
    Array.from(modules).map(async (module) => {
      const fileDir = dirname(filePath)
      const subModule = await resolve(fileDir, module)
      return createModule(subModule, resolve)
    })
  )
}

async function createModule(
  filePath: string,
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

  const dependencies = await findDependencies(filePath, ast, resolve)

  return {
    filePath,
    content,
    ast,
    dependencies,
  }
}

export default createModule
