import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'

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
window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}libs/cesium/`

import 'cesium/Build/Cesium/Widgets/widgets.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')

console.log('import.meta', import.meta)
