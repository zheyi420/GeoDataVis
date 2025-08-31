import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import ElementPlus from 'unplugin-element-plus/vite'
import { viteExternalsPlugin } from 'vite-plugin-externals'
import { insertHtml, h } from 'vite-plugin-insert-html'
import { viteStaticCopy } from 'vite-plugin-static-copy'

/**
 * 参考：
 * - [教程 - 在 Vue3+Ts 中引入 CesiumJS 的最佳实践@2023](https://www.cnblogs.com/onsummer/p/17299759.html)
 */

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

  const cesiumLibraryRoot = 'node_modules/cesium/Build/Cesium/'
  const cesiumLibraryCopyToRootPath = 'libs/cesium/' // 相对于打包后的路径
  const cesiumStaticSourceCopyOptions = ['Assets', 'ThirdParty', 'Workers', 'Widgets'].map(dirName => {
    return {
      src: `${cesiumLibraryRoot}${dirName}/*`, // 注意后面的 * 字符，文件夹全量复制
      dest: `${cesiumLibraryCopyToRootPath}${dirName}`,
    }
  })

  const plugins = [
    vue(), // @vitejs/plugin-vue 将会把SFC的代码转换成js代码
    vueDevTools(),
    ElementPlus({
      // options
    }),
    /**
     * 这插件要放在@vitejs/plugin-vue的下面
     * 因为此插件只能解析js代码
     */
    viteExternalsPlugin(
      {
        /*
         * key 是要外部化的依赖名，value 是全局访问的名称，这里填写的是 'Cesium'
         * 意味着外部化后的 cesium 依赖可以通过 window['Cesium'] 访问；
         * 支持链式访问，参考此插件的文档
         */
        cesium: 'Cesium',
      },
      {
        disableInServe: true, // 开发模式时不外部化
        /*
         * 默认为 true , 设置 false , window 的作用域将不会加上。
         * 注意: 如果模块名有特殊字符，例如 /，设置useWindow选项 false 将引发错误。
         *
         * 开发模式会生效，访问 window.Cesium 为 undefined
         * 打包部署，不生效，依旧可访问 window.Cesium，原因如下：
         * ➡ 在下方通过插件 insertHtml 将 libs/cesium/Cesium.js 作为脚本插入到 index.html 中会导致 Cesium 可以全局访问，即可以通过 window.Cesium 访问。
         */
        useWindow: false,
      },
    ),
    viteStaticCopy({
      targets: [
        // 主库文件
        {
          src: `${cesiumLibraryRoot}Cesium.js`,
          dest: cesiumLibraryCopyToRootPath,
        },
        // 四大静态文件夹
        ...cesiumStaticSourceCopyOptions,
      ],
    })
  ]
  // 如果是构建，引入如下插件
  if (mode === 'production-github-pages' || mode === 'production-local') {
    plugins.push(
      /**
       * 打包后的页面因为外部化 cesium 找不到 CesiumJS 库
       * 使用插件自动在 index.html 引入 Cesium.js 库文件
       */
      insertHtml({
        head: [
          h('script', {
            src: 'libs/cesium/Cesium.js',
          }),
        ],
      }),
    )
  }
  /*
   * https://vite.dev/guide/static-deploy.html#github-pages
   */
  const base = env.VITE_BASE_URL
  const build = {
    outDir: outDir,
  }
  const preview = {
    outDir: outDir,
  }
  const resolve = {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  }
  const css = {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  }

  return {
    plugins,
    base,
    build,
    preview,
    resolve,
    css,
  }
})
