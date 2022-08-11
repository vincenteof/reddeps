import cac from 'cac'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { deptree, findUnused } from '@reddeps/deptree'
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
  const userOptions = getUserOptions(options)
  const { dir } = userOptions
  const dirPath = dir ? resolve(process.cwd(), dir) : undefined
  console.log('constructing deptree...')
  const tree = await deptree(entryPath)
  console.log('finished!')
  console.log('finding unused files...')
  const unusedFiles = await findUnused(tree, { searchDir: dirPath })
  console.log('Unused files: ')
  console.log(unusedFiles)
}

async function runClean(entry: string, options: Record<string, string>) {
  const entryPath = resolve(process.cwd(), entry)
  const userOptions = getUserOptions(options)
  const { dir } = userOptions
  const dirPath = dir ? resolve(process.cwd(), dir) : undefined
  console.log('constructing deptree...')
  const tree = await deptree(entryPath)
  console.log('finished!')
  console.log('finding unused files...')
  const unusedFiles = await findUnused(tree, { searchDir: dirPath })
  console.log('found!')
  console.log('clean...')
  await cleanUnused(unusedFiles)
  console.log('cleaned!')
}

function readConfig(config: string) {
  if (!config) {
    return {}
  }
  const configPath = resolve(process.cwd(), config)
  const content = readFileSync(configPath, 'utf-8')
  return JSON.parse(content)
}

function getUserOptions(options: Record<string, string>) {
  const { config, ...inputOptions } = options
  const configObj = readConfig(config)

  return {
    ...inputOptions,
    ...configObj,
  }
}
