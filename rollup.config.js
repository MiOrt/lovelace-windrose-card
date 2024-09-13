import typescript from 'rollup-plugin-typescript2';
import multi from '@rollup/plugin-multi-entry';
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import {terser} from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

const dev = false;

export default {
    input: [
        'src/card/WindRoseCard.ts',
        'src/util/Log.ts'
    ],
    cache: false,
    output: {
        format: 'es',
        name: 'windroseCardBundle',
        treeshake: false,
        file: 'build/windrose-card.js'
    },
    plugins: [
        typescript(),
        multi(),
        nodeResolve(),
        commonjs(),
        json(),
        !dev && terser()],
};
