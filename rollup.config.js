// rollup.config.js
import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/pclock.ts',
  output: {
    file: 'bin/pclock.js',
    format: 'es',
  },
  external: 'node:child_process',
  plugins: [typescript()],
};
