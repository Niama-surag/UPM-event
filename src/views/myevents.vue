<template>
  <div class="my-events-page">
    <div class="page-header">
      <h1><i class="fas fa-calendar-alt"></i> My Events</h1>
      <p>Gérez vos événements, suivez les votes et les listes d'attente</p>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'my-events' }" @click="activeTab = 'my-events'">
        <i class="fas fa-calendar-check"></i> Mes Événements
        <span class="count">{{ myEvents.length }}</span>
      </button>
      <button :class="{ active: activeTab === 'waiting-list' }" @click="activeTab = 'waiting-list'">
        <i class="fas fa-clock"></i> Liste d'Attente
        <span class="count">{{ waitingEventsCount }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement de vos événements...</p>
    </div>

    <!-- My Events Tab -->
    <div v-else-if="activeTab === 'my-events'" class="events-container">
      <div v-if="myEvents.length === 0" class="empty-state">
        <i class="fas fa-calendar-plus"></i>
        <h3>Aucun événement créé</h3>
        <p>Vous n'avez pas encore créé d'événements pour votre club.</p>
        <router-link to="/explore?tab=clubs" class="btn-create">
          <i class="fas fa-plus"></i> Créer un Événement
        </router-link>
      </div>

      <div v-else class="events-grid">
        <div v-for="event in myEvents" :key="event.id" class="event-card">
          <!-- Image -->
          <div class="event-image-wrapper">
            <img
              :src="event.imageURL || 'https://via.placeholder.com/300x200?text=Event'"
              :alt="event.title"
              class="event-image"
            />
            <span class="event-type-badge" :class="event.type">
              {{ event.type === 'free' ? 'Gratuit' : (event.price || 0) + '€' }}
            </span>
            <span class="event-status-badge" :class="getEventStatus(event)">
              {{ getEventStatusText(event) }}
            </span>
          </div>

          <!-- Détails -->
          <div class="event-details">
            <h3>{{ event.title }}</h3>
            <p class="event-description">{{ shortDesc(event.description) }}</p>

            <div class="event-info-grid">
              <div class="info-item">
                <i class="fas fa-calendar-alt"></i>
                <span>{{ formatDate(event.startDate || event.startTime) }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ event.location || 'TBD' }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-users"></i>
                <span>{{ getRegisteredCount(event.id) }} inscrits</span>
              </div>
            </div>

            <!-- ===== STATS ADMIN SEULEMENT ===== -->
            <div v-if="isClubAdmin" class="admin-stats-row">
              <!-- Votes -->
              <div class="stat-box votes">
                <div class="stat-icon"><i class="fas fa-poll"></i></div>
                <div>
                  <div class="stat-value">{{ event.vote || 0 }}</div>
                  <div class="stat-label">Votes</div>
                </div>
                <!-- Barre de progression des votes -->
                <div class="vote-bar-mini">
                  <div
                    class="vote-bar-fill"
                    :style="{ width: votePercent(event.vote) + '%' }"
                  ></div>
                </div>
              </div>

              <!-- Inscrits -->
              <div class="stat-box registered">
                <div class="stat-icon"><i class="fas fa-ticket-alt"></i></div>
                <div>
                  <div class="stat-value">{{ getRegisteredCount(event.id) }}</div>
                  <div class="stat-label">Inscrits</div>
                </div>
              </div>

              <!-- Liste d'attente -->
              <div class="stat-box waiting">
                <div class="stat-icon"><i class="fas fa-hourglass-half"></i></div>
                <div>
                  <div class="stat-value">{{ getWaitingCount(event.id) }}</div>
                  <div class="stat-label">En attente</div>
                </div>
              </div>
            </div>

            <!-- ===== RÉSULTATS POLLS (admin club) ===== -->
            <div v-if="isClubAdmin" class="poll-results-section">
              <button
                class="btn-toggle-section"
                @click="toggleSection(event.id, 'poll')"
              >
                <i class="fas fa-chart-pie"></i>
                Résultats du vote
                <i :class="openSections[event.id + '_poll'] ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="chevron"></i>
              </button>

              <Transition name="slide">
                <div v-if="openSections[event.id + '_poll']" class="poll-details">
                  <div class="poll-total">
                    <strong>Total des votes :</strong> {{ event.vote || 0 }}
                    <span class="poll-percent">
                      ({{ votePercent(event.vote) }}% de tous les événements)
                    </span>
                  </div>
                  <div class="poll-bar-container">
                    <div class="poll-bar-track">
                      <div
                        class="poll-bar-value"
                        :style="{ width: votePercent(event.vote) + '%' }"
                      ></div>
                    </div>
                    <span class="poll-bar-label">{{ votePercent(event.vote) }}%</span>
                  </div>
                  <div class="poll-rank">
                    <i class="fas fa-trophy"></i>
                    Rang parmi les événements :
                    <strong>#{{ getEventRank(event) }}</strong>
                  </div>
                  <!-- Statut du poll -->
                  <div class="poll-status-row">
                    <span class="poll-status-badge" :class="getPollStatus(event)">
                      {{ getPollStatus(event) === 'active' ? '🟢 Vote actif' : '🔴 Vote terminé' }}
                    </span>
                    <span v-if="event.pollEnd" class="poll-end-info">
                      <i class="fas fa-clock"></i>
                      Fin : {{ formatDate(event.pollEnd) }}
                    </span>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- ===== LISTE DES PARTICIPANTS (admin club) ===== -->
            <div v-if="isClubAdmin" class="attendance-section">
              <button
                class="btn-toggle-section"
                @click="toggleAttendance(event.id)"
              >
                <i class="fas fa-clipboard-list"></i>
                Liste des participants ({{ getRegisteredCount(event.id) }})
                <i :class="openSections[event.id + '_att'] ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="chevron"></i>
              </button>

              <Transition name="slide">
                <div v-if="openSections[event.id + '_att']" class="attendance-list-wrap">
                  <div v-if="loadingAttendance[event.id]" class="loading-inline">
                    <i class="fas fa-spinner fa-spin"></i> Chargement...
                  </div>
                  <div v-else-if="!attendanceLists[event.id]?.length" class="empty-inline">
                    Aucun participant pour le moment.
                  </div>
                  <div v-else class="attendance-list">
                    <div
                      v-for="(user, index) in attendanceLists[event.id]"
                      :key="user.userId"
                      class="attendance-item"
                    >
                      <span class="att-rank">{{ index + 1 }}</span>
                      <img
                        :src="user.photoURL || defaultAvatar"
                        class="att-avatar"
                        :alt="user.userName"
                      />
                      <div class="att-info">
                        <strong>{{ user.userName }}</strong>
                        <span>{{ user.userEmail }}</span>
                      </div>
                      <span class="att-date">
                        <i class="fas fa-calendar-check"></i>
                        {{ formatDate(user.registeredAt) }}
                      </span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Actions -->
            <div class="event-actions">
              <button class="btn-view" @click="router.push('/event/' + event.id)">
                <i class="fas fa-eye"></i> Voir
              </button>
              <button
                v-if="isClubAdmin && getWaitingCount(event.id) > 0"
                class="btn-waiting"
                @click="activeTab = 'waiting-list'"
              >
                <i class="fas fa-list"></i> Attente
                <span class="badge-count">{{ getWaitingCount(event.id) }}</span>
              </button>
              <button class="btn-delete" @click="deleteEvent(event.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Waiting List Tab -->
    <div v-else-if="activeTab === 'waiting-list'" class="waiting-container">
      <div v-if="waitingEvents.length === 0" class="empty-state">
        <i class="fas fa-hourglass-empty"></i>
        <h3>Aucune liste d'attente</h3>
        <p>Vos événements n'ont pas encore de demandes en attente.</p>
      </div>
      <div v-else class="waiting-list">
        <div v-for="event in waitingEvents" :key="event.id" class="waiting-group">
          <div class="waiting-header">
            <div class="event-info-mini">
              <img
                :src="event.imageURL || 'https://via.placeholder.com/50x50'"
                class="mini-image"
              />
              <div>
                <h4>{{ event.title }}</h4>
                <p class="event-date-small">
                  {{ formatDate(event.startDate || event.startTime) }}
                </p>
              </div>
            </div>
            <span class="waiting-count-badge">
              <i class="fas fa-users"></i> {{ getWaitingCount(event.id) }} en attente
            </span>
          </div>
          <div class="waiting-users">
            <div
              v-for="user in getWaitingUsers(event.id)"
              :key="user.userId"
              class="waiting-user-row"
            >
              <img :src="user.photoURL || defaultAvatar" class="wuser-avatar" />
              <div class="wuser-info">
                <strong>{{ user.userName }}</strong>
                <span>{{ user.userEmail }}</span>
                <small>En attente depuis : {{ formatDate(user.createdAt) }}</small>
              </div>
              <div class="wuser-actions">
                <button class="btn-accept" @click="acceptUser(event.id, user)">
                  <i class="fas fa-check"></i> Accepter
                </button>
                <button class="btn-reject-sm" @click="rejectUser(event.id, user)">
                  <i class="fas fa-times"></i> Refuser
                </button>
              </div>
            </div>
          </div>
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import {
  collection, query, where, getDocs, getDoc,
  doc, deleteDoc, addDoc, orderBy
} from 'firebase/firestore'

const router    = useRouter()
const authStore = useAuthStore()
const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

// ─── State ────────────────────────────────────────────────────────────────────
const loading         = ref(true)
const activeTab       = ref('my-events')
const myEvents        = ref([])
const allEvents       = ref([])        // pour calculer les rangs / pourcentages
const registrations   = ref([])
const waitingLists    = ref([])
const usersCache      = reactive({})
const isClubAdmin     = ref(false)
const openSections    = reactive({})   // { eventId_poll: bool, eventId_att: bool }
const attendanceLists = reactive({})   // { eventId: [...users] }
const loadingAttendance = reactive({}) // { eventId: bool }
const toast = ref({ show: false, message: '', type: 'success' })

// ─── Computed ─────────────────────────────────────────────────────────────────
const totalVotesAllEvents = computed(() =>
  allEvents.value.reduce((sum, e) => sum + (e.vote || 0), 0)
)

const waitingEventsCount = computed(() => waitingEvents.value.length)

const waitingEvents = computed(() =>
  myEvents.value.filter(e => getWaitingCount(e.id) > 0)
)

// ─── Fetch ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!authStore.user) return
  await Promise.all([fetchMyEvents(), fetchAllEventsForRanking()])
})

