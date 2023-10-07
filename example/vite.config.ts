import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

import {VitePixelTuner} from '../src/plugin';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        VitePixelTuner()
    ],
})
