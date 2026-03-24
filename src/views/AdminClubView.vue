<template>
  <!-- AdminClubView.vue
       Route: /admin/clubs/:clubId  (or embed in AdminDashboard as a modal/drawer)
       Props: clubId (String) — the Firestore club document ID
  -->
  <div class="acv">

    <!-- Loading skeleton -->
    <div v-if="loading" class="acv-skeleton">
      <div class="skeleton" style="height:120px; border-radius:14px; margin-bottom:1rem;"></div>
      <div class="skeleton" style="height:280px; border-radius:14px;"></div>
    </div>

    <!-- Not found -->
    <div v-else-if="!club" class="acv-empty">
      <div style="font-size:3rem">🔍</div>
      <p>Club not found.</p>
    </div>

    <template v-else>
      <!-- ── Club hero ──────────────────────────────────────── -->
      <div class="acv-hero">
        <div class="club-av-xl">{{ club.name?.charAt(0).toUpperCase() }}</div>
        <div class="hero-info">
          <h1>{{ club.name }}</h1>
          <p>{{ club.description }}</p>
          <div class="hero-meta">
            <span><i class="fas fa-users"></i> {{ club.members?.length || 0 }} members</span>
            <span><i class="fas fa-calendar-alt"></i> {{ club.events?.length || 0 }} events</span>
            <span class="status-pill" :class="club.status">{{ club.status }}</span>
          </div>
        </div>
      </div>

      <!-- ── Stats row ──────────────────────────────────────── -->
      <div class="acv-stats">
        <div class="stat-tile" v-for="s in stats" :key="s.label">
          <div class="stat-tile-icon" :style="{ background: s.bg }">
            <i :class="s.icon" :style="{ color: s.color }"></i>
          </div>
          <div>
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- ── Tabs ───────────────────────────────────────────── -->
      <div class="acv-tabs">
        <button
          v-for="t in TABS" :key="t.key"
          :class="{ active: tab === t.key }"
          @click="tab = t.key"
        >
          <i :class="t.icon"></i> {{ t.label }}
        </button>
      </div>

      <!-- ══ EVENTS TAB ══ -->
      <div v-if="tab === 'events'">
        <div v-if="!events.length" class="acv-empty-inline">No events created by this club.</div>
        <table v-else class="acv-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Type</th>
              <th>Start</th>
              <th>Votes</th>
              <th>Registrations</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in events" :key="ev.id">
              <td><strong>{{ ev.title }}</strong></td>
              <td>
                <span class="status-pill" :class="ev.status || 'pending'">
                  {{ ev.status || 'pending' }}
                </span>
              </td>
              <td>
                <span class="type-badge" :class="ev.type">
                  {{ ev.type === 'free' ? 'Free' : (ev.price || 0) + '€' }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(ev.startDate || ev.startTime) }}</td>
              <td class="center">
                <span class="vote-chip"><i class="fas fa-thumbs-up"></i> {{ ev.vote || 0 }}</span>
              </td>
              <td class="center">
                <span class="reg-chip">
                  <i class="fas fa-ticket-alt"></i>
                  {{ regCountMap[ev.id] ?? '—' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══ MEMBERS TAB ══ -->
      <div v-if="tab === 'members'">
        <div v-if="!members.length" class="acv-empty-inline">No members found.</div>
        <div v-else class="members-grid">
          <div v-for="m in members" :key="m.uid" class="member-card">
            <img :src="m.photoURL || defaultAvatar" class="member-av" :alt="m.name" />
            <div class="member-info">
              <span class="member-name">{{ m.name || m.email || m.uid }}</span>
              <span class="member-email">{{ m.email }}</span>
            </div>
            <span class="role-chip" :class="m.clubRole">{{ m.clubRole || 'member' }}</span>
          </div>
        </div>
      </div>

      <!-- ══ ATTENDANCE TAB ══ -->
      <div v-if="tab === 'attendance'">
        <div v-if="!events.length" class="acv-empty-inline">No events to show attendance for.</div>
        <template v-else>
          <div class="event-select-row">
            <label>Select Event</label>
            <select v-model="selectedEventId" class="event-select">
              <option value="">Choose an event…</option>
              <option v-for="ev in events" :key="ev.id" :value="ev.id">{{ ev.title }}</option>
            </select>
          </div>
          <AttendanceList v-if="selectedEventId" :event-id="selectedEventId" />
          <div v-else class="acv-empty-inline">Select an event above to view its attendance.</div>
        </template>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '@/services/firebase'
import {
  doc, getDoc, collection, query, where, getDocs
} from 'firebase/firestore'
import AttendanceList from '@/components/AttendanceList.vue'

const props = defineProps({
  clubId: { type: String, required: true }
})

const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const TABS = [
  { key: 'events',     label: 'Events',     icon: 'fas fa-calendar-alt' },
  { key: 'members',    label: 'Members',    icon: 'fas fa-users' },
  { key: 'attendance', label: 'Attendance', icon: 'fas fa-clipboard-list' },
]

const tab             = ref('events')
const loading         = ref(true)
const club            = ref(null)
const events          = ref([])
const members         = ref([])
const regCountMap     = ref({})   // eventId → registration count
const selectedEventId = ref('')

// ── Stats ──────────────────────────────────────────────────────
const stats = computed(() => [
  {
    label: 'Members',
    value: club.value?.members?.length || 0,
    icon: 'fas fa-users',
    color: '#2563eb', bg: '#eff6ff'
  },
  {
    label: 'Events',
    value: events.value.length,
    icon: 'fas fa-calendar-alt',
    color: '#7c3aed', bg: '#f5f3ff'
  },
  {
    label: 'Total Votes',
    value: events.value.reduce((s, e) => s + (e.vote || 0), 0),
    icon: 'fas fa-thumbs-up',
    color: '#d97706', bg: '#fffbeb'
  },
  {
    label: 'Registrations',
    value: Object.values(regCountMap.value).reduce((s, v) => s + v, 0),
    icon: 'fas fa-ticket-alt',
    color: '#059669', bg: '#ecfdf5'
  },
])

// ── Fetch ──────────────────────────────────────────────────────
const fetchAll = async () => {
  loading.value = true
  try {
    // Club
    const cSnap = await getDoc(doc(db, 'clubs', props.clubId))
    if (!cSnap.exists()) { loading.value = false; return }
    club.value = { id: cSnap.id, ...cSnap.data() }

    // Events
    const evSnap = await getDocs(
      query(collection(db, 'events'), where('clubId', '==', props.clubId))
    )
    events.value = evSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Registrations per event
    await Promise.all(events.value.map(async (ev) => {
      const rSnap = await getDocs(
        query(collection(db, 'registrations'), where('eventsid', '==', ev.id))
      )
      regCountMap.value[ev.id] = rSnap.size
    }))

    // Members
    const memberIds = club.value.members || []
    members.value = await Promise.all(memberIds.map(async (uid) => {
      try {
        const uSnap = await getDoc(doc(db, 'users', uid))
        const u = uSnap.exists() ? uSnap.data() : {}
        return {
          uid,
          name:     u.name || u.displayName || '',
          email:    u.email || '',
          photoURL: u.photoURL || '',
          clubRole: club.value.memberRoles?.[uid] || 'member'
        }
      } catch {
        return { uid, name: uid, clubRole: 'member' }
      }
    }))
  } finally {
    loading.value = false
  }
}

const formatDate = (val) => {
  if (!val) return '—'
  const d = val.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(fetchAll)
watch(() => props.clubId, fetchAll)
</script>

<style scoped>
.acv { max-width: 1000px; }

/* Hero */
.acv-hero {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  background: white;
  border-radius: 14px;
  padding: 1.5rem;
  border: 1.5px solid #e2e8f0;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.club-av-xl {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: linear-gradient(135deg,#2563eb,#7c3aed);
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-info h1 { margin: 0 0 0.3rem; font-size: 1.2rem; font-weight: 800; color: #1e293b; }
.hero-info p  { margin: 0 0 0.65rem; font-size: 0.85rem; color: #64748b; line-height: 1.5; }
.hero-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; font-size: 0.78rem; color: #94a3b8; }
.hero-meta i { color: #2563eb; }

/* Stats */
.acv-stats {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-tile {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: white;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-tile-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.stat-num { font-size: 1.6rem; font-weight: 800; color: #1e293b; line-height: 1; }
.stat-label { font-size: 0.72rem; color: #94a3b8; margin-top: 0.1rem; }

/* Tabs */
.acv-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.acv-tabs button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.86rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}
.acv-tabs button:hover { color: #2563eb; }
.acv-tabs button.active { color: #2563eb; border-bottom-color: #2563eb; }

/* Table */
.acv-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #e2e8f0;
  font-size: 0.85rem;
}

.acv-table th {
  padding: 0.65rem 1rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.acv-table td {
  padding: 0.85rem 1rem;
  border-top: 1px solid #f1f5f9;
  color: #374151;
  vertical-align: middle;
}

.acv-table tbody tr:hover td { background: #f8fafc; }
.center { text-align: center; }
.date-cell { font-size: 0.78rem; color: #94a3b8; white-space: nowrap; }

/* Chips / badges */
.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: capitalize;
}
.status-pill.approved { background: #ecfdf5; color: #059669; }
.status-pill.pending  { background: #fffbeb; color: #d97706; }
.status-pill.rejected { background: #fef2f2; color: #dc2626; }

.type-badge {
  padding: 0.18rem 0.5rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 700;
}
.type-badge.free { background: #ecfdf5; color: #059669; }
.type-badge.paid { background: #fffbeb; color: #d97706; }

.vote-chip, .reg-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 600;
}
.vote-chip i { color: #f59e0b; }
.reg-chip  i { color: #2563eb; }

/* Members grid */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  border: 1.5px solid #e2e8f0;
  transition: box-shadow 0.18s;
}
.member-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.member-av { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

.member-info { flex: 1; min-width: 0; }
.member-name { display: block; font-size: 0.85rem; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.member-email { font-size: 0.72rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }

.role-chip {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.18rem 0.5rem;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  background: #f1f5f9;
  color: #64748b;
}
.role-chip.club_admin { background: #eff6ff; color: #2563eb; }
.role-chip.moderator  { background: #fffbeb; color: #d97706; }

/* Event select */
.event-select-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.event-select-row label { font-size: 0.85rem; font-weight: 600; color: #374151; white-space: nowrap; }
.event-select {
  padding: 0.5rem 0.85rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  cursor: pointer;
  background: white;
}

.acv-empty { text-align: center; padding: 3rem; color: #94a3b8; }
.acv-empty p { margin: 0.5rem 0 0; }

.acv-empty-inline {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-size: 0.85rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1.5px dashed #e2e8f0;
}

/* Skeleton */
.acv-skeleton { padding: 0; }
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .acv-stats { grid-template-columns: 1fr 1fr; }
  .acv-hero { flex-direction: column; }
}
</style>
