<template>
  <div class="attendance-list">
    <div class="al-header">
      <div>
        <h3><i class="fas fa-users"></i> Attendance</h3>
        <span class="al-count">{{ registrations.length }} registered</span>
      </div>
      <button class="btn-export" @click="exportCSV" :disabled="!registrations.length">
        <i class="fas fa-download"></i> Export CSV
      </button>
    </div>

    <div v-if="loading" class="al-loading">
      <div v-for="i in 4" :key="i" class="skeleton" style="height:52px; border-radius:8px; margin-bottom:0.5rem;"></div>
    </div>

    <div v-else-if="!registrations.length" class="al-empty">
      <i class="fas fa-user-slash"></i>
      <p>No registrations yet.</p>
    </div>

    <div v-else>
      <!-- Search -->
      <div class="al-search">
        <i class="fas fa-search"></i>
        <input v-model="search" placeholder="Search by name or email…" />
      </div>

      <table class="al-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Avatar</th>
            <th>Name</th>
            <th>Email</th>
            <th>Registered At</th>
            <th>Price Paid</th>
            <th>Coupon</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(reg, i) in filtered" :key="reg.id">
            <td class="row-num">{{ i + 1 }}</td>
            <td>
              <img
                :src="reg.photoURL || defaultAvatar"
                class="user-av"
                :alt="reg.name"
              />
            </td>
            <td class="name-cell">{{ reg.name || '—' }}</td>
            <td class="email-cell">{{ reg.email || '—' }}</td>
            <td class="date-cell">{{ formatDate(reg.registeredAt) }}</td>
            <td>
              <span class="price-tag" :class="{ free: !reg.pricePaid || reg.pricePaid === 0 }">
                {{ !reg.pricePaid || reg.pricePaid === 0 ? 'Free' : reg.pricePaid + '€' }}
              </span>
            </td>
            <td>
              <span v-if="reg.couponUsed" class="coupon-tag">{{ reg.couponUsed }}</span>
              <span v-else class="no-coupon">—</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="al-footer">
        Showing {{ filtered.length }} of {{ registrations.length }} registrations
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'

const props = defineProps({
  eventId: { type: String, required: true }
})

const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const registrations = ref([])
const loading       = ref(true)
const search        = ref('')

const filtered = computed(() => {
  const s = search.value.toLowerCase()
  if (!s) return registrations.value
  return registrations.value.filter(r =>
    r.name?.toLowerCase().includes(s) ||
    r.email?.toLowerCase().includes(s)
  )
})

const fetchRegistrations = async () => {
  loading.value = true
  try {
    // Support both field name conventions used across the codebase
    const snap = await getDocs(
      query(collection(db, 'registrations'), where('eventsid', '==', props.eventId))
    )
    const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Enrich with user profiles
    registrations.value = await Promise.all(raw.map(async (reg) => {
      const uid = reg.userid || reg.userId
      if (!uid) return reg
      try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          const u = userDoc.data()
          return { ...reg, name: u.name || u.displayName || '', email: u.email || '', photoURL: u.photoURL || '' }
        }
      } catch {}
      return reg
    }))
  } catch (e) {
    console.error('AttendanceList error:', e)
  } finally {
    loading.value = false
  }
}

const formatDate = (val) => {
  if (!val) return '—'
  const d = val.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── CSV export ────────────────────────────────────────────────
const exportCSV = () => {
  const headers = ['#', 'Name', 'Email', 'Registered At', 'Price Paid', 'Coupon']
  const rows = registrations.value.map((r, i) => [
    i + 1,
    r.name || '',
    r.email || '',
    formatDate(r.registeredAt),
    r.pricePaid ?? 0,
    r.couponUsed || ''
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `attendance-${props.eventId}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

watch(() => props.eventId, fetchRegistrations, { immediate: false })
onMounted(fetchRegistrations)
</script>

<style scoped>
.attendance-list {
  background: var(--bg-surface, #fff);
  border-radius: 14px;
  border: 1.5px solid var(--border, #e2e8f0);
  overflow: hidden;
}

.al-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border, #e2e8f0);
}

.al-header h3 {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-base, #1e293b);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.al-header h3 i { color: #2563eb; }
.al-count { font-size: 0.8rem; color: var(--text-muted, #64748b); }

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: none;
  color: var(--text-muted, #475569);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-export:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
.btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

.al-search {
  position: relative;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}
.al-search i {
  position: absolute;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.8rem;
}
.al-search input {
  width: 100%;
  padding: 0.5rem 0.8rem 0.5rem 2.1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.18s;
}
.al-search input:focus { border-color: #2563eb; }

.al-loading, .al-empty { padding: 1.5rem; }
.al-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted, #94a3b8);
}
.al-empty i { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
.al-empty p { margin: 0; font-size: 0.85rem; }

.al-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.al-table th {
  padding: 0.65rem 1rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-subtle, #f8fafc);
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.al-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-light, #f1f5f9);
  color: var(--text-base, #374151);
  vertical-align: middle;
}

.al-table tbody tr:hover td { background: var(--bg-hover, #f8fafc); }
.al-table tbody tr:last-child td { border-bottom: none; }

.row-num { color: var(--text-faint, #94a3b8); font-size: 0.78rem; width: 32px; }

.user-av {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.name-cell { font-weight: 600; color: var(--text-base, #1e293b); }
.email-cell { color: var(--text-muted, #64748b); font-size: 0.82rem; }
.date-cell { color: var(--text-muted, #64748b); font-size: 0.78rem; white-space: nowrap; }

.price-tag {
  padding: 0.18rem 0.55rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #fffbeb;
  color: #d97706;
}
.price-tag.free { background: #ecfdf5; color: #059669; }

.coupon-tag {
  background: #eff6ff;
  color: #2563eb;
  padding: 0.18rem 0.55rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: monospace;
}
.no-coupon { color: #cbd5e1; font-size: 0.8rem; }

.al-footer {
  padding: 0.75rem 1.25rem;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  border-top: 1px solid #f1f5f9;
  background: var(--bg-subtle, #f8fafc);
}

/* Skeleton */
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
