<template>
  <div class="admin-dashboard">

    <div v-if="!authStore.isAdmin()" class="access-denied">
      <div style="font-size:4rem">🔒</div>
      <h2>Access Denied</h2>
      <router-link to="/" class="btn-home">Go Home</router-link>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1><i class="fas fa-shield-alt"></i> Admin Dashboard</h1>
          <p>Manage pending approvals, users, and platform settings</p>
        </div>
        <div class="header-right">
          <RoleBadge role="admin" />
          <span class="admin-name">{{ authStore.userProfile?.name }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card" v-for="s in stats" :key="s.label" :class="{ urgent: s.urgent && s.value > 0 }">
          <div class="stat-icon" :style="{ background: s.bg }"><i :class="s.icon" :style="{ color: s.color }"></i></div>
          <div>
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
          <span v-if="s.urgent && s.value > 0" class="urgent-dot"></span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="admin-tabs">
        <button :class="{ active: tab === 'clubs' }"    @click="tab = 'clubs'">
          <i class="fas fa-users"></i> Club Requests
          <span v-if="pendingClubs.length"  class="tab-badge">{{ pendingClubs.length }}</span>
        </button>
        <button :class="{ active: tab === 'events' }"   @click="tab = 'events'">
          <i class="fas fa-calendar-alt"></i> Event Requests
          <span v-if="pendingEvents.length" class="tab-badge">{{ pendingEvents.length }}</span>
        </button>
        <button :class="{ active: tab === 'users' }"    @click="tab = 'users'">
          <i class="fas fa-user"></i> Users
        </button>
        <button :class="{ active: tab === 'all-events' }" @click="tab = 'all-events'">
          <i class="fas fa-list"></i> All Events
        </button>
        <button :class="{ active: tab === 'settings' }" @click="tab = 'settings'">
          <i class="fas fa-paint-brush"></i> Site Settings
        </button>
      </div>

      <!-- ══ PENDING CLUBS ══ -->
      <div v-if="tab === 'clubs'">
        <div v-if="pendingClubs.length === 0" class="empty-state"><div class="empty-icon">✅</div><p>No pending club requests!</p></div>
        <div v-else>
          <p class="tab-hint">{{ pendingClubs.length }} club(s) waiting for review</p>
          <div class="request-list">
            <div v-for="club in pendingClubs" :key="club.id" class="request-card">
              <div class="request-body">
                <div class="req-avatar">{{ club.name?.charAt(0).toUpperCase() }}</div>
                <div class="req-info">
                  <h3>{{ club.name }}</h3>
                  <p class="req-desc">{{ club.description || 'No description' }}</p>
                  <div class="req-meta">
                    <span><i class="fas fa-user"></i> {{ club.leaderName }}</span>
                    <span><i class="fas fa-envelope"></i> {{ club.leaderEmail }}</span>
                    <span><i class="fas fa-clock"></i> {{ formatDate(club.createdAt) }}</span>
                  </div>
                </div>
                <span class="status-pill pending">⏳ Pending</span>
              </div>
              <div class="request-actions">
                <button class="btn-approve" @click="approveClub(club)" :disabled="club._loading">
                  <i class="fas fa-check-circle"></i> {{ club._loading === 'approve' ? 'Approving…' : 'Approve' }}
                </button>
                <button class="btn-reject" @click="rejectItem(club, 'club')" :disabled="club._loading">
                  <i class="fas fa-times-circle"></i> {{ club._loading === 'reject' ? 'Rejecting…' : 'Reject' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="section-divider"><h3>Approved Clubs <span class="count-badge">{{ approvedClubs.length }}</span></h3></div>
        <table class="admin-table" v-if="approvedClubs.length">
          <thead><tr><th>Name</th><th>Leader</th><th>Members</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="club in approvedClubs" :key="club.id">
              <td><strong>{{ club.name }}</strong></td>
              <td>{{ club.leaderName }}</td>
              <td>{{ club.members?.length || 0 }}</td>
              <td>{{ formatDate(club.createdAt) }}</td>
              <td><button class="btn-danger-sm" @click="deleteClub(club.id)"><i class="fas fa-trash"></i> Delete</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-inline">No approved clubs yet.</div>
      </div>

      <!-- ══ PENDING EVENTS ══ -->
      <div v-if="tab === 'events'">
        <div v-if="pendingEvents.length === 0" class="empty-state"><div class="empty-icon">✅</div><p>No pending event requests!</p></div>
        <div v-else>
          <p class="tab-hint">{{ pendingEvents.length }} event(s) waiting for review</p>
          <div class="request-list">
            <div v-for="event in pendingEvents" :key="event.id" class="request-card event-pending-card">
              <div class="request-body">
                <div class="req-avatar event-avatar">📅</div>
                <div class="req-info">
                  <h3>{{ event.title }}</h3>
                  <p class="req-desc">{{ event.description || 'No description' }}</p>
                  <div class="req-meta">
                    <span><i class="fas fa-users"></i> {{ event.clubName }}</span>
                    <span><i class="fas fa-user"></i> {{ event.creatorName }}</span>
                    <span><i class="fas fa-map-marker-alt"></i> {{ event.location || 'TBD' }}</span>
                    <span class="price-tag" :class="event.type">{{ event.type === 'free' ? 'Free' : event.price + '€' }}</span>
                  </div>
                  <img v-if="event.imageURL" :src="event.imageURL" class="event-thumb" :alt="event.title" />
                </div>
                <span class="status-pill pending">⏳ Pending</span>
              </div>
              <div class="request-actions">
                <button class="btn-approve" @click="approveEvent(event)" :disabled="event._loading">
                  <i class="fas fa-check-circle"></i> {{ event._loading === 'approve' ? 'Approving…' : 'Approve' }}
                </button>
                <button class="btn-reject" @click="rejectItem(event, 'event')" :disabled="event._loading">
                  <i class="fas fa-times-circle"></i> {{ event._loading === 'reject' ? 'Rejecting…' : 'Reject' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ USERS ══ -->
      <div v-if="tab === 'users'">
        <div v-if="loadingUsers" class="loading-text">Loading users…</div>
        <table v-else class="admin-table">
          <thead><tr><th>Avatar</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Change Role</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td><img :src="u.photoURL || defaultAvatar" class="user-avatar-sm" :alt="u.name" /></td>
              <td>{{ u.name || '—' }}</td>
              <td>{{ u.email }}</td>
              <td><RoleBadge :role="u.role || 'user'" /></td>
              <td>{{ formatDate(u.createdAt) }}</td>
              <td>
                <select :value="u.role" @change="changeUserRole(u, $event.target.value)" :disabled="u.id === authStore.user?.uid" class="role-select">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══ ALL EVENTS ══ -->
      <div v-if="tab === 'all-events'">
        <div v-if="loadingAllEvents" class="loading-text">Loading…</div>
        <table v-else class="admin-table">
          <thead><tr><th>Title</th><th>Club</th><th>Status</th><th>Type</th><th>Start</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="event in allEvents" :key="event.id">
              <td><strong>{{ event.title }}</strong></td>
              <td>{{ event.clubName || '—' }}</td>
              <td><span class="status-pill" :class="event.status">{{ statusEmoji(event.status) }} {{ event.status }}</span></td>
              <td><span class="price-tag" :class="event.type">{{ event.type === 'free' ? 'Free' : event.price + '€' }}</span></td>
              <td>{{ formatDate(event.startDate || event.startTime) }}</td>
              <td>
                <button v-if="event.status !== 'approved'" class="btn-sm-blue" @click="approveEvent(event)">Approve</button>
                <button class="btn-danger-sm" @click="deleteEvent(event.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══ SITE SETTINGS ══ -->
      <div v-if="tab === 'settings'" class="settings-panel">
        <h2 class="settings-title"><i class="fas fa-paint-brush"></i> Site Background</h2>
        <p class="settings-desc">
          Upload a background image or video that all users will see across the entire app.
          The background sits behind the page content with adjustable opacity.
        </p>

        <!-- Current preview -->
        <div class="bg-preview-wrap" v-if="settingsStore.background.type !== 'none' && settingsStore.background.url">
          <div class="bg-preview">
            <video
              v-if="settingsStore.background.type === 'video'"
              :src="settingsStore.background.url"
              autoplay loop muted playsinline
              class="preview-media"
            ></video>
            <img
              v-else
              :src="settingsStore.background.url"
              class="preview-media"
              alt="Background preview"
            />
            <div class="preview-label">Current background</div>
          </div>
          <button class="btn-remove-bg" @click="removeBackground">
            <i class="fas fa-trash"></i> Remove Background
          </button>
        </div>

        <!-- Upload zone -->
        <div
          class="upload-zone"
          :class="{ dragging: isDragging, uploading: settingsStore.uploading }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.bgFileInput.click()"
        >
          <input
            ref="bgFileInput"
            type="file"
            accept="image/*,video/*"
            style="display:none"
            @change="handleFileSelect"
          />
          <div v-if="settingsStore.uploading" class="upload-progress-wrap">
            <div class="upload-progress-bar">
              <div class="upload-progress-fill" :style="{ width: settingsStore.uploadProgress + '%' }"></div>
            </div>
            <p class="upload-progress-text">Uploading… {{ settingsStore.uploadProgress }}%</p>
          </div>
          <div v-else>
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <p class="upload-title">Click or drag & drop a file here</p>
            <p class="upload-hint">Images: JPG, PNG, WebP, GIF · Videos: MP4, WebM · Max 50 MB</p>
          </div>
        </div>

        <!-- Controls -->
        <div class="bg-controls" v-if="settingsStore.background.type !== 'none'">
          <div class="control-row">
            <label>Opacity <span class="control-value">{{ Math.round((settingsStore.background.opacity || 0.15) * 100) }}%</span></label>
            <input
              type="range" min="0.05" max="0.8" step="0.05"
              :value="settingsStore.background.opacity || 0.15"
              @input="updateOpacity($event.target.value)"
              class="range-input"
            />
            <div class="range-hints"><span>Subtle</span><span>Bold</span></div>
          </div>

          <div class="control-row">
            <label>Blur <span class="control-value">{{ settingsStore.background.blur || 0 }}px</span></label>
            <input
              type="range" min="0" max="20" step="1"
              :value="settingsStore.background.blur || 0"
              @input="updateBlur($event.target.value)"
              class="range-input"
            />
            <div class="range-hints"><span>Sharp</span><span>Blurred</span></div>
          </div>

          <div class="control-row overlay-toggle">
            <label>
              <input
                type="checkbox"
                :checked="settingsStore.background.overlay !== false"
                @change="updateOverlay($event.target.checked)"
              />
              <span>Dark overlay (improves text readability)</span>
            </label>
          </div>
        </div>

        <!-- Tips -->
        <div class="settings-tips">
          <h4>💡 Tips for best results</h4>
          <ul>
            <li>Use a <strong>landscape image</strong> (1920×1080 or wider) for full coverage</li>
            <li>For videos, <strong>MP4 with H.264 encoding</strong> is most compatible across browsers</li>
            <li>Keep opacity <strong>below 30%</strong> so page content remains readable</li>
            <li>Short looping videos (<strong>5–15 seconds</strong>) work best for smooth loops</li>
            <li>Changes apply to <strong>all users immediately</strong> in real-time</li>
          </ul>
        </div>
      </div>

    </template>

    <!-- Reject modal -->
    <Transition name="modal">
      <div v-if="rejectModal.show" class="modal-overlay" @click.self="rejectModal.show = false">
        <div class="modal">
          <h3><i class="fas fa-times-circle" style="color:#dc2626"></i> Reject {{ rejectModal.type }}</h3>
          <p>Optional rejection reason (stored for audit):</p>
          <textarea v-model="rejectModal.reason" class="reject-reason" rows="3" placeholder="Reason (optional)"></textarea>
          <div class="modal-actions">
            <button class="btn-reject-confirm" @click="confirmReject"><i class="fas fa-times-circle"></i> Confirm Reject</button>
            <button class="btn-cancel-modal" @click="rejectModal.show = false">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { db } from '@/services/firebase'
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import RoleBadge from '@/components/ui/RoleBadge.vue'

const authStore    = useAuthStore()
const settingsStore = useSettingsStore()
const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const tab = ref('clubs')
const allClubs      = ref([])
const allEvents     = ref([])
const users         = ref([])
const loadingUsers     = ref(true)
const loadingAllEvents = ref(true)
const rejectModal   = ref({ show: false, item: null, type: '', reason: '' })
const toast         = ref({ show: false, message: '', type: 'success' })
const isDragging    = ref(false)

// Background controls (debounced)
let saveTimer = null
const debouncedSave = (data) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => settingsStore.saveBackground(data), 500)
}
const updateOpacity = (val) => debouncedSave({ opacity: Number(val) })
const updateBlur    = (val) => debouncedSave({ blur: Number(val) })
const updateOverlay = (val) => settingsStore.saveBackground({ overlay: val })
const removeBackground = async () => {
  await settingsStore.removeBackground()
  showToast('Background removed', 'error')
}

const handleFileSelect = (e) => processFile(e.target.files?.[0])
const handleDrop = (e) => { isDragging.value = false; processFile(e.dataTransfer.files?.[0]) }

const processFile = async (file) => {
  if (!file) return
  const MAX = 50 * 1024 * 1024
  if (file.size > MAX) { showToast('File too large (max 50 MB)', 'error'); return }
  try {
    showToast('Uploading…', 'success')
    const { url, type } = await settingsStore.uploadMedia(file)
    await settingsStore.saveBackground({ type, url, opacity: 0.15, blur: 0, overlay: true })
    showToast('Background updated! ✅ All users will see it now.', 'success')
  } catch (e) {
    showToast('Upload failed: ' + e.message, 'error')
  }
}

// ── Computed ──────────────────────────────────────────────────
const pendingClubs  = computed(() => allClubs.value.filter(c => c.status === 'pending'))
const approvedClubs = computed(() => allClubs.value.filter(c => c.status === 'approved'))
const pendingEvents = computed(() => allEvents.value.filter(e => e.status === 'pending'))

const stats = computed(() => [
  { label: 'Pending Clubs',  value: pendingClubs.value.length,  icon: 'fas fa-users',      color: '#d97706', bg: '#fffbeb', urgent: true },
  { label: 'Pending Events', value: pendingEvents.value.length, icon: 'fas fa-calendar',   color: '#7c3aed', bg: '#f5f3ff', urgent: true },
  { label: 'Total Users',    value: users.value.length,         icon: 'fas fa-user',        color: '#2563eb', bg: '#eff6ff', urgent: false },
  { label: 'Total Events',   value: allEvents.value.length,     icon: 'fas fa-star',        color: '#059669', bg: '#ecfdf5', urgent: false },
])

// ── Data fetching ─────────────────────────────────────────────
onMounted(async () => {
  settingsStore.init()
  await Promise.all([fetchClubs(), fetchEvents(), fetchUsers()])
})

const fetchClubs = async () => {
  const snap = await getDocs(collection(db, 'clubs'))
  allClubs.value = await Promise.all(snap.docs.map(async (d) => {
    const data = d.data()
    let leaderName = '—', leaderEmail = '—'
    if (data.leaderId) {
      const ls = await getDoc(doc(db, 'users', data.leaderId))
      if (ls.exists()) { leaderName = ls.data().name || ls.data().email; leaderEmail = ls.data().email || '—' }
    }
    return { id: d.id, ...data, leaderName, leaderEmail, _loading: null }
  }))
}

const fetchEvents = async () => {
  loadingAllEvents.value = true
  const snap = await getDocs(collection(db, 'events'))
  allEvents.value = await Promise.all(snap.docs.map(async (d) => {
    const data = d.data()
    let clubName = '—', creatorName = '—'
    if (data.clubId) { const cs = await getDoc(doc(db, 'clubs', data.clubId)); if (cs.exists()) clubName = cs.data().name || '—' }
    if (data.createdBy) { const us = await getDoc(doc(db, 'users', data.createdBy)); if (us.exists()) creatorName = us.data().name || us.data().email || '—' }
    return { id: d.id, ...data, clubName, creatorName, _loading: null }
  }))
  loadingAllEvents.value = false
}

const fetchUsers = async () => {
  loadingUsers.value = true
  const snap = await getDocs(collection(db, 'users'))
  users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  loadingUsers.value = false
}

// ── Actions ───────────────────────────────────────────────────
const approveClub = async (club) => {
  club._loading = 'approve'
  try {
    await updateDoc(doc(db, 'clubs', club.id), { status: 'approved', approvedAt: serverTimestamp(), approvedBy: authStore.user.uid, [`memberRoles.${club.leaderId}`]: 'club_admin' })
    club.status = 'approved'
    showToast(`Club "${club.name}" approved ✅`, 'success')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
  finally { club._loading = null }
}

const approveEvent = async (event) => {
  event._loading = 'approve'
  try {
    await updateDoc(doc(db, 'events', event.id), { status: 'approved', approvedAt: serverTimestamp(), approvedBy: authStore.user.uid })
    event.status = 'approved'
    showToast(`Event "${event.title}" approved ✅`, 'success')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
  finally { event._loading = null }
}

const rejectItem = (item, type) => { rejectModal.value = { show: true, item, type, reason: '' } }
const confirmReject = async () => {
  const { item, type, reason } = rejectModal.value
  item._loading = 'reject'
  rejectModal.value.show = false
  try {
    const col = type === 'club' ? 'clubs' : 'events'
    await updateDoc(doc(db, col, item.id), { status: 'rejected', rejectedAt: serverTimestamp(), rejectedBy: authStore.user.uid, ...(reason ? { rejectionReason: reason } : {}) })
    item.status = 'rejected'
    showToast(`${type === 'club' ? 'Club' : 'Event'} rejected`, 'error')
  } catch (e) { showToast('Error: ' + e.message, 'error') }
  finally { item._loading = null }
}

const deleteClub  = async (id) => { if (!confirm('Delete club?')) return; await deleteDoc(doc(db, 'clubs', id)); allClubs.value = allClubs.value.filter(c => c.id !== id); showToast('Club deleted', 'error') }
const deleteEvent = async (id) => { if (!confirm('Delete event?')) return; await deleteDoc(doc(db, 'events', id)); allEvents.value = allEvents.value.filter(e => e.id !== id); showToast('Event deleted', 'error') }
const changeUserRole = async (u, role) => {
  if (u.id === authStore.user?.uid) { showToast("You can't change your own role", 'error'); return }
  await updateDoc(doc(db, 'users', u.id), { role }); u.role = role; showToast(`${u.name}'s role → ${role}`, 'success')
}

// ── Helpers ───────────────────────────────────────────────────
const statusEmoji = (s) => ({ pending:'⏳', approved:'✅', rejected:'❌' }[s] || '')
const formatDate = (val) => {
  if (!val) return '—'
  const d = val.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
}
const showToast = (message, type='success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3200)
}
</script>

<style scoped>
.admin-dashboard { max-width: 1200px; margin: 0 auto; padding: 2rem; }

.access-denied { text-align: center; padding: 5rem 2rem; }
.access-denied h2 { font-size: 1.6rem; color: #1e293b; margin: 1rem 0; }
.btn-home { padding: 0.65rem 1.4rem; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; }
.page-header h1 { font-size: 1.7rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; }
.page-header p  { color: #64748b; margin: 0; font-size: 0.88rem; }
.header-right   { display: flex; align-items: center; gap: 0.6rem; }
.admin-name     { font-size: 0.88rem; font-weight: 600; color: #1e293b; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
.stat-card { display: flex; align-items: center; gap: 1rem; background: #fff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); position: relative; border: 1.5px solid transparent; transition: border-color 0.2s; }
.stat-card.urgent { border-color: #fde68a; }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.stat-num { font-size: 1.7rem; font-weight: 800; color: #1e293b; line-height: 1; }
.stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 0.1rem; }
.urgent-dot { position: absolute; top: 10px; right: 10px; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: pulse-dot 1.5s infinite; }
@keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }

.admin-tabs { display: flex; gap: 0.25rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 2rem; flex-wrap: wrap; }
.admin-tabs button { display: flex; align-items: center; gap: 0.45rem; padding: 0.7rem 1.2rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.88rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.18s; }
.admin-tabs button:hover { color: #2563eb; }
.admin-tabs button.active { color: #2563eb; border-bottom-color: #2563eb; }
.tab-badge { background: #ef4444; color: white; font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.42rem; border-radius: 10px; }

.tab-hint { color: #d97706; font-size: 0.85rem; margin-bottom: 1rem; font-weight: 500; background: #fffbeb; padding: 0.5rem 0.85rem; border-radius: 8px; display: inline-block; }

.request-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2.5rem; }
.request-card { background: #fff; border-radius: 14px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); border: 1.5px solid #fef3c7; }
.event-pending-card { border-color: #e0e7ff; }
.request-body { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
.req-avatar { width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.event-avatar { background: linear-gradient(135deg, #7c3aed, #059669); }
.req-info { flex: 1; }
.req-info h3 { margin: 0 0 0.3rem; font-size: 1.05rem; font-weight: 700; color: #1e293b; }
.req-desc { margin: 0 0 0.5rem; color: #64748b; font-size: 0.85rem; line-height: 1.5; }
.req-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.78rem; color: #94a3b8; }
.req-meta i { color: #2563eb; width: 12px; }
.event-thumb { margin-top: 0.75rem; width: 180px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; }

.request-actions { display: flex; gap: 0.75rem; }
.btn-approve { flex:1; padding:0.6rem; border-radius:8px; border:none; cursor:pointer; background:#10b981; color:white; font-weight:600; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:0.4rem; transition:background 0.18s; }
.btn-approve:hover:not(:disabled) { background:#059669; }
.btn-approve:disabled { opacity:0.6; cursor:not-allowed; }
.btn-reject { flex:1; padding:0.6rem; border-radius:8px; cursor:pointer; background:#fff; color:#dc2626; border:1.5px solid #fecaca; font-weight:600; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:0.4rem; transition:all 0.18s; }
.btn-reject:hover:not(:disabled) { background:#fef2f2; }
.btn-reject:disabled { opacity:0.6; cursor:not-allowed; }

.status-pill { padding:0.25rem 0.7rem; border-radius:20px; font-size:0.75rem; font-weight:600; }
.status-pill.pending  { background:#fffbeb; color:#d97706; }
.status-pill.approved { background:#ecfdf5; color:#059669; }
.status-pill.rejected { background:#fef2f2; color:#dc2626; }
.price-tag { padding:0.18rem 0.55rem; border-radius:12px; font-size:0.72rem; font-weight:700; }
.price-tag.free { background:#ecfdf5; color:#059669; }
.price-tag.paid { background:#fffbeb; color:#d97706; }

.section-divider { margin:2rem 0 1rem; border-top:1px solid #f1f5f9; padding-top:1.5rem; }
.section-divider h3 { font-size:1rem; font-weight:700; color:#1e293b; margin:0; display:flex; align-items:center; gap:0.5rem; }
.count-badge { background:#e2e8f0; color:#64748b; font-size:0.72rem; padding:0.18rem 0.5rem; border-radius:10px; font-weight:700; }

.admin-table { width:100%; border-collapse:collapse; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.07); }
.admin-table th { background:#f8fafc; padding:0.75rem 1rem; text-align:left; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; }
.admin-table td { padding:0.85rem 1rem; border-top:1px solid #f1f5f9; font-size:0.88rem; color:#374151; }
.admin-table tr:hover td { background:#f8fafc; }
.user-avatar-sm { width:30px; height:30px; border-radius:50%; object-fit:cover; }
.role-select { padding:0.3rem 0.6rem; border:1.5px solid #e2e8f0; border-radius:6px; font-size:0.82rem; cursor:pointer; outline:none; }
.role-select:disabled { opacity:0.45; cursor:not-allowed; }
.btn-danger-sm { background:none; border:1.5px solid #fecaca; color:#dc2626; padding:0.28rem 0.7rem; border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer; margin-right:0.4rem; transition:background 0.15s; }
.btn-danger-sm:hover { background:#fef2f2; }
.btn-sm-blue { background:none; border:1.5px solid #bfdbfe; color:#2563eb; padding:0.28rem 0.7rem; border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer; margin-right:0.4rem; transition:background 0.15s; }
.btn-sm-blue:hover { background:#eff6ff; }

/* ══ SITE SETTINGS ══ */
.settings-panel { max-width: 720px; }
.settings-title { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
.settings-title i { color: #2563eb; }
.settings-desc { color: #64748b; font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.75rem; }

.bg-preview-wrap { margin-bottom: 1.5rem; }
.bg-preview { position: relative; width: 100%; height: 200px; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0; margin-bottom: 0.75rem; background: #0f172a; }
.preview-media { width: 100%; height: 100%; object-fit: cover; }
.preview-label { position: absolute; bottom: 0.75rem; left: 0.75rem; background: rgba(0,0,0,0.6); color: white; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.65rem; border-radius: 20px; }
.btn-remove-bg { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.1rem; background: none; border: 1.5px solid #fecaca; color: #dc2626; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.btn-remove-bg:hover { background: #fef2f2; }

.upload-zone {
  border: 2.5px dashed #cbd5e1; border-radius: 14px; padding: 3rem 2rem;
  text-align: center; cursor: pointer; background: #f8fafc;
  transition: all 0.2s; margin-bottom: 1.75rem;
}
.upload-zone:hover, .upload-zone.dragging { border-color: #2563eb; background: #eff6ff; }
.upload-zone.uploading { cursor: default; }
.upload-icon { font-size: 2.5rem; color: #94a3b8; margin-bottom: 0.75rem; display: block; }
.upload-title { font-size: 1rem; font-weight: 600; color: #374151; margin: 0 0 0.4rem; }
.upload-hint  { font-size: 0.82rem; color: #94a3b8; margin: 0; }

.upload-progress-wrap { padding: 0.5rem 0; }
.upload-progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem; }
.upload-progress-fill { height: 100%; background: #2563eb; border-radius: 4px; transition: width 0.3s; }
.upload-progress-text { color: #2563eb; font-weight: 600; font-size: 0.88rem; margin: 0; }

.bg-controls { background: #f8fafc; border-radius: 12px; padding: 1.5rem; border: 1.5px solid #e2e8f0; margin-bottom: 1.75rem; }
.control-row { margin-bottom: 1.25rem; }
.control-row:last-child { margin-bottom: 0; }
.control-row label { display: flex; align-items: center; gap: 0.75rem; font-size: 0.88rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
.control-value { font-weight: 400; color: #2563eb; background: #eff6ff; padding: 0.1rem 0.5rem; border-radius: 20px; font-size: 0.8rem; }
.range-input { width: 100%; -webkit-appearance: none; height: 6px; border-radius: 3px; background: #e2e8f0; outline: none; cursor: pointer; }
.range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #2563eb; cursor: pointer; box-shadow: 0 1px 4px rgba(37,99,235,0.4); }
.range-hints { display: flex; justify-content: space-between; margin-top: 0.3rem; font-size: 0.72rem; color: #94a3b8; }
.overlay-toggle label { cursor: pointer; }
.overlay-toggle input { width: 16px; height: 16px; cursor: pointer; }

.settings-tips { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 1.25rem; }
.settings-tips h4 { font-size: 0.9rem; font-weight: 700; color: #92400e; margin: 0 0 0.75rem; }
.settings-tips ul { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
.settings-tips li { font-size: 0.83rem; color: #78350f; line-height: 1.5; }

/* Modal */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9000; display:flex; align-items:center; justify-content:center; }
.modal { background:white; border-radius:16px; padding:2rem; width:420px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
.modal h3 { margin:0 0 0.5rem; display:flex; align-items:center; gap:0.5rem; font-size:1.05rem; }
.modal p  { color:#64748b; font-size:0.88rem; margin:0 0 0.75rem; }
.reject-reason { width:100%; padding:0.65rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:0.88rem; outline:none; box-sizing:border-box; resize:vertical; }
.reject-reason:focus { border-color:#dc2626; }
.modal-actions { display:flex; gap:0.75rem; margin-top:1rem; }
.btn-reject-confirm { flex:1; padding:0.65rem; background:#dc2626; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.4rem; }
.btn-reject-confirm:hover { background:#b91c1c; }
.btn-cancel-modal { flex:1; padding:0.65rem; background:none; border:1.5px solid #e2e8f0; border-radius:8px; font-weight:600; cursor:pointer; color:#64748b; }
.btn-cancel-modal:hover { background:#f8fafc; }
.modal-enter-active,.modal-leave-active { transition:all 0.2s; }
.modal-enter-from,.modal-leave-to { opacity:0; transform:scale(0.95); }

/* Toast */
.toast { position:fixed; bottom:5rem; right:1.5rem; z-index:9999; padding:0.85rem 1.5rem; border-radius:10px; font-weight:600; font-size:0.88rem; box-shadow:0 8px 30px rgba(0,0,0,0.15); }
.toast.success { background:#10b981; color:white; }
.toast.error   { background:#dc2626; color:white; }
.toast-enter-active,.toast-leave-active { transition:all 0.22s ease; }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(8px); }

.empty-state { text-align:center; padding:3rem; }
.empty-icon  { font-size:2.5rem; margin-bottom:0.5rem; }
.empty-state p { color:#64748b; margin:0; }
.empty-inline { color:#94a3b8; font-size:0.85rem; padding:0.75rem 0; }
.loading-text { color:#94a3b8; text-align:center; padding:2rem; }

@media (max-width:768px) {
  .stats-row { grid-template-columns:1fr 1fr; }
  .admin-dashboard { padding:1rem; }
  .request-body { flex-wrap:wrap; }
}
</style>
