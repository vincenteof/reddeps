import { lstat as _lstat, rm as _rm, unlink as _unlink } from 'fs'
import { promisify } from 'util'

const lstat = promisify(_lstat)
const rm = promisify(_rm)
const unlink = promisify(_unlink)

async function remove(fileOrDir: string) {
  const stats = await lstat(fileOrDir)
  if (stats.isDirectory()) {
    return rm(fileOrDir)
  }
  unlink(fileOrDir)
}

export async function cleanUnused(files: string[]) {
  return Promise.all(files.map(remove))
}
