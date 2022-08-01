import { create } from 'enhanced-resolve'
import { promisify } from 'util'

export type Resolve = (filePath: string, module: string) => Promise<string>

const resolve: Resolve = promisify(
  create({
    extensions: ['.ts', '.js'],
  })
)
export default resolve
