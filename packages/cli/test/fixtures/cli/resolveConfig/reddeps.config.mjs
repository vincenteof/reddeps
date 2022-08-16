import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const config = {
  moduleIgnorePatterns: ['**/node_modules/**'],
  fileIgnorePatterns: ['reddeps.config.json', 'reddeps.config.mjs'],
  resolveConfig: {
    extensions: ['.js', '.json', '.jsx', '.tsx', '.ts', '.d.ts'],
    modules: ['node_modules', resolve(__dirname, './common')],
  },
}

export default config
