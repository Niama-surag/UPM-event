<template>
  <div class="profile-page">

    <div class="profile-header">
      <h1>My Profile</h1>
      <p>Manage your personal information and photo</p>
    </div>

    <div class="profile-grid">

      <!-- ── LEFT: Avatar section ────────────────────────────── -->
      <div class="avatar-card">
        <div class="avatar-wrap" @click="triggerFileInput">
          <img
            :src="previewUrl || authStore.userProfile?.photoURL || defaultAvatar"
            alt="Profile photo"
            class="avatar-img"
          />
          <!-- Hover overlay -->
          <div class="avatar-overlay">
            <i class="fas fa-camera"></i>
            <span>Change Photo</span>
          </div>
        </div>

        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style="display:none"
          @change="handleFileSelect"
        />

        <!-- File info + save/cancel -->
        <Transition name="fade">
          <div v-if="selectedFile" class="file-actions">
            <div class="file-info">
              <i class="fas fa-image"></i>
              {{ selectedFile.name }}
              <small>({{ formatSize(selectedFile.size) }})</small>
            </div>
            <div class="file-btns">
              <button @click="savePhoto" :disabled="uploading" class="btn-save-photo">
                <i class="fas fa-upload"></i>
                {{ uploading ? 'Uploading…' : 'Save Photo' }}
                <span v-if="uploading" class="upload-progress">{{ uploadPercent }}%</span>
              </button>
              <button @click="cancelPhoto" class="btn-cancel-photo">Cancel</button>
            </div>
          </div>
        </Transition>

        <div class="avatar-meta">
          <h3>{{ authStore.userProfile?.name || authStore.user?.displayName || 'No name set' }}</h3>
          <p>{{ authStore.user?.email }}</p>
          <RoleBadge :role="authStore.userProfile?.role || 'user'" />
        </div>

        <div class="profile-stats">
          <div class="pstat">
            <span class="pstat-num">{{ statsData.events }}</span>
            <span class="pstat-label">Events</span>
          </div>
          <div class="pstat">
            <span class="pstat-num">{{ statsData.clubs }}</span>
            <span class="pstat-label">Clubs</span>
          </div>
          <div class="pstat">
            <span class="pstat-num">{{ statsData.votes }}</span>
            <span class="pstat-label">Votes</span>
          </div>
        </div>
      </div>

      <!-- ── RIGHT: Edit forms ────────────────────────────────── -->
      <div class="forms-col">

        <!-- Edit name -->
        <div class="form-card">
          <h3 class="form-title"><i class="fas fa-user-edit"></i> Personal Info</h3>
          <form @submit.prevent="saveName">
            <div class="field">
              <label>Display Name</label>
              <input v-model="form.name" placeholder="Your name" required />
            </div>
            <div class="field">
              <label>Email (read-only)</label>
              <input :value="authStore.user?.email" disabled class="disabled-input" />
            </div>
            <button type="submit" :disabled="savingName" class="btn-primary">
              <i class="fas fa-save"></i>
              {{ savingName ? 'Saving…' : 'Save Changes' }}
            </button>
          </form>
        </div>

        <!-- Change password -->
        <div class="form-card">
          <h3 class="form-title"><i class="fas fa-lock"></i> Change Password</h3>
          <form @submit.prevent="savePassword">
            <div class="field">
              <label>Current Password</label>
              <div class="input-wrap">
                <input :type="showPwd.current ? 'text' : 'password'" v-model="pwdForm.current" required />
                <button type="button" class="eye-btn" @click="showPwd.current = !showPwd.current">
                  <i :class="showPwd.current ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>
            <div class="field">
              <label>New Password</label>
              <div class="input-wrap">
                <input :type="showPwd.new ? 'text' : 'password'" v-model="pwdForm.new" required minlength="6" />
                <button type="button" class="eye-btn" @click="showPwd.new = !showPwd.new">
                  <i :class="showPwd.new ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <!-- Password strength indicator -->
              <div class="strength-bar" v-if="pwdForm.new">
                <div class="strength-fill" :style="{ width: pwdStrength.pct + '%', background: pwdStrength.color }"></div>
              </div>
              <small v-if="pwdForm.new" :style="{ color: pwdStrength.color }">{{ pwdStrength.label }}</small>
            </div>
            <div class="field">
              <label>Confirm New Password</label>
              <input :type="showPwd.confirm ? 'text' : 'password'" v-model="pwdForm.confirm" required />
              <small v-if="pwdForm.confirm && pwdForm.new !== pwdForm.confirm" class="err-hint">Passwords don't match</small>
            </div>
            <button type="submit" :disabled="savingPwd || pwdForm.new !== pwdForm.confirm" class="btn-primary">
              <i class="fas fa-key"></i>
              {{ savingPwd ? 'Changing…' : 'Change Password' }}
            </button>
          </form>
        </div>

      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import RoleBadge from '@/components/ui/RoleBadge.vue'

