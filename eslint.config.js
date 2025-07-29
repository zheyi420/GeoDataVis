import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/public/static/Cesium/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  skipFormatting,
  {
    languageOptions: {
      globals: {
        ...globals.browser,    // 包含 window, document, console 等浏览器全局变量
        ...globals.node,       // 包含 process, Buffer 等 Node.js 全局变量
        ...globals.es2021,     // 包含现代 JavaScript 全局变量
        // 项目特定的全局变量
        Cesium: 'readonly',    // Cesium 库
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'vue/no-unused-vars': 'warn',
    },
  },
]
