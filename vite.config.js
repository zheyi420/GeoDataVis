import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import ElementPlus from 'unplugin-element-plus/vite'
import { viteExternalsPlugin } from 'vite-plugin-externals'
import { insertHtml, h } from 'vite-plugin-insert-html'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  // 根据构建模式设置不同的输出目录
  let outDir = 'dist'
  if (mode === 'production-github-pages') {
    outDir = 'dist/github-pages'
  } else if (mode === 'production-local') {
    outDir = 'dist/local'
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
      ElementPlus({
        // options
      }),
      viteExternalsPlugin({
        cesium: 'Cesium'
      }, {
        disableInServe: true, // 开发模式时不外部化
        // useWindow: true
      }),
      insertHtml({
        head: [
          h('script', {
            src: 'static/Cesium/Cesium.js'
          })
        ]
      })
    ],
    /*
     * https://vite.dev/guide/static-deploy.html#github-pages
     */
    base: env.VITE_BASE_URL,
    build: {
      outDir: outDir,
      /* rollupOptions: {
        external: ['cesium']
      } */
    },
    preview: {
      outDir: outDir
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler' },
      }
    }
  }
})
