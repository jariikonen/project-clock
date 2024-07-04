// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: './src/pclock.ts',
  output: {
    file: 'bin/pclock.js',
    format: 'es',
  },
  external: 'node:child_process',
  plugins: [typescript(), json()],
};
