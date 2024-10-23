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
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzNmU5ZTZhOS1lOThmLTRlM2QtYjg2NS1iMGQ1Y2JiZGQyYzUiLCJpZCI6MTA4NDQ0LCJpYXQiOjE2NjM1Njc5OTR9.CuE8Bqn8X02o64kfjVHZUiUU1bKiNeqWYXoY7e5_BCc'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

console.log('###import.meta.env', import.meta.env)
