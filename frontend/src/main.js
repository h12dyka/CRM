import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)        // ✅ PASANG PINIA DULU

const auth = useAuthStore()
auth.initializeAuth() // ✅ BARU BOLEH PAKE STORE

app.use(router)
app.mount('#app')
