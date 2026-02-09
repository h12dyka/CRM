<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  activity: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['close', 'saved'])

const ACTIVITY_TYPES = [
  { value: 'meeting', label: 'Rapat' },
  { value: 'visit', label: 'Kunjungan' },
  { value: 'call', label: 'Telepon' },
  { value: 'presentation', label: 'Presentasi' },
  { value: 'demo', label: 'Demo' },
  { value: 'followup', label: 'Tindak lanjut' }
]

const STATUS_OPTIONS = [
  { value: 'success', label: 'Berhasil' },
  { value: 'pending', label: 'Pending' },
  { value: 'followup', label: 'Tindak lanjut' },
  { value: 'closed', label: 'Tertutup' }
]

const isEdit = computed(() => !!props.activity?.id)

const form = ref({
  activity_date: '',
  activity_time: '',
  client_name: '',
  activity_type: 'visit',
  status: 'pending',
  location: '',
  contact_person: '',
  description: '',
  deal_value: '',
  next_action: '',
  attachments: null
})

const errorMessage = ref('')

function getDefaultForm() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    activity_date: today,
    activity_time: '09:00',
    client_name: '',
    activity_type: 'visit',
    status: 'pending',
    location: '',
    contact_person: '',
    description: '',
    deal_value: '',
    next_action: '',
    attachments: null
  }
}

watch(
  () => [props.show, props.activity],
  () => {
    if (props.show) {
      errorMessage.value = props.error || ''
      if (props.activity) {
        const a = props.activity
        form.value = {
          activity_date: a.activity_date?.slice?.(0, 10) || a.activity_date || '',
          activity_time: a.activity_time || '09:00',
          client_name: a.client_name || '',
          activity_type: a.activity_type || 'visit',
          status: a.status || 'pending',
          location: a.location || '',
          contact_person: a.contact_person || '',
          description: a.description || '',
          deal_value: a.deal_value || '',
          next_action: a.next_action || '',
          attachments: null
        }
      } else {
        form.value = getDefaultForm()
      }
    }
  },
  { immediate: true }
)

function close() {
  emit('close')
}

function submitForm() {
  if (isEdit.value) {
    const data = { ...form.value }
    delete data.attachments
    emit('saved', { id: props.activity.id, data })
  } else {
    emit('saved', { data: { ...form.value } })
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? 'Edit Aktivitas' : 'Tambah Aktivitas' }}</h3>
          <button type="button" class="modal-close" aria-label="Tutup" @click="close">×</button>
        </div>
        <form
          class="modal-body"
          @submit.prevent="submitForm"
        >
          <div v-if="errorMessage || error" class="form-error">
            {{ errorMessage || error }}
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tanggal *</label>
              <input v-model="form.activity_date" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Waktu *</label>
              <input v-model="form.activity_time" type="time" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nama Klien *</label>
            <input
              v-model="form.client_name"
              type="text"
              class="form-input"
              placeholder="Nama perusahaan / klien"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipe Aktivitas *</label>
              <select v-model="form.activity_type" class="form-select" required>
                <option v-for="opt in ACTIVITY_TYPES" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status *</label>
              <select v-model="form.status" class="form-select" required>
                <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Lokasi</label>
            <input
              v-model="form.location"
              type="text"
              class="form-input"
              placeholder="Alamat / lokasi"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Contact Person</label>
            <input
              v-model="form.contact_person"
              type="text"
              class="form-input"
              placeholder="Nama contact person"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi *</label>
            <textarea
              v-model="form.description"
              class="form-textarea"
              rows="3"
              placeholder="Ringkasan aktivitas"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nilai Deal</label>
              <input
                v-model="form.deal_value"
                type="text"
                class="form-input"
                placeholder="Contoh: Rp 5.000.000"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Tindak Lanjut</label>
              <input
                v-model="form.next_action"
                type="text"
                class="form-input"
                placeholder="Rencana tindak lanjut"
              />
            </div>
          </div>

          <div v-if="!isEdit" class="form-group">
            <label class="form-label">Lampiran (opsional)</label>
            <input
              type="file"
              class="form-input"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              @change="form.attachments = $event.target.files"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="close">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 35, 50, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-box {
  background: var(--bg-card);
  border-radius: var(--radius-lg, 20px);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--border);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.35rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(to bottom, var(--bg) 0%, var(--bg-card) 100%);
}
.modal-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}
.modal-close {
  width: 38px;
  height: 38px;
  border: none;
  background: var(--bg);
  border-radius: var(--radius, 10px);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s, color 0.2s;
}
.modal-close:hover {
  background: var(--border);
  color: var(--accent);
}
.modal-body {
  padding: 1.5rem 1.5rem 1.75rem;
  overflow-y: auto;
}
.modal-body .form-group {
  margin-bottom: 1.25rem;
}
.form-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: var(--radius, 10px);
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
}
.modal-actions .btn {
  min-width: 100px;
}
</style>
