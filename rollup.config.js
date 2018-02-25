import typescript from 'rollup-plugin-typescript2';
import uglify from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';


export default [
  {
    input: 'ts-src/main.ts',
    sourcemap: true,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        abortOnError: false,
      }),
      //uglify(),
    ],
    output: {
      format: 'iife',
      name: 'pickup',
      file: 'www/js/bundle.js',
      sourcemapFile: 'www/js/bundle.js.map'
    }
  },
]



