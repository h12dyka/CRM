<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const loginData = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    
    await authStore.login(loginData)
    
    router.push('/')
  } catch (err) {
    console.error('Login error:', err)
    error.value = err.response?.data?.message || 'Email atau password salah'
  } finally {
    loading.value = false
  }
}
</script>



Salin

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--primary), var(--primary-light)); padding: 2rem;">
    <div style="background: var(--bg-card); padding: 3rem; border-radius: 24px; max-width: 450px; width: 100%; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 class="logo" style="font-size: 2.5rem; margin-bottom: 0.5rem;">Field<span>Track</span></h1>
        <p style="color: var(--text-muted);">Masuk ke akun Anda</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input 
            type="email" 
            class="form-input" 
            v-model="loginData.email" 
            placeholder="nama@email.com"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            class="form-input" 
            v-model="loginData.password" 
            placeholder="••••••••"
            required
          >
        </div>

        <div v-if="error" class="error">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary" 
          style="width: 100%; margin-top: 1rem;"
          :disabled="loading"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <div style="text-align: center; margin-top: 2rem; color: var(--text-muted); font-size: 0.875rem;">
        <p>Demo credentials:</p>
        <p style="margin-top: 0.5rem;"><strong>Email:</strong> demo@fieldtrack.com</p>
        <p><strong>Password:</strong> password123</p>
      </div>
    </div>
  </div>
</template>