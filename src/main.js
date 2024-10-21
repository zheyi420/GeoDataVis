import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import 'cesium/Build/Cesium/Widgets/widgets.css'

window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}static/Cesium/`

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

console.log('###import.meta.env', import.meta.env)
