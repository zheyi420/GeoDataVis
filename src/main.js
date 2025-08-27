import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

/**
 * https://cesium.com/learn/cesiumjs-learn/cesiumjs-quickstart/
 * 
 * Configuring CESIUM_BASE_URL
 * 
 * CesiumJS requires a few static files to be hosted on your server, like web workers and SVG icons.
 * Configure your module bundler to copy the following four directories and serve them as static files:
 * 
 * node_modules/cesium/Build/Cesium/Workers
 * node_modules/cesium/Build/Cesium/ThirdParty
 * node_modules/cesium/Build/Cesium/Assets
 * node_modules/cesium/Build/Cesium/Widgets
 * 
 * The window.CESIUM_BASE_URL global variable must be set before CesiumJS is imported.
 * It must point to the URL where those four directories are served.
 */
window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}static/Cesium/`

import { Ion } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ZmY2ZWNkYy04ZjI4LTQ1ZjQtYjRhYS0wZjYwMDdmNmUyZTUiLCJpZCI6MTA4NDQ0LCJpYXQiOjE3NTM4MDQyNzV9.9007CkJcf5kmK2odPZVGTrWExOwhOZy6mqs0GD_wo7A'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

console.log('###import.meta.env', import.meta.env)
