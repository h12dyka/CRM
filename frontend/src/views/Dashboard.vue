<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useActivityStore } from '@/stores/activity'
import ActivityFormModal from '@/components/ActivityFormModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const activityStore = useActivityStore()

const showModal = ref(false)
const editingActivity = ref(null)
const formSaving = ref(false)
const formError = ref('')

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

function openCreate() {
  editingActivity.value = null
  formError.value = ''
  showModal.value = true
}

function openEdit(activity) {
  editingActivity.value = activity
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingActivity.value = null
  formError.value = ''
}

async function onSaved(payload) {
  formError.value = ''
  formSaving.value = true
  try {
    if (payload.id) {
      await activityStore.updateActivity(payload.id, payload.data)
    } else {
      await activityStore.createActivity(payload.data)
    }
    closeModal()
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.errors
      ? Object.values(err.response.data.errors).flat().join(', ')
      : 'Gagal menyimpan. Coba lagi.'
    formError.value = msg
  } finally {
    formSaving.value = false
  }
}

async function confirmDelete(activity) {
  const name = activity.client_name || 'aktivitas ini'
  if (!window.confirm(`Hapus aktivitas "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
    return
  }
  try {
    await activityStore.deleteActivity(activity.id)
  } catch (err) {
    const msg = err.response?.data?.message || 'Gagal menghapus.'
    alert(msg)
  }
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
    <header class="header header-dashboard">
      <div class="header-left">
        <h1 class="logo">Field<span>Track</span></h1>
        <router-link v-if="authStore.isAdmin" to="/admin" class="header-admin-link">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Admin
        </router-link>
      </div>
      <div class="user-info">
        <span class="user-name">{{ authStore.currentUser?.name || 'User' }}</span>
        <div class="user-avatar">{{ userInitial }}</div>
        <button type="button" class="btn btn-header" @click="handleLogout">
          Keluar
        </button>
      </div>
    </header>

    <main class="container">
      <section class="stats-section">
        <div class="stats-grid dashboard-stats">
          <div class="stat-card" style="--delay: 0">
            <span class="stat-icon">📅</span>
            <div class="stat-value">{{ activityStore.statistics.today }}</div>
            <div class="stat-label">Hari ini</div>
          </div>
          <div class="stat-card" style="--delay: 1">
            <span class="stat-icon">📆</span>
            <div class="stat-value">{{ activityStore.statistics.week }}</div>
            <div class="stat-label">Minggu ini</div>
          </div>
          <div class="stat-card" style="--delay: 2">
            <span class="stat-icon">🗓</span>
            <div class="stat-value">{{ activityStore.statistics.month }}</div>
            <div class="stat-label">Bulan ini</div>
          </div>
          <div class="stat-card" style="--delay: 3">
            <span class="stat-icon">⏳</span>
            <div class="stat-value">{{ activityStore.statistics.followup_pending }}</div>
            <div class="stat-label">Follow-up tertunda</div>
          </div>
          <div class="stat-card" style="--delay: 4">
            <span class="stat-icon">👥</span>
            <div class="stat-value">{{ activityStore.statistics.clients_visited }}</div>
            <div class="stat-label">Klien (bulan ini)</div>
          </div>
        </div>
      </section>

      <section class="activities-section card-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-title-icon">📋</span>
            Aktivitas Lapangan
          </h2>
          <div class="section-header-actions">
            <button type="button" class="btn btn-primary btn-add" @click="openCreate">
              <span class="btn-icon">+</span>
              Tambah Aktivitas
            </button>
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
        </div>

        <div v-if="activityStore.loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Memuat aktivitas...</p>
        </div>
        <div v-else-if="!activityStore.activities.length" class="empty-state">
          <div class="empty-icon">📭</div>
          <p class="empty-title">Belum ada aktivitas</p>
          <p class="empty-desc">Klik "Tambah Aktivitas" untuk mencatat kunjungan atau rapat lapangan.</p>
        </div>
        <div v-else class="activity-list">
          <div
            v-for="(activity, i) in activityStore.activities"
            :key="activity.id"
            class="activity-item activity-card"
            :style="{ animationDelay: `${i * 0.03}s` }"
          >
            <div class="activity-main">
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
                <span class="status-badge" :class="activity.status">{{ activity.status }}</span>
              </div>
              <p v-if="activity.description" class="activity-description">
                {{ activity.description }}
              </p>
            </div>
            <div class="activity-actions">
              <button
                type="button"
                class="btn btn-icon btn-edit"
                title="Edit"
                @click="openEdit(activity)"
              >
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button
                type="button"
                class="btn btn-icon btn-delete"
                title="Hapus"
                @click="confirmDelete(activity)"
              >
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M10 11v6M14 11v6"/></svg>
                Hapus
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <ActivityFormModal
      :show="showModal"
      :activity="editingActivity"
      :saving="formSaving"
      :error="formError"
      @close="closeModal"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg);
}
.header-dashboard {
  padding: 1rem 1.5rem;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-admin-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.2s, color 0.2s;
}
.header-admin-link:hover {
  background: var(--accent);
  color: white;
}
.icon-sm {
  width: 18px;
  height: 18px;
}
.user-name {
  font-size: 0.95rem;
  opacity: 0.95;
  font-weight: 500;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.btn-header {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.btn-header:hover {
  background: rgba(255, 255, 255, 0.25);
}
.stats-section {
  margin-bottom: 2rem;
}
.dashboard-stats .stat-card {
  animation: fadeInUp 0.5s ease backwards;
  animation-delay: calc(0.05s * var(--delay, 0));
}
.stat-icon {
  font-size: 1.5rem;
  opacity: 0.9;
  display: block;
  margin-bottom: 0.5rem;
}
.card-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}
.section-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-title-icon {
  font-size: 1.25rem;
}
.section-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-add .btn-icon {
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 300;
}
.filter-tabs {
  display: flex;
  gap: 0.5rem;
}
.filter-tab {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: all 0.2s;
}
.filter-tab:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(232, 93, 4, 0.06);
}
.filter-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.activity-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-card);
  transition: box-shadow 0.2s, border-color 0.2s;
  animation: fadeInUp 0.35s ease backwards;
}
.activity-card:hover {
  box-shadow: var(--shadow-md);
  border-color: #cbd5e1;
}
.activity-main {
  flex: 1;
  min-width: 0;
}
.activity-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.btn-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius);
  transition: transform 0.2s;
}
.btn-icon .icon-xs {
  width: 14px;
  height: 14px;
}
.btn-icon:hover {
  transform: translateY(-1px);
}
.btn-edit {
  background: var(--primary-light);
  color: white;
  border: none;
}
.btn-edit:hover {
  background: var(--primary);
}
.btn-delete {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.btn-delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}
.activities-section {
  margin-top: 0;
}
.loading-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-muted);
  background: var(--bg);
  border-radius: var(--radius);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-state p,
.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-muted);
  background: var(--bg);
  border-radius: var(--radius);
  border: 2px dashed var(--border);
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  opacity: 0.7;
}
.empty-title {
  font-weight: 600;
  color: var(--text);
  font-size: 1.1rem;
}
.empty-desc {
  font-size: 0.9rem;
  margin-top: 0.25rem;
}
.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.activity-meta .status-badge {
  text-transform: capitalize;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}
.activity-meta .status-badge.success { background: #d1fae5; color: #065f46; }
.activity-meta .status-badge.pending { background: #fef3c7; color: #92400e; }
.activity-meta .status-badge.followup { background: #fee2e2; color: #991b1b; }
.activity-meta .status-badge.closed { background: #dbeafe; color: #1e40af; }
</style>
