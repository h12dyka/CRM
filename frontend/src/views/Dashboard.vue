<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useActivityStore } from '@/stores/activity'

const router = useRouter()
const authStore = useAuthStore()
const activityStore = useActivityStore()

const userInitial = computed(() => {
  const name = authStore.currentUser?.name || 'U'
  return name.charAt(0).toUpperCase()
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function setFilter(filter) {
  activityStore.fetchActivities(filter)
}

onMounted(async () => {
  await Promise.all([
    activityStore.fetchStatistics(),
    activityStore.fetchActivities('all')
  ])
})
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <h1 class="logo">Field<span>Track</span></h1>
      <div class="user-info">
        <span class="user-name">{{ authStore.currentUser?.name || 'User' }}</span>
        <div class="user-avatar">{{ userInitial }}</div>
        <button type="button" class="btn btn-secondary" @click="handleLogout">
          Keluar
        </button>
      </div>
    </header>

    <main class="container">
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ activityStore.statistics.today }}</div>
          <div class="stat-label">Hari ini</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activityStore.statistics.week }}</div>
          <div class="stat-label">Minggu ini</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activityStore.statistics.month }}</div>
          <div class="stat-label">Bulan ini</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activityStore.statistics.followup_pending }}</div>
          <div class="stat-label">Follow-up tertunda</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activityStore.statistics.clients_visited }}</div>
          <div class="stat-label">Klien dikunjungi (bulan ini)</div>
        </div>
      </section>

      <section class="activities-section">
        <div class="section-header">
          <h2>Aktivitas Lapangan</h2>
          <div class="filter-tabs">
            <button
              type="button"
              class="filter-tab"
              :class="{ active: activityStore.currentFilter === 'all' }"
              @click="setFilter('all')"
            >
              Semua
            </button>
            <button
              type="button"
              class="filter-tab"
              :class="{ active: activityStore.currentFilter === 'today' }"
              @click="setFilter('today')"
            >
              Hari ini
            </button>
            <button
              type="button"
              class="filter-tab"
              :class="{ active: activityStore.currentFilter === 'week' }"
              @click="setFilter('week')"
            >
              Minggu ini
            </button>
          </div>
        </div>

        <div v-if="activityStore.loading" class="loading-state">
          Memuat aktivitas...
        </div>
        <div v-else-if="!activityStore.activities.length" class="empty-state">
          Belum ada aktivitas. Filter mungkin tidak mengembalikan data.
        </div>
        <div v-else class="activity-list">
          <div
            v-for="activity in activityStore.activities"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-header">
              <span class="activity-client">{{ activity.client_name }}</span>
              <span class="activity-type" :class="activity.activity_type">
                {{ activity.activity_type }}
              </span>
            </div>
            <div class="activity-meta">
              <span class="activity-time">
                {{ activity.formatted_date || activity.activity_date }} · {{ activity.activity_time }}
              </span>
              <span class="activity-status">{{ activity.status }}</span>
            </div>
            <p v-if="activity.description" class="activity-description">
              {{ activity.description }}
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.user-name {
  font-size: 0.95rem;
  opacity: 0.95;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.filter-tabs {
  display: flex;
  gap: 0.5rem;
}
.filter-tab {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--bg-card);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-muted);
  transition: all 0.2s;
}
.filter-tab:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.filter-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.section-header h2 {
  font-size: 1.5rem;
  color: var(--text);
}
.activities-section {
  margin-top: 2rem;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border);
}
.activity-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.activity-status {
  text-transform: capitalize;
}
</style>