const fetchAllEventsForRanking = async () => {
  const snap = await getDocs(collection(db, 'events'))
  allEvents.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

const fetchMyEvents = async () => {
  loading.value = true
  try {
    // Clubs dont l'utilisateur est leader
    const clubsSnap = await getDocs(
      query(collection(db, 'clubs'), where('leaderId', '==', authStore.user.uid))
    )
    const clubIds = clubsSnap.docs.map(d => d.id)
    isClubAdmin.value = clubIds.length > 0

    if (!clubIds.length) { loading.value = false; return }

    // Événements de ces clubs
    const eventsPromises = clubIds.map(clubId =>
      getDocs(query(collection(db, 'events'), where('clubId', '==', clubId)))
    )
    const evSnaps = await Promise.all(eventsPromises)
    myEvents.value = evSnaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })))

    await Promise.all([fetchRegistrations(), fetchWaitingLists()])
  } finally {
    loading.value = false
  }
}

const fetchRegistrations = async () => {
  if (!myEvents.value.length) return
  const regSnap = await getDocs(collection(db, 'registrations'))
  const eventIds = new Set(myEvents.value.map(e => e.id))
  registrations.value = regSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => eventIds.has(r.eventsid))
}

const fetchWaitingLists = async () => {
  const eventIds = myEvents.value.map(e => e.id)
  if (!eventIds.length) return
  // Firestore in() limite à 30 — on pagine si nécessaire
  const chunks = []
  for (let i = 0; i < eventIds.length; i += 10) chunks.push(eventIds.slice(i, i + 10))

  const results = []
  for (const chunk of chunks) {
    const snap = await getDocs(
      query(collection(db, 'waitingLists'), where('eventId', 'in', chunk))
    )
    results.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }
  waitingLists.value = results

  // Pre-cache user data for waiting list
  const uids = [...new Set(results.map(w => w.userId))]
  await Promise.all(uids.map(async uid => {
    if (!usersCache[uid]) {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) usersCache[uid] = snap.data()
    }
  }))
}

