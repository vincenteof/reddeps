import cac from 'cac'
import { dirname, resolve } from 'path'
import { readFileSync, existsSync } from 'fs'
import { deptree, findUnused, makeResolve } from '@reddeps/deptree'
import { cleanUnused } from './cleanUnused'
import { version } from '../package.json'

const cli = cac('reddeps')
cli.version(version)

cli
  .command('analyze <entry>', 'analyze unused files')
  .option('--searchDir <dir>', 'where to start search')
  .option('--config <path>', 'config file path')
  .action(runAnalyze)

cli
  .command('clean <entry>', 'clean unused modules')
  .option('--searchDir <dir>', 'where to start search')
  .option('--config <path>', 'config file path')
  .action(runClean)

cli.help()
cli.parse()

async function runAnalyze(entry: string, options: Record<string, string>) {
  const entryPath = resolve(process.cwd(), entry)
  const userOptions = getUserOptions(options, entryPath)
  const { searchDir, moduleIgnorePatterns, fileIgnorePatterns, resolveConfig } =
    userOptions
  console.log('constructing deptree...')
  const dirPath = searchDir ? resolve(process.cwd(), searchDir) : undefined
  const moduleResolve = resolveConfig ? makeResolve(resolveConfig) : undefined
  const tree = await deptree(entryPath, moduleIgnorePatterns, moduleResolve)
  console.log('finished!')
  console.log('finding unused files...')
  const unusedFiles = await findUnused(tree, {
    searchDir: dirPath,
    ignorePatterns: fileIgnorePatterns,
  })
  console.log('Unused files: ')
  console.log(unusedFiles)
}

async function runClean(entry: string, options: Record<string, string>) {
  const entryPath = resolve(process.cwd(), entry)
  const userOptions = getUserOptions(options, entryPath)
  const { searchDir, moduleIgnorePatterns, fileIgnorePatterns, resolveConfig } =
    userOptions
  console.log('constructing deptree...')
  const dirPath = searchDir ? resolve(process.cwd(), searchDir) : undefined
  const moduleResolve = resolveConfig ? makeResolve(resolveConfig) : undefined
  const tree = await deptree(entryPath, moduleIgnorePatterns, moduleResolve)
  console.log('finished!')
  console.log('finding unused files...')
  const unusedFiles = await findUnused(tree, {
    searchDir: dirPath,
    ignorePatterns: fileIgnorePatterns,
  })
  console.log('found!')
  console.log('clean...')
  await cleanUnused(unusedFiles)
  console.log('cleaned!')
}

function readConfig(config: string) {
  try {
    if (!existsSync(config)) {
      console.log('reddeps config file cannot be found')
      return {}
    }
    const content = readFileSync(config, 'utf-8')
    return JSON.parse(content)
  } catch (err) {
    console.log('unable to read reddeps config')
  }
  return {}
}

function getUserOptions(options: Record<string, string>, entryPath: string) {
  const { config, ...inputOptions } = options
  const configPath = config
    ? resolve(process.cwd(), config)
    : resolve(dirname(entryPath), './reddeps.config.json')
  const configObj = readConfig(configPath)

  return {
    ...inputOptions,
    ...configObj,
  }
}
