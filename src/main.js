import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}static/Cesium/`
window.Cesium = Cesium
window.Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ZmY2ZWNkYy04ZjI4LTQ1ZjQtYjRhYS0wZjYwMDdmNmUyZTUiLCJpZCI6MTA4NDQ0LCJpYXQiOjE3NTM4MDQyNzV9.9007CkJcf5kmK2odPZVGTrWExOwhOZy6mqs0GD_wo7A'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

console.log('###import.meta.env', import.meta.env)
