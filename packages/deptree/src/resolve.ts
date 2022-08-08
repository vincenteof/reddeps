import enhancedResolve from 'enhanced-resolve'
import { promisify } from 'util'

// eslint-disable-next-line import/no-named-as-default-member
const { create } = enhancedResolve

export type Resolve = (filePath: string, module: string) => Promise<string>

const resolve: Resolve = promisify(
  create({
    extensions: ['.ts', '.tsx', '.js'],
  })
)
export default resolve
