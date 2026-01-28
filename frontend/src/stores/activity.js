import { defineStore } from 'pinia'
import axios from '@/plugins/axios'

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [],
    statistics: {
      today: 0,
      week: 0,
      month: 0,
      followup_pending: 0,
      clients_visited: 0,
      total_deal_value: 0,
    },
    loading: false,
    currentFilter: 'all',
  }),

  actions: {
    async fetchActivities(filter = 'all') {
      this.loading = true
      this.currentFilter = filter
      
      try {
        const params = filter !== 'all' ? { filter } : {}
        const response = await axios.get('/api/activities', { params })
        this.activities = response.data.data
        return response.data
      } catch (error) {
        console.error('Error fetching activities:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchStatistics() {
      try {
        const response = await axios.get('/api/statistics')
        this.statistics = response.data
        return response.data
      } catch (error) {
        console.error('Error fetching statistics:', error)
        throw error
      }
    },

    async createActivity(activityData) {
      this.loading = true
      
      try {
        const formData = new FormData()
        
        // Append all fields to FormData
        Object.keys(activityData).forEach(key => {
          if (key === 'attachments' && activityData[key]) {
            // Handle file attachments
            Array.from(activityData[key]).forEach((file, index) => {
              formData.append(`attachments[${index}]`, file)
            })
          } else if (activityData[key] !== null && activityData[key] !== undefined) {
            formData.append(key, activityData[key])
          }
        })
        
        const response = await axios.post('/api/activities', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        // Add new activity to the beginning of the list
        this.activities.unshift(response.data.data)
        
        // Refresh statistics
        await this.fetchStatistics()
        
        return response.data
      } catch (error) {
        console.error('Error creating activity:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateActivity(id, activityData) {
      this.loading = true
      
      try {
        const response = await axios.put(`/api/activities/${id}`, activityData)
        
        // Update activity in the list
        const index = this.activities.findIndex(a => a.id === id)
        if (index !== -1) {
          this.activities[index] = response.data.data
        }
        
        return response.data
      } catch (error) {
        console.error('Error updating activity:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteActivity(id) {
      this.loading = true
      
      try {
        await axios.delete(`/api/activities/${id}`)
        
        // Remove activity from the list
        this.activities = this.activities.filter(a => a.id !== id)
        
        // Refresh statistics
        await this.fetchStatistics()
      } catch (error) {
        console.error('Error deleting activity:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})