import { defineStore } from 'pinia'
import api from '@/plugins/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    currentUser: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null
  }),

  getters: {
    // Getter untuk isAuthenticated (alternatif dari state)
    getIsAuthenticated: (state) => !!state.token,
    
    // Getter untuk current user
    getCurrentUser: (state) => state.currentUser
  },

  actions: {
    /**
     * Initialize auth state from localStorage
     * Called on app mount
     */
    initializeAuth() {
      try {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        
        this.token = token
        this.currentUser = user ? JSON.parse(user) : null
        this.isAuthenticated = !!token
        
        return true
      } catch (error) {
        console.error('Initialize auth failed:', error)
        this.clearAuth()
        return false
      }
    },

    /**
     * Clear all auth state
     */
    clearAuth() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      this.token = null
      this.currentUser = null
      this.isAuthenticated = false
      this.error = null
    },

    /**
     * Login user
     * @param {string|Object} emailOrData - Email string or object with email and password
     * @param {string} password - Password (optional if first param is object)
     */
    async login(emailOrData, password) {
      this.loading = true
      this.error = null
      
      try {
        // Handle both login(email, password) and login({ email, password })
        const credentials = typeof emailOrData === 'object' 
          ? { email: emailOrData.email, password: emailOrData.password }
          : { email: emailOrData, password }

        const response = await api.post('/auth/login', credentials)

        // Handle different response structures
        let token, user
        
        if (response.data.data) {
          // Structure: { data: { token, user } } or { data: { access_token, user } }
          token = response.data.data.token || response.data.data.access_token
          user = response.data.data.user
        } else {
          // Structure: { token, user } or { access_token, user }
          token = response.data.token || response.data.access_token
          user = response.data.user
        }
        
        if (!token || !user) {
          throw new Error('Invalid response: missing token or user')
        }

        // Store token and user
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        this.token = token
        this.currentUser = user
        this.isAuthenticated = true

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Login gagal'
        console.error('❌ Login error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Register new user
     */
    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.post('/auth/register', userData)
        
        // Handle different response structures
        let token, user
        
        if (response.data.data) {
          // Structure: { data: { token, user } } or { data: { access_token, user } }
          token = response.data.data.token || response.data.data.access_token
          user = response.data.data.user
        } else {
          // Structure: { token, user } or { access_token, user }
          token = response.data.token || response.data.access_token
          user = response.data.user
        }
        
        if (!token || !user) {
          throw new Error('Invalid response: missing token or user')
        }

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        this.token = token
        this.currentUser = user
        this.isAuthenticated = true

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Registrasi gagal'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Get current user profile
     */
    async fetchUserProfile() {
      try {
        const response = await api.get('/auth/profile')
        const user = response.data.data
        
        this.currentUser = user
        localStorage.setItem('user', JSON.stringify(user))
        
        return user
      } catch (error) {
        console.error('Fetch profile error:', error)
        // If profile fetch fails with 401, clear auth
        if (error.response?.status === 401) {
          this.clearAuth()
        }
        throw error
      }
    },

    /**
     * Update user profile
     */
    async updateProfile(userData) {
      try {
        const response = await api.put('/auth/profile', userData)
        const user = response.data.data
        
        this.currentUser = user
        localStorage.setItem('user', JSON.stringify(user))
        
        return user
      } catch (error) {
        console.error('Update profile error:', error)
        throw error
      }
    },

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
      try {
        await api.post('/auth/change-password', {
          current_password: currentPassword,
          new_password: newPassword
        })
        
        return true
      } catch (error) {
        console.error('Change password error:', error)
        throw error
      }
    },

    /**
     * Logout user
     */
    async logout() {
      try {
        // Attempt to call the logout API endpoint
        // This is optional - if server-side logout fails, we still clear local state
        await api.post('/auth/logout')
      } catch (error) {
        // Log the error but don't throw - we still want to clear local state
        console.warn('API logout failed, but clearing local state:', error)
      }
      
      // Always clear local storage and reset state
      this.clearAuth()
      
      return true
    }
  }
})