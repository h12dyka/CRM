import { defineStore } from 'pinia'
import api from '@/plugins/axios'

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [],
    statistics: {
      today: 0,
      week: 0,
      month: 0,
      followup_pending: 0,
      clients_visited: 0,
      total_deal_value: 0
    },
    loading: false,
    currentFilter: 'all'
  }),

  actions: {
    async fetchActivities(filter = 'all') {
      this.loading = true
      this.currentFilter = filter
      
      try {
        const response = await api.get('/activities', {
          params: { filter }
        })
        
        this.activities = response.data.data || []
        return this.activities
      } catch (error) {
        console.error('Error fetching activities:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchStatistics() {
      try {
        const response = await api.get('/activities/statistics')
        
        this.statistics = response.data.data || {
          today: 0,
          week: 0,
          month: 0,
          followup_pending: 0,
          clients_visited: 0,
          total_deal_value: 0
        }
        
        return this.statistics
      } catch (error) {
        console.error('Error fetching statistics:', error)
        throw error
      }
    },

    async createActivity(formData) {
      try {
        // Handle file upload dengan FormData
        const payload = new FormData()
        
        // Append semua field ke FormData
        Object.keys(formData).forEach(key => {
          if (key === 'attachments' && formData[key]) {
            // Handle multiple files
            Array.from(formData[key]).forEach((file, index) => {
              payload.append(`attachments[${index}]`, file)
            })
          } else if (formData[key] !== null && formData[key] !== undefined) {
            payload.append(key, formData[key])
          }
        })
        
        // Override content-type untuk multipart/form-data
        const response = await api.post('/activities', payload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        // Refresh activities dan statistics setelah create
        await Promise.all([
          this.fetchActivities(this.currentFilter),
          this.fetchStatistics()
        ])
        
        return response.data.data
      } catch (error) {
        console.error('Error creating activity:', error)
        throw error
      }
    },

    async updateActivity(id, formData) {
      try {
        const response = await api.put(`/activities/${id}`, formData)
        
        // Refresh activities dan statistics
        await Promise.all([
          this.fetchActivities(this.currentFilter),
          this.fetchStatistics()
        ])
        
        return response.data.data
      } catch (error) {
        console.error('Error updating activity:', error)
        throw error
      }
    },

    async deleteActivity(id) {
      try {
        await api.delete(`/activities/${id}`)
        
        // Refresh activities dan statistics
        await Promise.all([
          this.fetchActivities(this.currentFilter),
          this.fetchStatistics()
        ])
        
        return true
      } catch (error) {
        console.error('Error deleting activity:', error)
        throw error
      }
    }
  }
})