const authStore    = useAuthStore()
const auth         = getAuth()
const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

// ── File upload state ─────────────────────────────────────────
const fileInputRef  = ref(null)
const selectedFile  = ref(null)
const previewUrl    = ref('')
const uploading     = ref(false)
const uploadPercent = ref(0)

// ── Name form ─────────────────────────────────────────────────
const form      = reactive({ name: authStore.userProfile?.name || authStore.user?.displayName || '' })
const savingName = ref(false)

// ── Password form ─────────────────────────────────────────────
const pwdForm   = reactive({ current: '', new: '', confirm: '' })
const savingPwd  = ref(false)
const showPwd    = reactive({ current: false, new: false, confirm: false })

// ── Stats ─────────────────────────────────────────────────────
const statsData  = ref({ events: 0, clubs: 0, votes: 0 })

// ── Toast ─────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success' })

// ── Password strength ─────────────────────────────────────────
const pwdStrength = computed(() => {
  const p = pwdForm.new
  if (!p) return { pct: 0, color: '#e2e8f0', label: '' }
  let score = 0
  if (p.length >= 8)            score++
  if (/[A-Z]/.test(p))          score++
  if (/[0-9]/.test(p))          score++
  if (/[^A-Za-z0-9]/.test(p))   score++
  const map = [
    { pct: 15,  color: '#ef4444', label: 'Weak' },
    { pct: 40,  color: '#f59e0b', label: 'Fair' },
    { pct: 70,  color: '#3b82f6', label: 'Good' },
    { pct: 100, color: '#10b981', label: 'Strong' },
  ]
  return map[score - 1] || map[0]
})

// ── Load stats ────────────────────────────────────────────────
onMounted(async () => {
  if (!authStore.user) return
  const uid = authStore.user.uid
  const [evSnap, clSnap, vtSnap] = await Promise.all([
    getDocs(query(collection(db, 'registrations'), where('userid', '==', uid))),
    getDocs(query(collection(db, 'clubs'), where('members', 'array-contains', uid))),
    getDocs(query(collection(db, 'Votes'), where('userid', '==', uid)))
  ])
  statsData.value = { events: evSnap.size, clubs: clSnap.size, votes: vtSnap.size }
})

// ── File handling ─────────────────────────────────────────────
const triggerFileInput = () => fileInputRef.value?.click()

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Client-side validation
  const MAX_SIZE = 5 * 1024 * 1024   // 5 MB
  const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED.includes(file.type)) {
    showToast('Only JPG, PNG, and WebP are allowed', 'error'); return
  }
  if (file.size > MAX_SIZE) {
    showToast('File is too large (max 5 MB)', 'error'); return
  }

  selectedFile.value = file
  // Generate local preview URL — no upload yet (save bandwidth)
  previewUrl.value = URL.createObjectURL(file)
}

const savePhoto = async () => {
  if (!selectedFile.value) return
  uploading.value = true
  uploadPercent.value = 0
  try {
    // Simulate progress for UX (real progress requires XMLHttpRequest, not fetch)
    const interval = setInterval(() => {
      if (uploadPercent.value < 85) uploadPercent.value += 15
    }, 200)
    await authStore.updateUserProfile({ name: form.name, photoFile: selectedFile.value })
    clearInterval(interval)
    uploadPercent.value = 100
    showToast('Profile photo updated! ✅', 'success')
    cancelPhoto()
  } catch (e) {
    showToast('Upload failed: ' + e.message, 'error')
  } finally {
    uploading.value = false
  }
}

const cancelPhoto = () => {
  selectedFile.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)   // free memory
  previewUrl.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ── Save name ─────────────────────────────────────────────────
const saveName = async () => {
  savingName.value = true
  try {
    await authStore.updateUserProfile({ name: form.name, photoFile: null })
    showToast('Name updated ✅', 'success')
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    savingName.value = false
  }
}