// Charge la liste des participants pour un événement (lazy)
const loadAttendance = async eventId => {
  loadingAttendance[eventId] = true
  try {
    const snap = await getDocs(
      query(collection(db, 'registrations'), where('eventsid', '==', eventId))
    )
    const attendees = await Promise.all(snap.docs.map(async d => {
      const data = d.data()
      const uid  = data.userid
      if (!usersCache[uid]) {
        const uSnap = await getDoc(doc(db, 'users', uid))
        if (uSnap.exists()) usersCache[uid] = uSnap.data()
      }
      const u = usersCache[uid] || {}
      return {
        userId:       uid,
        userName:     u.name || u.email || uid,
        userEmail:    u.email || '',
        photoURL:     u.photoURL || '',
        registeredAt: data.registeredAt
      }
    }))
    attendanceLists[eventId] = attendees
  } finally {
    loadingAttendance[eventId] = false
  }
}

// ─── Toggle sections ──────────────────────────────────────────────────────────
const toggleSection = (eventId, type) => {
  const key = `${eventId}_${type}`
  openSections[key] = !openSections[key]
}

const toggleAttendance = async eventId => {
  const key = `${eventId}_att`
  openSections[key] = !openSections[key]
  if (openSections[key] && !attendanceLists[eventId]) {
    await loadAttendance(eventId)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getRegisteredCount = eventId =>
  registrations.value.filter(r => r.eventsid === eventId).length

const getWaitingCount = eventId =>
  waitingLists.value.filter(w => w.eventId === eventId).length

const getWaitingUsers = eventId =>
  waitingLists.value
    .filter(w => w.eventId === eventId)
    .map(w => ({
      ...w,
      userName:  usersCache[w.userId]?.name  || 'Inconnu',
      userEmail: usersCache[w.userId]?.email || '',
      photoURL:  usersCache[w.userId]?.photoURL || ''
    }))

const votePercent = votes => {
  if (!totalVotesAllEvents.value) return 0
  return Math.round(((votes || 0) / totalVotesAllEvents.value) * 100)
}

const getEventRank = event => {
  const sorted = [...allEvents.value].sort((a, b) => (b.vote || 0) - (a.vote || 0))
  return sorted.findIndex(e => e.id === event.id) + 1
}

const getPollStatus = event => {
  if (!event.pollEnd) return 'active'
  const end = event.pollEnd?.toDate ? event.pollEnd.toDate() : new Date(event.pollEnd)
  return new Date() > end ? 'expired' : 'active'
}

const getEventStatus = event => {
  const now   = new Date()
  const start = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate || event.startTime || 0)
  const end   = event.endDate?.toDate   ? event.endDate.toDate()   : new Date(event.endDate   || event.endTime   || 0)
  if (now < start) return 'upcoming'
  if (now > end)   return 'expired'
  return 'ongoing'
}

const getEventStatusText = event => ({
  upcoming: 'À venir', ongoing: 'En cours', expired: 'Terminé'
}[getEventStatus(event)] || '')

const shortDesc = d => d ? (d.length > 100 ? d.slice(0, 100) + '…' : d) : ''

const formatDate = val => {
  if (!val) return '—'
  const d = val.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ─── Actions ──────────────────────────────────────────────────────────────────
const acceptUser = async (eventId, user) => {
  try {
    await addDoc(collection(db, 'registrations'), {
      userid: user.userId, eventsid: eventId,
      registeredAt: new Date().toISOString()
    })
    if (user.id) await deleteDoc(doc(db, 'waitingLists', user.id))
    await Promise.all([fetchRegistrations(), fetchWaitingLists()])
    // Recharger attendance si ouvert
    if (openSections[`${eventId}_att`]) await loadAttendance(eventId)
    showToast('Utilisateur accepté ✅', 'success')
  } catch (e) { showToast('Erreur : ' + e.message, 'error') }
}

const rejectUser = async (eventId, user) => {
  try {
    if (user.id) await deleteDoc(doc(db, 'waitingLists', user.id))
    await fetchWaitingLists()
    showToast('Demande refusée', 'error')
  } catch (e) { showToast('Erreur : ' + e.message, 'error') }
}

const deleteEvent = async eventId => {
  if (!confirm('Supprimer cet événement ? Cette action est irréversible.')) return
  try {
    const regs = registrations.value.filter(r => r.eventsid === eventId)
    await Promise.all([
      ...regs.map(r => deleteDoc(doc(db, 'registrations', r.id))),
      ...waitingLists.value.filter(w => w.eventId === eventId).map(w => deleteDoc(doc(db, 'waitingLists', w.id))),
      deleteDoc(doc(db, 'events', eventId))
    ])
    myEvents.value = myEvents.value.filter(e => e.id !== eventId)
    showToast('Événement supprimé', 'error')
  } catch (e) { showToast('Erreur : ' + e.message, 'error') }
}

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}
</script>

<style scoped>
.my-events-page { max-width: 1100px; margin: 0 auto; padding: 2rem; }

.page-header { margin-bottom: 2rem; }
.page-header h1 { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
.page-header h1 i { color: #2563eb; }
.page-header p { color: #64748b; margin: 0; }

.tabs { display: flex; gap: 0.25rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 2rem; }
.tabs button { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.25rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.9rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.18s; }
.tabs button.active { color: #2563eb; border-bottom-color: #2563eb; }
.count { background: #f1f5f9; color: #64748b; font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 10px; font-weight: 700; }
.tabs button.active .count { background: #eff6ff; color: #2563eb; }

.loading-state { text-align: center; padding: 4rem; }
.spinner { width: 36px; height: 36px; border: 3px solid #f1f5f9; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.9s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }

.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }

.event-card { background: white; border-radius: 16px; overflow: hidden; border: 1.5px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }

.event-image-wrapper { position: relative; height: 170px; background: #f1f5f9; }
.event-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.event-type-badge { position: absolute; top: 10px; right: 10px; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; color: white; }
.event-type-badge.free { background: #10b981; }
.event-type-badge.paid { background: #f59e0b; color: #1f2937; }
.event-status-badge { position: absolute; top: 10px; left: 10px; padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
.event-status-badge.upcoming { background: rgba(37,99,235,0.9); color: white; }
.event-status-badge.ongoing  { background: rgba(16,185,129,0.9); color: white; }
.event-status-badge.expired  { background: rgba(100,116,139,0.85); color: white; }

.event-details { padding: 1.25rem; }
.event-details h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.4rem; }
.event-description { font-size: 0.82rem; color: #64748b; margin: 0 0 0.85rem; line-height: 1.5; }

.event-info-grid { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; }
.info-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #64748b; }
.info-item i { color: #94a3b8; width: 14px; }

/* Admin stats */
.admin-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-bottom: 1rem; }
.stat-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem; border-radius: 10px; border: 1.5px solid #f1f5f9; font-size: 0.78rem; }
.stat-box.votes      { background: #fffbeb; border-color: #fde68a; }
.stat-box.registered { background: #eff6ff; border-color: #bfdbfe; }
.stat-box.waiting    { background: #fef3c7; border-color: #fcd34d; }
.stat-icon { font-size: 1.1rem; }
.stat-box.votes      .stat-icon { color: #f59e0b; }
.stat-box.registered .stat-icon { color: #2563eb; }
.stat-box.waiting    .stat-icon { color: #d97706; }
.stat-value { font-size: 1.1rem; font-weight: 800; color: #1e293b; line-height: 1; }
.stat-label { font-size: 0.65rem; color: #94a3b8; }
.vote-bar-mini { width: 100%; height: 3px; background: #e2e8f0; border-radius: 2px; overflow: hidden; margin-top: 3px; }
.vote-bar-fill { height: 100%; background: #f59e0b; border-radius: 2px; }

/* Toggle button pour sections collapsibles */
.btn-toggle-section { width: 100%; display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.82rem; font-weight: 600; color: #374151; cursor: pointer; transition: background 0.15s; margin-bottom: 0.5rem; }
.btn-toggle-section:hover { background: #f1f5f9; }
.btn-toggle-section i:first-child { color: #2563eb; }
.chevron { margin-left: auto; color: #94a3b8; font-size: 0.75rem; }

/* Poll results */
.poll-results-section { margin-bottom: 0.75rem; }
.poll-details { padding: 0.85rem; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; font-size: 0.82rem; }
.poll-total { margin-bottom: 0.5rem; color: #1e293b; }
.poll-percent { color: #d97706; font-size: 0.75rem; }
.poll-bar-container { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.poll-bar-track { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.poll-bar-value { height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); border-radius: 4px; transition: width 0.5s ease; }
.poll-bar-label { font-size: 0.78rem; font-weight: 700; color: #d97706; min-width: 35px; }
.poll-rank { color: #92400e; font-size: 0.8rem; margin-bottom: 0.5rem; }
.poll-status-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.poll-status-badge { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px; }
.poll-status-badge.active  { background: #ecfdf5; color: #059669; }
.poll-status-badge.expired { background: #fef2f2; color: #dc2626; }
.poll-end-info { font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 0.3rem; }

/* Attendance */
.attendance-section { margin-bottom: 0.75rem; }
.attendance-list-wrap { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.attendance-list { max-height: 280px; overflow-y: auto; }
.attendance-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.85rem; border-bottom: 1px solid #f1f5f9; }
.attendance-item:last-child { border-bottom: none; }
.att-rank { width: 20px; height: 20px; border-radius: 50%; background: #eff6ff; color: #2563eb; font-size: 0.68rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.att-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.att-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.att-info strong { font-size: 0.82rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.att-info span { font-size: 0.72rem; color: #94a3b8; }
.att-date { font-size: 0.7rem; color: #94a3b8; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap; flex-shrink: 0; }
.att-date i { color: #10b981; }

.loading-inline { text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.82rem; }
.empty-inline { text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.82rem; }

/* Actions */
.event-actions { display: flex; gap: 0.5rem; margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px solid #f1f5f9; }
.btn-view, .btn-waiting, .btn-delete { padding: 0.45rem 0.9rem; border-radius: 7px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; transition: all 0.15s; }
.btn-view { background: #eff6ff; color: #2563eb; }
.btn-view:hover { background: #dbeafe; }
.btn-waiting { background: #fffbeb; color: #d97706; position: relative; }
.btn-waiting:hover { background: #fef3c7; }
.badge-count { background: #ef4444; color: white; font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 10px; }
.btn-delete { background: #fef2f2; color: #dc2626; margin-left: auto; }
.btn-delete:hover { background: #fee2e2; }

/* Waiting list */
.waiting-list { display: flex; flex-direction: column; gap: 1.25rem; }
.waiting-group { background: white; border-radius: 14px; border: 1.5px solid #e2e8f0; overflow: hidden; }
.waiting-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 0.75rem; }
.event-info-mini { display: flex; align-items: center; gap: 0.75rem; }
.mini-image { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
.event-info-mini h4 { margin: 0 0 0.2rem; font-size: 0.92rem; color: #1e293b; }
.event-date-small { margin: 0; font-size: 0.75rem; color: #94a3b8; }
.waiting-count-badge { background: #fef3c7; color: #d97706; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
.waiting-users { padding: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
.waiting-user-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem; background: #f8fafc; border-radius: 8px; flex-wrap: wrap; }
.wuser-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.wuser-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; min-width: 120px; }
.wuser-info strong { font-size: 0.85rem; color: #1e293b; }
.wuser-info span { font-size: 0.75rem; color: #64748b; }
.wuser-info small { font-size: 0.7rem; color: #94a3b8; }
.wuser-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
.btn-accept, .btn-reject-sm { padding: 0.35rem 0.75rem; border-radius: 6px; border: none; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; }
.btn-accept    { background: #10b981; color: white; }
.btn-accept:hover { background: #059669; }
.btn-reject-sm { background: none; border: 1.5px solid #fecaca; color: #dc2626; }
.btn-reject-sm:hover { background: #fef2f2; }

/* Empty state */
.empty-state { text-align: center; padding: 4rem 2rem; }
.empty-state i { font-size: 3rem; color: #94a3b8; display: block; margin-bottom: 1rem; }
.empty-state h3 { color: #1e293b; margin-bottom: 0.5rem; }
.empty-state p { color: #64748b; margin-bottom: 1.5rem; }
.btn-create { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.65rem 1.4rem; background: #2563eb; color: white; text-decoration: none; border-radius: 9px; font-size: 0.9rem; font-weight: 600; }

/* Slide transition for collapsible sections */
.slide-enter-active, .slide-leave-active { transition: all 0.22s ease; overflow: hidden; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; margin-bottom: 0; }
.slide-enter-to, .slide-leave-from { opacity: 1; max-height: 400px; }

/* Toast */
.toast { position: fixed; bottom: 5rem; right: 1.5rem; z-index: 9999; padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 600; font-size: 0.88rem; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
.toast.success { background: #10b981; color: white; }
.toast.error   { background: #dc2626; color: white; }
.toast-enter-active, .toast-leave-active { transition: all 0.22s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 600px) {
  .my-events-page { padding: 1rem; }
  .events-grid { grid-template-columns: 1fr; }
  .admin-stats-row { grid-template-columns: 1fr 1fr; }
}
</style>
