// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './src/pclock.ts',
  output: {
    file: 'bin/pclock.js',
    format: 'es',
  },
  external: ['node:fs', 'node:path', 'node:child_process'],
  plugins: [nodeResolve(), typescript(), json(), commonjs()],
};