// ── Change password ───────────────────────────────────────────
const savePassword = async () => {
  if (pwdForm.new !== pwdForm.confirm) return
  savingPwd.value = true
  try {
    const user       = auth.currentUser
    const credential = EmailAuthProvider.credential(user.email, pwdForm.current)
    // Re-authenticate first (Firebase security requirement for sensitive ops)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, pwdForm.new)
    pwdForm.current = ''; pwdForm.new = ''; pwdForm.confirm = ''
    showToast('Password changed ✅', 'success')
  } catch (e) {
    const msg = e.code === 'auth/wrong-password'
      ? 'Current password is incorrect'
      : e.message
    showToast(msg, 'error')
  } finally {
    savingPwd.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3500)
}
</script>

<style scoped>
.profile-page { max-width: 1000px; margin: 0 auto; padding: 2rem; }

.profile-header { margin-bottom: 2rem; }
.profile-header h1 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; }
.profile-header p  { color: #64748b; margin: 0; }

.profile-grid { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }

/* ── Avatar card ────────────────────────────────────────────── */
.avatar-card { background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); text-align: center; position: sticky; top: 80px; }

.avatar-wrap { position: relative; width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 1rem; cursor: pointer; overflow: hidden; border: 3px solid #e2e8f0; transition: border-color 0.2s; }
.avatar-wrap:hover { border-color: #2563eb; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-overlay { position: absolute; inset: 0; background: rgba(37,99,235,0.75); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem; opacity: 0; transition: opacity 0.2s; color: white; font-size: 0.78rem; font-weight: 600; }
.avatar-wrap:hover .avatar-overlay { opacity: 1; }
.avatar-overlay i { font-size: 1.3rem; }

.file-actions { margin-bottom: 1rem; padding: 0.85rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
.file-info { font-size: 0.78rem; color: #475569; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.6rem; word-break: break-all; }
.file-btns { display: flex; gap: 0.5rem; }
.btn-save-photo { flex: 1; padding: 0.48rem 0.6rem; background: #2563eb; color: white; border: none; border-radius: 7px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.35rem; transition: background 0.18s; }
.btn-save-photo:hover:not(:disabled) { background: #1d4ed8; }
.btn-save-photo:disabled { opacity: 0.6; cursor: not-allowed; }
.upload-progress { font-size: 0.7rem; opacity: 0.8; }
.btn-cancel-photo { padding: 0.48rem 0.75rem; background: none; border: 1.5px solid #e2e8f0; border-radius: 7px; font-size: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; }
.btn-cancel-photo:hover { border-color: #dc2626; color: #dc2626; }

.avatar-meta h3 { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem; }
.avatar-meta p  { font-size: 0.82rem; color: #64748b; margin: 0 0 0.6rem; }

.profile-stats { display: flex; justify-content: space-around; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
.pstat { display: flex; flex-direction: column; align-items: center; }
.pstat-num   { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.pstat-label { font-size: 0.72rem; color: #94a3b8; margin-top: 0.1rem; }

/* ── Forms ──────────────────────────────────────────────────── */
.forms-col { display: flex; flex-direction: column; gap: 1.25rem; }
.form-card { background: white; border-radius: 16px; padding: 1.75rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
.form-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
.form-title i { color: #2563eb; }

.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 0.35rem; }
.field input { width: 100%; padding: 0.65rem 0.9rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box; transition: border-color 0.18s; }
.field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.disabled-input { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

.input-wrap { position: relative; }
.input-wrap input { width: 100%; padding-right: 2.5rem; }
.eye-btn { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem; padding: 0; }

.strength-bar { height: 4px; background: #f1f5f9; border-radius: 2px; margin-top: 0.4rem; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 2px; transition: all 0.3s ease; }
.err-hint { color: #dc2626; font-size: 0.78rem; }

.btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1.4rem; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.18s; margin-top: 0.25rem; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* Toast */
.toast { position: fixed; bottom: 5rem; right: 1.5rem; z-index: 9999; padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 600; font-size: 0.88rem; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
.toast.success { background: #10b981; color: white; }
.toast.error   { background: #dc2626; color: white; }
.toast-enter-active, .toast-leave-active { transition: all 0.22s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .profile-grid { grid-template-columns: 1fr; }
  .avatar-card { position: static; }
  .profile-page { padding: 1rem; }
}
</style>
