import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { setupPermissionDirectives } from './directives/permission'
import { setupLazyload } from './directives/lazyload'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
setupPermissionDirectives(app)
setupLazyload(app)

app.mount('#app')
