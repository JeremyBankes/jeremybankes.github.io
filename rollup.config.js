import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

/** @type {import('rollup').RollupOptions} */
const options = {
    input: 'source/Main.js',
    output: {
        file: 'docs/scripts/main.js',
        format: 'es'
    },
    plugins: [
        nodeResolve({ preferBuiltins: false }),
        commonjs()
    ]
};

export default options;