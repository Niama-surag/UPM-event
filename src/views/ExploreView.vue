<template>
  <div class="explore">

    <!-- Header -->
    <div class="explore-header">
      <h1>Explore</h1>
      <p>Find clubs to join and events to attend</p>
    </div>

    <!-- Tab switcher -->
    <div class="explore-tabs">
      <button :class="{ active: activeTab === 'events' }" @click="setTab('events')">
        <i class="fas fa-calendar-alt"></i> Events
        <span class="tab-count">{{ events.length }}</span>
      </button>
      <button :class="{ active: activeTab === 'clubs' }" @click="setTab('clubs')">
        <i class="fas fa-users"></i> Clubs
        <span class="tab-count">{{ clubs.length }}</span>
      </button>
    </div>

    <!-- ===== EVENTS TAB ===== -->
    <div v-if="activeTab === 'events'" class="tab-content">

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrap">
          <i class="fas fa-search search-icon"></i>
          <input v-model="eventSearch" placeholder="Search events..." class="search-input" />
        </div>
        <select v-model="clubFilter" class="filter-select">
          <option value="">All Clubs</option>
          <option v-for="c in clubs" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="typeFilter" class="filter-select">
          <option value="">All Types</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loadingEvents" class="events-grid">
        <div v-for="i in 8" :key="i" class="event-skeleton">
          <div class="skeleton" style="height:160px; border-radius:10px 10px 0 0;"></div>
          <div style="padding:1rem;">
            <div class="skeleton" style="height:1rem; margin-bottom:0.5rem;"></div>
            <div class="skeleton" style="height:0.8rem; width:60%;"></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredEvents.length === 0" class="empty-state">
        <div style="font-size:3rem;">📅</div>
        <p>No events found matching your filters.</p>
        <button @click="resetEventFilters" class="btn-reset">Clear filters</button>
      </div>

      <!-- Events grid -->
      <div v-else class="events-grid">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-card"
          @click="$router.push(`/event/${event.id}`)"
        >
          <div class="event-img-wrap">
            <img
              :src="event.imageURL || 'https://via.placeholder.com/400x200?text=Event'"
              :alt="event.title"
              @error="$event.target.src='https://via.placeholder.com/400x200?text=UPM+Event'"
            />
            <span class="event-badge" :class="event.type">
              {{ event.type === 'free' ? 'Free' : event.price + '€' }}
            </span>
          </div>
          <div class="event-body">
            <div class="event-club-tag" v-if="clubName(event.clubId)">
              {{ clubName(event.clubId) }}
            </div>
            <h3>{{ event.title }}</h3>
            <p>{{ shortDesc(event.description) }}</p>
            <div class="event-footer">
              <span class="event-date"><i class="fas fa-calendar-alt"></i> {{ formatDate(event.startTime) }}</span>
              <span class="event-location"><i class="fas fa-map-marker-alt"></i> {{ event.location || 'TBD' }}</span>
            </div>
            <button
              class="register-btn"
              :class="{ registered: isRegistered(event.id) }"
              @click.stop="registerForEvent(event.id)"
              :disabled="isRegistered(event.id)"
            >
              <i :class="isRegistered(event.id) ? 'fas fa-check' : 'fas fa-ticket-alt'"></i>
              {{ isRegistered(event.id) ? 'Registered' : 'Register' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== CLUBS TAB ===== -->
    <div v-if="activeTab === 'clubs'" class="tab-content">

      <!-- Search -->
      <div class="filters-bar">
        <div class="search-wrap">
          <i class="fas fa-search search-icon"></i>
          <input v-model="clubSearch" placeholder="Search clubs..." class="search-input" />
        </div>
      </div>

      <div v-if="loadingClubs" class="clubs-grid">
        <div v-for="i in 6" :key="i" class="skeleton" style="height:180px; border-radius:14px;"></div>
      </div>

      <div v-else-if="filteredClubs.length === 0" class="empty-state">
        <div style="font-size:3rem;">🏛</div>
        <p>No clubs found.</p>
      </div>

      <div v-else class="clubs-grid">
        <div v-for="club in filteredClubs" :key="club.id" class="club-card">
          <div class="club-card-header">
            <div class="club-avatar-lg">{{ club.name.charAt(0).toUpperCase() }}</div>
            <div class="club-status" :class="club.status">{{ club.status }}</div>
          </div>
          <h3>{{ club.name }}</h3>
          <p>{{ shortDesc(club.description) }}</p>
          <div class="club-card-footer">
            <span><i class="fas fa-users"></i> {{ club.members?.length || 0 }} members</span>
            <button
              v-if="!isMember(club.id) && !hasPendingRequest(club.id) && club.status === 'approved'"
              class="join-btn"
              @click="joinClub(club.id)"
            >Join</button>
            <button v-else-if="hasPendingRequest(club.id)" class="join-btn pending" disabled>Pending...</button>
            <span v-else-if="isMember(club.id)" class="joined-badge"><i class="fas fa-check-circle"></i> Joined</span>
            <span v-else class="pending-club">Not yet approved</span>
          </div>
        </div>
      </div>

      <!-- Create club -->
      <div class="create-club-section">
        <button v-if="!showCreateClub" @click="showCreateClub = true" class="btn-create-club">
          <i class="fas fa-plus"></i> Create a Club
        </button>
        <CreateClubForm v-if="showCreateClub" @created="handleClubCreated" @cancel="showCreateClub = false" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import { collection, getDocs, query, where, addDoc, orderBy } from 'firebase/firestore'
import CreateClubForm from '@/components/Layouts/CreateClubForm.vue'

const route = useRoute()
const authStore = useAuthStore()

// Tab state — can be set via query param ?tab=clubs
const activeTab = ref(route.query.tab === 'clubs' ? 'clubs' : 'events')
const setTab = (tab) => { activeTab.value = tab }

// Events state
const events = ref([])
const loadingEvents = ref(true)
const eventSearch = ref('')
const clubFilter = ref('')
const typeFilter = ref('')
const myRegistrations = ref([])

// Clubs state
const clubs = ref([])
const loadingClubs = ref(true)
const clubSearch = ref('')
const pendingRequests = ref(new Set())
const showCreateClub = ref(false)

onMounted(async () => {
  // Fetch events
  try {
    const snap = await getDocs(query(collection(db, 'events'), orderBy('startTime')))
    events.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { console.error(e) } finally { loadingEvents.value = false }

  // Fetch clubs
  try {
    const snap = await getDocs(collection(db, 'clubs'))
    clubs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { console.error(e) } finally { loadingClubs.value = false }

  // User registrations
  if (authStore.user) {
    try {
      const regSnap = await getDocs(query(collection(db, 'registrations'), where('userid', '==', authStore.user.uid)))
      myRegistrations.value = regSnap.docs.map(d => d.data().eventsid)

      const reqSnap = await getDocs(query(
        collection(db, 'clubRequests'),
        where('userId', '==', authStore.user.uid),
        where('status', '==', 'pending')
      ))
      pendingRequests.value = new Set(reqSnap.docs.map(d => d.data().clubId))
    } catch (e) { console.error(e) }
  }
})

// Computed
const filteredEvents = computed(() => events.value.filter(e => {
  const matchSearch = e.title?.toLowerCase().includes(eventSearch.value.toLowerCase()) ||
                      e.description?.toLowerCase().includes(eventSearch.value.toLowerCase())
  const matchClub = !clubFilter.value || e.clubId === clubFilter.value
  const matchType = !typeFilter.value || e.type === typeFilter.value
  return matchSearch && matchClub && matchType
}))

const filteredClubs = computed(() => clubs.value.filter(c =>
  c.name?.toLowerCase().includes(clubSearch.value.toLowerCase()) ||
  c.description?.toLowerCase().includes(clubSearch.value.toLowerCase())
))

// Helpers
const clubName = (id) => clubs.value.find(c => c.id === id)?.name || ''
const isRegistered = (id) => myRegistrations.value.includes(id)
const isMember = (id) => clubs.value.find(c => c.id === id)?.members?.includes(authStore.user?.uid) || false
const hasPendingRequest = (id) => pendingRequests.value.has(id)

const resetEventFilters = () => { eventSearch.value = ''; clubFilter.value = ''; typeFilter.value = '' }

const registerForEvent = async (eventId) => {
  if (!authStore.user || isRegistered(eventId)) return
  try {
    await addDoc(collection(db, 'registrations'), {
      userid: authStore.user.uid,
      eventsid: eventId,
      registeredAt: new Date().toISOString()
    })
    myRegistrations.value.push(eventId)
  } catch (e) { alert('Registration failed: ' + e.message) }
}

const joinClub = async (clubId) => {
  if (!authStore.user) return
  try {
    await addDoc(collection(db, 'clubRequests'), {
      clubId,
      userId: authStore.user.uid,
      status: 'pending',
      createdAt: new Date()
    })
    pendingRequests.value.add(clubId)
  } catch (e) { alert('Failed: ' + e.message) }
}

const handleClubCreated = () => {
  showCreateClub.value = false
  loadingClubs.value = true
  getDocs(collection(db, 'clubs')).then(snap => {
    clubs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    loadingClubs.value = false
  })
}

const shortDesc = (d) => d ? (d.length > 80 ? d.slice(0, 80) + '…' : d) : ''

const formatDate = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.explore { max-width: 1280px; margin: 0 auto; padding: 2rem; }

.explore-header { margin-bottom: 1.75rem; }
.explore-header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0 0 0.35rem; }
.explore-header p { color: #64748b; margin: 0; }

/* Tabs */
.explore-tabs {
  display: flex; gap: 0.5rem; margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0; padding-bottom: 0;
}
.explore-tabs button {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px;
  font-size: 0.95rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.18s;
}
.explore-tabs button:hover { color: #2563eb; }
.explore-tabs button.active { color: #2563eb; border-bottom-color: #2563eb; }
.tab-count {
  background: #f1f5f9; color: #64748b; font-size: 0.75rem; font-weight: 600;
  padding: 0.15rem 0.5rem; border-radius: 20px;
}
.explore-tabs button.active .tab-count { background: #eff6ff; color: #2563eb; }

/* Filters */
.filters-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem; }
.search-input {
  width: 100%; padding: 0.65rem 0.9rem 0.65rem 2.3rem;
  border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.9rem;
  outline: none; transition: border-color 0.18s; box-sizing: border-box;
}
.search-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.filter-select {
  padding: 0.65rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.88rem; outline: none; cursor: pointer; background: white; color: #374151;
  transition: border-color 0.18s;
}
.filter-select:focus { border-color: #2563eb; }

/* Events grid */
.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
.event-skeleton { background: white; border-radius: 14px; overflow: hidden; }
.event-card {
  background: white; border-radius: 14px; overflow: hidden; cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07); border: 1.5px solid #f1f5f9;
  transition: transform 0.2s, box-shadow 0.2s;
}
.event-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: #e2e8f0; }
.event-img-wrap { position: relative; height: 160px; background: #f1f5f9; overflow: hidden; }
.event-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.event-card:hover .event-img-wrap img { transform: scale(1.04); }
.event-badge {
  position: absolute; top: 10px; right: 10px;
  padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; color: white;
}
.event-badge.free { background: #10b981; }
.event-badge.paid { background: #f59e0b; color: #1f2937; }
.event-body { padding: 1rem; }
.event-club-tag {
  display: inline-block; background: #eff6ff; color: #2563eb;
  font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem;
  border-radius: 20px; margin-bottom: 0.5rem;
}
.event-body h3 { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0 0 0.35rem; }
.event-body p { font-size: 0.82rem; color: #64748b; margin: 0 0 0.75rem; line-height: 1.5; }
.event-footer { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.event-date, .event-location { font-size: 0.78rem; color: #94a3b8; display: flex; align-items: center; gap: 0.35rem; }
.event-date i, .event-location i { color: #2563eb; width: 12px; }
.register-btn {
  width: 100%; padding: 0.55rem; border-radius: 8px;
  background: #2563eb; color: white; border: none; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
}
.register-btn:hover:not(:disabled) { background: #1d4ed8; }
.register-btn.registered { background: #10b981; cursor: default; }
.register-btn:disabled { opacity: 0.8; }

/* Clubs grid */
.clubs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
.club-card {
  background: white; border-radius: 14px; padding: 1.25rem;
  border: 1.5px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: transform 0.2s, box-shadow 0.2s;
}
.club-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
.club-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.club-avatar-lg {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white; font-size: 1.3rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.club-status {
  font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px;
}
.club-status.approved { background: #ecfdf5; color: #059669; }
.club-status.pending { background: #fffbeb; color: #d97706; }
.club-card h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.4rem; }
.club-card p { font-size: 0.82rem; color: #64748b; margin: 0 0 1rem; line-height: 1.5; }
.club-card-footer { display: flex; align-items: center; justify-content: space-between; }
.club-card-footer span { font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 0.35rem; }
.join-btn {
  padding: 0.4rem 1rem; background: #2563eb; color: white; border: none;
  border-radius: 7px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
}
.join-btn:hover:not(:disabled) { background: #1d4ed8; }
.join-btn.pending { background: #f59e0b; cursor: not-allowed; }
.joined-badge { color: #10b981; font-weight: 600; font-size: 0.82rem; display: flex; align-items: center; gap: 0.3rem; }
.pending-club { color: #94a3b8; font-size: 0.78rem; font-style: italic; }

/* Create club */
.create-club-section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #f1f5f9; }
.btn-create-club {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.5rem; border: 2px dashed #cbd5e1; background: transparent;
  color: #64748b; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
}
.btn-create-club:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }

/* Empty / Reset */
.empty-state { text-align: center; padding: 3rem; }
.empty-state p { color: #64748b; margin: 0.5rem 0 1rem; }
.btn-reset {
  padding: 0.5rem 1.2rem; background: none; border: 1.5px solid #e2e8f0;
  border-radius: 8px; color: #64748b; cursor: pointer; font-size: 0.88rem; transition: all 0.18s;
}
.btn-reset:hover { border-color: #2563eb; color: #2563eb; }

@media (max-width: 600px) {
  .explore { padding: 1rem; }
  .filters-bar { flex-direction: column; }
  .search-wrap { min-width: unset; }
}
</style>
