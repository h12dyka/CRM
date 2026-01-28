<script setup>
import { ref, reactive, onMounted} from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useActivityStore } from '@/stores/activity'


const authStore = useAuthStore()
const activityStore = useActivityStore()

const showModal = ref(false)
const submitting = ref(false)
const formError = ref('')
const fileLabel = ref('📎 Pilih file atau seret ke sini')

const notification = reactive({
  show: false,
  message: ''
})

const formData = reactive({
  activity_date: '',
  activity_time: '',
  client_name: '',
  activity_type: '',
  status: '',
  location: '',
  contact_person: '',
  description: '',
  deal_value: '',
  next_action: '',
  attachments: null
})

onMounted(async () => {
  await activityStore.fetchActivities()
  await activityStore.fetchStatistics()
})

const getInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getActivityTypeLabel = (type) => {
  const labels = {
    'meeting': 'Meeting',
    'visit': 'Kunjungan',
    'call': 'Telepon',
    'presentation': 'Presentasi',
    'demo': 'Demo',
    'followup': 'Follow-up'
  }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = {
    'success': 'Selesai',
    'pending': 'Pending',
    'followup': 'Perlu Follow-up',
    'closed': 'Deal Closed'
  }
  return labels[status] || status
}

const openModal = () => {
  initializeDateTime()
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = 'auto'
  resetForm()
}

const closeModalOnBackdrop = (e) => {
  if (e.target.classList.contains('modal')) {
    closeModal()
  }
}

const initializeDateTime = () => {
  const now = new Date()
  formData.activity_date = now.toISOString().split('T')[0]
  formData.activity_time = now.toTimeString().slice(0, 5)
}

const resetForm = () => {
  formData.activity_date = ''
  formData.activity_time = ''
  formData.client_name = ''
  formData.activity_type = ''
  formData.status = ''
  formData.location = ''
  formData.contact_person = ''
  formData.description = ''
  formData.deal_value = ''
  formData.next_action = ''
  formData.attachments = null
  fileLabel.value = '📎 Pilih file atau seret ke sini'
  formError.value = ''
}

const handleFileChange = (e) => {
  const files = e.target.files
  formData.attachments = files
  
  if (files.length > 0) {
    fileLabel.value = `✓ ${files.length} file dipilih`
  } else {
    fileLabel.value = '📎 Pilih file atau seret ke sini'
  }
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    formError.value = ''
    
    await activityStore.createActivity(formData)
    
    closeModal()
    showNotification('✓ Aktivitas berhasil ditambahkan!')
  } catch (error) {
    console.error('Error submitting form:', error)
    formError.value = error.response?.data?.message || 'Gagal menyimpan aktivitas. Silakan coba lagi.'
  } finally {
    submitting.value = false
  }
}

const filterActivities = async (filter) => {
  await activityStore.fetchActivities(filter)
  showNotification(`Filter diubah ke: ${filter === 'all' ? 'Semua' : filter === 'today' ? 'Hari Ini' : 'Minggu Ini'}`)
}

const showNotification = (message) => {
  notification.message = message
  notification.show = true
  
  setTimeout(() => {
    notification.show = false
  }, 3000)
}
</script>

