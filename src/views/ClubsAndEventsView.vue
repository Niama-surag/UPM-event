<template>
  <div class="clubs-events-page">

    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1>Clubs &amp; Events</h1>
        <p class="subtitle">Découvrez les clubs et événements de l'UPM</p>
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="tab-bar">
      <button
        :class="{ active: activeTab === 'events' }"
        @click="activeTab = 'events'"
      >
        <i class="fas fa-calendar-alt"></i>
        Events
        <span class="tab-count">{{ events.length }}</span>
      </button>
      <button
        :class="{ active: activeTab === 'clubs' }"
        @click="activeTab = 'clubs'"
      >
        <i class="fas fa-users"></i>
        Clubs
        <span class="tab-count">{{ clubs.length }}</span>
      </button>
    </div>

    <!-- ============ EVENTS TAB ============ -->
    <div v-if="activeTab === 'events'">

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input v-model="eventSearch" placeholder="Search events..." />
        </div>
        <select v-model="eventTypeFilter">
          <option value="">All types</option>
          <option value="free">Gratuit</option>
          <option value="paid">Payant</option>
        </select>
        <select v-model="clubFilter">
          <option value="">All clubs</option>
          <option v-for="club in clubs" :key="club.id" :value="club.id">
            {{ club.name }}
          </option>
        </select>
      </div>

      <!-- Loading skeletons -->
      <div v-if="loadingEvents" class="events-grid">
        <div v-for="n in 6" :key="n" class="event-skeleton">
          <div class="skeleton" style="height:160px; border-radius:8px 8px 0 0;"></div>
          <div style="padding:1rem;">
            <div class="skeleton" style="height:1rem; margin-bottom:0.5rem;"></div>
            <div class="skeleton" style="height:0.8rem; width:60%;"></div>
          </div>
        </div>
      </div>

      <!-- Events grid -->
      <div v-else-if="filteredEvents.length" class="events-grid">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-card"
          @click="goToEvent(event.id)"
        >
          <div class="card-img-wrap">
            <img
              :src="event.imageURL || 'https://via.placeholder.com/400x200?text=UPM+Event'"
              :alt="event.title"
              @error="$event.target.src = 'https://via.placeholder.com/400x200?text=UPM+Event'"
            />
            <span class="type-badge" :class="event.type">
              {{ event.type === 'free' ? 'Gratuit' : 'Payant' }}
            </span>
          </div>
          <div class="card-body">
            <h3>{{ event.title }}</h3>
            <p class="card-desc">{{ truncate(event.description, 80) }}</p>
            <div class="card-meta">
              <span><i class="fas fa-calendar"></i> {{ formatDate(event.startTime) }}</span>
              <span><i class="fas fa-map-marker-alt"></i> {{ event.location || 'TBD' }}</span>
            </div>
            <div class="card-footer">
              <span class="club-tag">{{ clubName(event.clubId) }}</span>
              <span class="price-tag" :class="{ free: !event.price || event.price === 0 }">
                {{ !event.price || event.price === 0 ? 'Free' : event.price + '€' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <h3>No events found</h3>
        <p>Try adjusting your filters</p>
      </div>
    </div>

    <!-- ============ CLUBS TAB ============ -->
    <div v-if="activeTab === 'clubs'">

      <!-- Search -->
      <div class="filter-bar">
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input v-model="clubSearch" placeholder="Search clubs..." />
        </div>
        <select v-model="clubStatusFilter">
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loadingClubs" class="clubs-grid">
        <div v-for="n in 4" :key="n" class="club-skeleton">
          <div class="skeleton" style="height:80px; border-radius:8px; margin-bottom:1rem;"></div>
          <div class="skeleton" style="height:1rem; margin-bottom:0.5rem;"></div>
          <div class="skeleton" style="height:0.8rem; width:50%;"></div>
        </div>
      </div>

      <!-- Clubs grid -->
      <div v-else-if="filteredClubs.length" class="clubs-grid">
        <div
          v-for="club in filteredClubs"
          :key="club.id"
          class="club-card"
        >
          <div class="club-header">
            <div class="club-logo">
              <img
                v-if="club.logo"
                :src="club.logo"
                :alt="club.name"
                @error="$event.target.style.display='none'"
              />
              <span v-else class="club-initials">{{ club.name.slice(0,2).toUpperCase() }}</span>
            </div>
            <div>
              <h3>{{ club.name }}</h3>
              <span class="status-badge" :class="club.status">{{ club.status }}</span>
            </div>
          </div>
          <p class="club-desc">{{ truncate(club.description, 100) }}</p>
          <div class="club-stats">
            <span><i class="fas fa-users"></i> {{ club.members?.length || 0 }} members</span>
          </div>
          <div class="club-actions">
            <button
              v-if="!isMember(club.id) && !hasPendingRequest(club.id) && club.status === 'approved'"
              class="btn-join"
              @click="joinClub(club.id)"
            >
              <i class="fas fa-plus"></i> Join
            </button>
            <button v-else-if="hasPendingRequest(club.id)" disabled class="btn-pending">
              <i class="fas fa-clock"></i> Pending
            </button>
            <span v-else-if="isMember(club.id)" class="joined-label">
              <i class="fas fa-check-circle"></i> Joined
            </span>
            <router-link v-if="isMember(club.id)" to="/etudiant" class="btn-manage">
              Manage →
            </router-link>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-users-slash"></i>
        <h3>No clubs found</h3>
        <p>Be the first to create one!</p>
      </div>

      <!-- Create club button -->
      <div style="margin-top:2rem; text-align:center;" v-if="!userClub">
        <button class="btn-create-club" @click="showCreateClub = true">
          <i class="fas fa-plus-circle"></i> Create a Club
        </button>
      </div>
      <CreateClubForm
        v-if="showCreateClub"
        @created="handleClubCreated"
        @cancel="showCreateClub = false"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import {
  collection, getDocs, query, where, addDoc, orderBy
} from 'firebase/firestore'
import CreateClubForm from '@/components/Layouts/CreateClubForm.vue'

const router = useRouter()
const authStore = useAuthStore()

// Tab state
const activeTab = ref('events')

// Data
const events = ref([])
const clubs = ref([])
const userClub = ref(null)
const pendingRequests = ref(new Set())
const myRegistrations = ref([])

// Loading
const loadingEvents = ref(true)
const loadingClubs = ref(true)

// Filters
const eventSearch = ref('')
const eventTypeFilter = ref('')
const clubFilter = ref('')
const clubSearch = ref('')
const clubStatusFilter = ref('')
const showCreateClub = ref(false)

// ===== DATA FETCHING =====
const fetchEvents = async () => {
  loadingEvents.value = true
  try {
    const snap = await getDocs(query(collection(db, 'events'), orderBy('startTime')))
    events.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { console.error(e) }
  finally { loadingEvents.value = false }
}

const fetchClubs = async () => {
  loadingClubs.value = true
  try {
    const snap = await getDocs(collection(db, 'clubs'))
    clubs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // User's club
    const userClubSnap = await getDocs(
      query(collection(db, 'clubs'), where('members', 'array-contains', authStore.user.uid))
    )
    userClub.value = userClubSnap.empty ? null : { id: userClubSnap.docs[0].id, ...userClubSnap.docs[0].data() }

    // Pending requests
    const reqSnap = await getDocs(
      query(collection(db, 'clubRequests'),
        where('userId', '==', authStore.user.uid),
        where('status', '==', 'pending'))
    )
    pendingRequests.value = new Set(reqSnap.docs.map(d => d.data().clubId))

    // Registrations
    const regSnap = await getDocs(
      query(collection(db, 'registrations'), where('userid', '==', authStore.user.uid))
    )
    myRegistrations.value = regSnap.docs.map(d => d.data().eventsid)
  } catch (e) { console.error(e) }
  finally { loadingClubs.value = false }
}

onMounted(() => {
  fetchEvents()
  fetchClubs()
})

// ===== COMPUTED FILTERS =====
const filteredEvents = computed(() => {
  return events.value.filter(e => {
    const matchSearch = !eventSearch.value ||
      e.title?.toLowerCase().includes(eventSearch.value.toLowerCase()) ||
      e.description?.toLowerCase().includes(eventSearch.value.toLowerCase())
    const matchType = !eventTypeFilter.value || e.type === eventTypeFilter.value
    const matchClub = !clubFilter.value || e.clubId === clubFilter.value
    return matchSearch && matchType && matchClub
  })
})

const filteredClubs = computed(() => {
  return clubs.value.filter(c => {
    const matchSearch = !clubSearch.value ||
      c.name?.toLowerCase().includes(clubSearch.value.toLowerCase())
    const matchStatus = !clubStatusFilter.value || c.status === clubStatusFilter.value
    return matchSearch && matchStatus
  })
})

// ===== HELPERS =====
const clubName = (clubId) => clubs.value.find(c => c.id === clubId)?.name || ''
const isMember = (clubId) => clubs.value.find(c => c.id === clubId)?.members?.includes(authStore.user.uid) || false
const hasPendingRequest = (clubId) => pendingRequests.value.has(clubId)

const truncate = (str, len) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const goToEvent = (id) => router.push(`/event/${id}`)

const joinClub = async (clubId) => {
  await addDoc(collection(db, 'clubRequests'), {
    clubId,
    userId: authStore.user.uid,
    status: 'pending',
    createdAt: new Date()
  })
  pendingRequests.value.add(clubId)
}

const handleClubCreated = () => {
  showCreateClub.value = false
  fetchClubs()
}
</script>

<style scoped>
.clubs-events-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Page header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.3rem;
}
.subtitle { color: #64748b; margin: 0; }

/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: #f1f5f9;
  padding: 0.3rem;
  border-radius: 12px;
  width: fit-content;
}
.tab-bar button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 9px;
  background: none;
  color: #64748b;
  font-weight: 500;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-bar button:hover { color: #2563eb; }
.tab-bar button.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.tab-count {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
}
.tab-bar button.active .tab-count {
  background: #dbeafe;
  color: #2563eb;
}

/* Filter bar */
.filter-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.search-wrap {
  flex: 1;
  min-width: 200px;
  position: relative;
  display: flex;
  align-items: center;
}
.search-wrap i {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
  font-size: 0.9rem;
}
.search-wrap input {
  width: 100%;
  padding: 0.6rem 0.85rem 0.6rem 2.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  transition: border-color 0.2s;
}
.search-wrap input:focus { border-color: #2563eb; }
.filter-bar select {
  padding: 0.6rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  outline: none;
  color: #374151;
}

/* Events grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* Event card */
.event-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.card-img-wrap {
  position: relative;
  height: 170px;
  overflow: hidden;
  background: #f1f5f9;
}
.card-img-wrap img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.event-card:hover .card-img-wrap img { transform: scale(1.04); }
.type-badge {
  position: absolute;
  top: 0.6rem; right: 0.6rem;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.type-badge.free { background: #dcfce7; color: #15803d; }
.type-badge.paid { background: #fef3c7; color: #b45309; }

.card-body { padding: 1rem; }
.card-body h3 { margin: 0 0 0.4rem; font-size: 1rem; font-weight: 600; color: #1e293b; }
.card-desc { color: #64748b; font-size: 0.85rem; line-height: 1.5; margin: 0 0 0.75rem; }
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}
.card-meta span {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
}
.card-meta i { color: #94a3b8; width: 12px; }
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.6rem;
  border-top: 1px solid #f1f5f9;
}
.club-tag {
  font-size: 0.75rem;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-weight: 500;
}
.price-tag { font-size: 0.85rem; font-weight: 600; color: #2563eb; }
.price-tag.free { color: #16a34a; }

/* Clubs grid */
.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* Club card */
.club-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  transition: box-shadow 0.2s;
}
.club-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.club-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}
.club-logo {
  width: 52px; height: 52px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.club-logo img { width: 100%; height: 100%; object-fit: cover; }
.club-initials { color: white; font-weight: 700; font-size: 1.1rem; }
.club-header h3 { margin: 0 0 0.3rem; font-size: 1rem; color: #1e293b; }
.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.status-badge.approved { background: #dcfce7; color: #15803d; }
.status-badge.pending { background: #fef3c7; color: #b45309; }
.club-desc { font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 0.75rem; }
.club-stats { font-size: 0.8rem; color: #94a3b8; margin-bottom: 1rem; display: flex; gap: 1rem; }
.club-stats i { margin-right: 0.3rem; }
.club-actions { display: flex; gap: 0.5rem; align-items: center; }
.btn-join {
  padding: 0.45rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.btn-join:hover { background: #1d4ed8; }
.btn-pending {
  padding: 0.45rem 1rem;
  background: #f1f5f9;
  color: #94a3b8;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: not-allowed;
}
.joined-label {
  color: #16a34a;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.btn-manage {
  padding: 0.45rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.85rem;
  color: #374151;
  transition: all 0.2s;
}
.btn-manage:hover { border-color: #2563eb; color: #2563eb; }

/* Create club */
.btn-create-club {
  padding: 0.75rem 2rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-create-club:hover { background: #1d4ed8; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}
.empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
.empty-state h3 { color: #475569; margin-bottom: 0.5rem; }
.empty-state p { font-size: 0.9rem; }

/* Skeletons */
.event-skeleton {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.club-skeleton {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
}

@media (max-width: 640px) {
  .events-grid, .clubs-grid { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; }
  .tab-bar { width: 100%; }
  .tab-bar button { flex: 1; justify-content: center; }
}
</style>
