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
      /*
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        // external: ['cesium'], // 注释掉，让 cesium 被打包
        // plugins: [
        //   externalGlobals({ cesium: 'Cesium' }),
        //   terser({
        //     compress: {
        //       drop_console: true,
        //       drop_debugger: true,
        //     },
        //   }),
        // ],
        output: {
          // // 防止Cesium时钟相关代码被过度优化
          // manualChunks: {
          //   cesium: ['cesium']
          // },
          // chunkFileNames: (chunkInfo) => {
          //   if (chunkInfo.name === 'cesium') {
          //     return 'assets/cesium-[hash].js'
          //   }
          //   return 'assets/[name]-[hash].js'
          // }
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 打印出 id
              return id.toString().split('node_modules/')[1].split('/')[0].toString()
            }
          },
        }
      },
      // 确保Cesium的动态导入不被优化掉
      commonjsOptions: {
        ignoreTryCatch: false,
        transformMixedEsModules: true
      },
      assetsInlineLimit: 0
      */
    },
    // 优化依赖预构建
    /* optimizeDeps: {
      include: ['cesium'],
      exclude: []
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