<template>
  <div>
    <!-- Notification -->
    <div class="notification" :class="{ show: notification.show }">
      {{ notification.message }}
    </div>

    <!-- Header -->
    <header class="header">
      <div class="logo">Field<span>Track</span></div>
      <div class="user-info">
        <div>
          <div style="font-size: 0.875rem; opacity: 0.8;">Selamat datang,</div>
          <div style="font-weight: 700;">{{ authStore.currentUser?.name || 'User' }}</div>
        </div>
        <div class="user-avatar">{{ getInitials(authStore.currentUser?.name) }}</div>
      </div>
    </header>

    <!-- Main Container -->
    <div class="container">
      <!-- Statistics Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Aktivitas Hari Ini</div>
          <div class="stat-value">{{ activityStore.statistics.today }}</div>
          <div class="stat-change">↑ 2 dari kemarin</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Minggu Ini</div>
          <div class="stat-value">{{ activityStore.statistics.week }}</div>
          <div class="stat-change">↑ 18% dari minggu lalu</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Follow-up Pending</div>
          <div class="stat-value">{{ activityStore.statistics.followup_pending }}</div>
          <div class="stat-change" style="color: var(--warning)">Perlu perhatian</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Klien Dikunjungi</div>
          <div class="stat-value">{{ activityStore.statistics.clients_visited }}</div>
          <div class="stat-change">Bulan ini</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="main-grid">
        <!-- Activities Section -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Aktivitas Terbaru</h2>
            <button class="btn btn-primary" @click="openModal">+ Tambah Aktivitas</button>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button 
              class="quick-btn" 
              :class="{ active: activityStore.currentFilter === 'all' }"
              @click="filterActivities('all')"
            >
              Semua
            </button>
            <button 
              class="quick-btn"
              :class="{ active: activityStore.currentFilter === 'today' }"
              @click="filterActivities('today')"
            >
              Hari Ini
            </button>
            <button 
              class="quick-btn"
              :class="{ active: activityStore.currentFilter === 'week' }"
              @click="filterActivities('week')"
            >
              Minggu Ini
            </button>
          </div>

          <!-- Timeline -->
          <div class="timeline">
            <div v-if="activityStore.loading" class="loading">
              Memuat aktivitas...
            </div>

            <div 
              v-else-if="activityStore.activities.length === 0" 
              class="loading"
            >
              Belum ada aktivitas
            </div>

            <div 
              v-else
              v-for="activity in activityStore.activities" 
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-header">
                <div>
                  <div class="activity-client">{{ activity.client_name }}</div>
                  <div class="activity-type" :class="activity.activity_type">
                    {{ getActivityTypeLabel(activity.activity_type) }}
                  </div>
                </div>
                <div class="activity-time">{{ activity.time_ago }}</div>
              </div>
              <div class="activity-description">
                {{ activity.description }}
                <span v-if="activity.location">
                  <br><small style="opacity: 0.7">📍 {{ activity.location }}</small>
                </span>
                <span v-if="activity.contact_person">
                  <br><small style="opacity: 0.7">👤 {{ activity.contact_person }}</small>
                </span>
                <span v-if="activity.deal_value">
                  <br><small style="opacity: 0.7; font-weight: 600; color: var(--success)">💰 {{ activity.deal_value }}</small>
                </span>
              </div>
              <span class="status-badge" :class="activity.status">
                {{ getStatusLabel(activity.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Summary Section -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Ringkasan Bulan Ini</h2>
          </div>
          
          <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 600;">Target Kunjungan</span>
              <span style="font-weight: 700; color: var(--accent);">{{ activityStore.statistics.month }}/30</span>
            </div>
            <div style="background: var(--bg); height: 12px; border-radius: 10px; overflow: hidden;">
              <div :style="{ width: (activityStore.statistics.month / 30 * 100) + '%', height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-light))', borderRadius: '10px' }"></div>
            </div>
          </div>

          <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 600;">Target Revenue</span>
              <span style="font-weight: 700; color: var(--success);">180/200 juta</span>
            </div>
            <div style="background: var(--bg); height: 12px; border-radius: 10px; overflow: hidden;">
              <div style="width: 90%; height: 100%; background: linear-gradient(90deg, var(--success), #0cd194); border-radius: 10px;"></div>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); padding: 1.5rem; border-radius: 16px; color: white; margin-top: 2rem;">
            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Total Deal Bulan Ini</div>
            <div style="font-family: 'Fraunces', serif; font-size: 2.5rem; font-weight: 900; margin-bottom: 0.25rem;">Rp 180 jt</div>
            <div style="font-size: 0.875rem; opacity: 0.8;">dari {{ activityStore.statistics.total_deal_value }} deal yang closed</div>
          </div>

          <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg); border-radius: 12px;">
            <div style="font-weight: 700; margin-bottom: 1rem; color: var(--primary);">Klien Prioritas Minggu Ini</div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>PT Maju Bersama</span>
                <span style="padding: 0.25rem 0.75rem; background: #fef3c7; color: #92400e; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">HOT</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>CV Digital Prima</span>
                <span style="padding: 0.25rem 0.75rem; background: #fef3c7; color: #92400e; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">HOT</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>UD Harapan Jaya</span>
                <span style="padding: 0.25rem 0.75rem; background: #e0f2fe; color: #0369a1; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">WARM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal" :class="{ active: showModal }" @click="closeModalOnBackdrop">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Tambah Aktivitas Baru</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tanggal</label>
              <input type="date" class="form-input" v-model="formData.activity_date" required>
            </div>
            <div class="form-group">
              <label class="form-label">Waktu</label>
              <input type="time" class="form-input" v-model="formData.activity_time" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nama Klien / Perusahaan</label>
            <input type="text" class="form-input" v-model="formData.client_name" placeholder="Contoh: PT Maju Bersama" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Jenis Aktivitas</label>
              <select class="form-select" v-model="formData.activity_type" required>
                <option value="">Pilih jenis aktivitas</option>
                <option value="meeting">Meeting</option>
                <option value="visit">Kunjungan Lapangan</option>
                <option value="call">Telepon</option>
                <option value="presentation">Presentasi</option>
                <option value="demo">Demo Produk</option>
                <option value="followup">Follow-up</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" v-model="formData.status" required>
                <option value="">Pilih status</option>
                <option value="success">Berhasil / Selesai</option>
                <option value="pending">Pending</option>
                <option value="followup">Perlu Follow-up</option>
                <option value="closed">Deal Closed</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Lokasi</label>
            <input type="text" class="form-input" v-model="formData.location" placeholder="Contoh: Kantor klien - Jakarta Selatan">
          </div>

          <div class="form-group">
            <label class="form-label">Kontak Person</label>
            <input type="text" class="form-input" v-model="formData.contact_person" placeholder="Nama & Jabatan">
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi Kegiatan</label>
            <textarea class="form-textarea" v-model="formData.description" placeholder="Jelaskan detail aktivitas, hasil meeting, poin-poin penting yang didiskusikan, dll..." required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Nilai Potensi Deal (Opsional)</label>
            <input type="text" class="form-input" v-model="formData.deal_value" placeholder="Contoh: Rp 50.000.000">
          </div>

          <div class="form-group">
            <label class="form-label">Aksi Selanjutnya</label>
            <input type="text" class="form-input" v-model="formData.next_action" placeholder="Contoh: Kirim proposal detail, Follow-up minggu depan">
          </div>

          <div class="form-group">
            <label class="form-label">Upload Foto / Dokumen (Opsional)</label>
            <div class="file-input-wrapper">
              <label class="file-input-label">
                {{ fileLabel }}
                <input 
                  type="file" 
                  class="file-input" 
                  @change="handleFileChange"
                  accept="image/*,.pdf,.doc,.docx" 
                  multiple
                >
              </label>
            </div>
          </div>

          <div v-if="formError" class="error">
            {{ formError }}
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button type="button" class="btn btn-secondary" style="flex: 1;" @click="closeModal">Batal</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan Aktivitas' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
