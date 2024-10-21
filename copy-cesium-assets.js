/*
 * @Author: zheyi420
 * @Date: 2024-10-21 23:47:03
 * @LastEditors: zheyi420
 * @LastEditTime: 2024-10-21 23:53:26
 * @FilePath: \GeoDataVis\copy-cesium-assets.js
 * @Description: 复制Cesium的静态文件到/public
 *
 */
import fs from 'fs'
import path from 'path'
import pkgNcp from 'ncp'
import { fileURLToPath } from 'url'

const { ncp } = pkgNcp

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log(__dirname) // 现在可以使用 __dirname

ncp.limit = 16

const sourceDir = path.join(__dirname, 'node_modules/cesium/Build/Cesium')
const destDir = path.join(__dirname, 'public/static/Cesium')

function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 创建目标目录（如果不存在）
createDirIfNotExists(path.join(destDir, 'Assets'))
createDirIfNotExists(path.join(destDir, 'ThirdParty'))
createDirIfNotExists(path.join(destDir, 'Widgets'))
createDirIfNotExists(path.join(destDir, 'Workers'))

// 使用 ncp 复制文件夹
ncp(
  path.join(sourceDir, 'Assets'),
  path.join(destDir, 'Assets'),
  function (err) {
    if (err) return console.error(err)
    console.log('Assets copied successfully!')
  },
)

ncp(
  path.join(sourceDir, 'ThirdParty'),
  path.join(destDir, 'ThirdParty'),
  function (err) {
    if (err) return console.error(err)
    console.log('ThirdParty copied successfully!')
  },
)

ncp(
  path.join(sourceDir, 'Widgets'),
  path.join(destDir, 'Widgets'),
  function (err) {
    if (err) return console.error(err)
    console.log('Widgets copied successfully!')
  },
)

ncp(
  path.join(sourceDir, 'Workers'),
  path.join(destDir, 'Workers'),
  function (err) {
    if (err) return console.error(err)
    console.log('Workers copied successfully!')
  },
)
