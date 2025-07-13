import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

const plugins = [
  nodeResolve({
    // Performance: Optimize module resolution
    preferBuiltins: false,
    browser: true
  }),
  commonjs({
    include: 'node_modules/**'
  }),
  typescript({
    // Performance: Enable incremental compilation
    tsconfigOverride: {
      compilerOptions: {
        incremental: true,
        tsBuildInfoFile: '.tsbuildinfo'
      }
    }
  }),
  json(),
  babel({
    exclude: 'node_modules/**',
    babelHelpers: 'bundled'
  }),
  terser({
    // Performance: Optimize minification
    compress: {
      drop_console: true, // Remove console.log in production
      drop_debugger: true,
      pure_funcs: ['console.info', 'console.debug', 'console.warn']
    },
    mangle: {
      safari10: true
    }
  })
];

export default [
  {
    input: 'src/grill-buddy.ts',
    output: {
      dir: 'dist',
      format: 'iife',
      // Performance: Keep inlined for now since we're optimizing other areas
      inlineDynamicImports: true,
      sourcemap: false,
    },
    plugins: [...plugins],
    context: 'window',
    onwarn: (warning, warn) => {
      // Suppress certain warnings to clean up build output
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      warn(warning);
    }
  },
];