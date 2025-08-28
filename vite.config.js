import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import ElementPlus from 'unplugin-element-plus/vite'

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
    ],
    /*
     * https://vite.dev/guide/static-deploy.html#github-pages
     */
    base: env.VITE_BASE_URL,
    build: {
      outDir: outDir,
    },
    /* optimizeDeps: {
      exclude: ['cesium'],  // ← 避免 Vite 对 Cesium 预构建
    }, */
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
