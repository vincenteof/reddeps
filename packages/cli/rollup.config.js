import { defineConfig } from 'rollup'
import { builtinModules } from 'module'
import esbuild from 'rollup-plugin-esbuild'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import pkg from './package.json'

const external = [
  ...builtinModules,
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]

export default defineConfig([
  {
    input: './src/cli.ts',
    output: {
      dir: 'lib',
      format: 'esm',
      entryFileNames: '[name].mjs',
    },
    external,
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      json(),
      commonjs(),
      esbuild({
        target: 'node14',
      }),
    ],
  },
])
