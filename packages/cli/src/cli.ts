import cac from 'cac'
import { resolve } from 'path'
import { deptree, findUnused } from '@reddeps/deptree'
import { cleanUnused } from './cleanUnused'
import { version } from '../package.json'

const cli = cac('reddeps')
cli.version(version)

cli
  .command('analyze <entry>', 'analyze unused files')
  .option('--searchDir <dir>', 'where to start search')
  .action(runAnalyze)

cli
  .command('clean <entry>', 'clean unused modules')
  .option('--searchDir <dir>', 'where to start search')
  .action(runRemove)

cli.help()
cli.parse()

async function runAnalyze(entry: string, options: Record<string, string>) {
  const entryPath = resolve(process.cwd(), entry)
  const dir = options.searchDir
  const dirPath = dir ?? resolve(process.cwd(), dir)
  console.log('constructing deptree...')
  const tree = await deptree(entryPath)
  console.log('finished!')
  console.log('finding unused files...')
  const unusedFiles = await findUnused(tree, dirPath)
  console.log('Unused files: ')
  console.log(unusedFiles)
}

async function runRemove(entry: string, options: Record<string, string>) {
  const entryPath = resolve(process.cwd(), entry)
  const dir = options.searchDir
  const dirPath = dir ?? resolve(process.cwd(), dir)
  console.log('constructing deptree...')
  const tree = await deptree(entryPath)
  console.log('finished!')
  console.log('finding unused files...')
  const unusedFiles = await findUnused(tree, dirPath)
  console.log('found!')
  console.log('clean...')
  await cleanUnused(unusedFiles)
  console.log('cleaned!')
}
