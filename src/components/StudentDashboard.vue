<template>
  <div class="student-dashboard">

    <!-- Bienvenue -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h2>Bonjour, {{ firstName }} 👋</h2>
        <p>Voici un aperçu de votre activité sur la plateforme</p>
      </div>
      <div class="welcome-date">
        {{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
      </div>
    </div>

    <!-- Stats rapides -->
    <div class="quick-stats">
      <div class="stat-tile" v-for="s in quickStats" :key="s.label">
        <div class="tile-icon" :style="{ background: s.bg }">
          <i :class="s.icon" :style="{ color: s.color }"></i>
        </div>
        <div class="tile-info">
          <span class="tile-num">{{ s.value }}</span>
          <span class="tile-label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- Grille principale -->
    <div class="dash-grid">

      <!-- ═══ Mes Clubs ═══ -->
      <div class="dash-card">
        <div class="card-header">
          <h3><i class="fas fa-users"></i> Mes Clubs</h3>
          <router-link to="/explore?tab=clubs" class="card-link">
            Voir tout <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>

        <div v-if="loadingClubs" class="skeleton-list">
          <div v-for="i in 3" :key="i" class="skeleton-item"></div>
        </div>

        <div v-else-if="myClubs.length === 0" class="card-empty">
          <i class="fas fa-users-slash"></i>
          <p>Vous n'avez rejoint aucun club.</p>
          <router-link to="/explore?tab=clubs" class="btn-explore">Explorer les clubs</router-link>
        </div>

        <div v-else class="clubs-list">
          <div v-for="club in myClubs" :key="club.id" class="club-row">
            <div class="club-av">{{ club.name?.charAt(0).toUpperCase() }}</div>
            <div class="club-row-info">
              <span class="club-row-name">{{ club.name }}</span>
              <span class="club-row-members">
                <i class="fas fa-users"></i> {{ club.members?.length || 0 }} membres
              </span>
            </div>
            <span class="role-chip" :class="getClubRole(club)">
              {{ getRoleLabel(club) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ Mes Événements ═══ -->
      <div class="dash-card">
        <div class="card-header">
          <h3><i class="fas fa-calendar-check"></i> Mes Événements</h3>
          <router-link to="/my-events" class="card-link">
            Voir tout <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>

        <div v-if="loadingEvents" class="skeleton-list">
          <div v-for="i in 3" :key="i" class="skeleton-item"></div>
        </div>

        <div v-else-if="registeredEvents.length === 0" class="card-empty">
          <i class="fas fa-calendar-times"></i>
          <p>Aucun événement inscrit.</p>
          <router-link to="/explore" class="btn-explore">Explorer les événements</router-link>
        </div>

        <div v-else class="events-list">
          <div
            v-for="event in registeredEvents.slice(0, 5)"
            :key="event.id"
            class="event-row"
            :class="{ 'is-expired': getEventStatus(event) === 'expired' }"
            @click="router.push('/event/' + event.id)"
          >
            <div class="event-row-img">
              <img
                :src="event.imageURL || 'https://via.placeholder.com/50x50?text=E'"
                :alt="event.title"
              />
            </div>
            <div class="event-row-info">
              <span class="event-row-title">{{ event.title }}</span>
              <span class="event-row-date">
                <i class="fas fa-calendar-alt"></i>
                {{ formatDate(event.startDate || event.startTime) }}
              </span>
            </div>
            <span class="event-status-dot" :class="getEventStatus(event)"></span>
          </div>
        </div>
      </div>

      <!-- ═══ Notifications récentes ═══ -->
      <div class="dash-card">
        <div class="card-header">
          <h3><i class="fas fa-bell"></i> Notifications récentes</h3>
          <router-link to="/notifications" class="card-link">
            Voir tout <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>

        <div v-if="loadingNotifs" class="skeleton-list">
          <div v-for="i in 3" :key="i" class="skeleton-item"></div>
        </div>

        <div v-else-if="recentNotifs.length === 0" class="card-empty">
          <i class="fas fa-bell-slash"></i>
          <p>Aucune notification.</p>
        </div>

        <div v-else class="notifs-list">
          <div
            v-for="notif in recentNotifs"
            :key="notif.id"
            class="notif-row"
            :class="{ unread: !notif.read }"
          >
            <div class="notif-dot"></div>
            <div class="notif-text">
              <p>{{ notif.message }}</p>
              <small>{{ formatDate(notif.createdAt) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Votes récents ═══ -->
      <div class="dash-card">
        <div class="card-header">
          <h3><i class="fas fa-poll"></i> Mes Votes</h3>
          <router-link to="/polls" class="card-link">
            Voter <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>

        <div v-if="loadingVotes" class="skeleton-list">
          <div v-for="i in 2" :key="i" class="skeleton-item"></div>
        </div>

        <div v-else-if="myVotedEvents.length === 0" class="card-empty">
          <i class="fas fa-vote-yea"></i>
          <p>Vous n'avez pas encore voté.</p>
          <router-link to="/polls" class="btn-explore">Voir les polls</router-link>
        </div>

        <div v-else class="votes-list">
          <div v-for="event in myVotedEvents.slice(0, 4)" :key="event.id" class="vote-row">
            <i class="fas fa-thumbs-up vote-icon"></i>
            <span class="vote-title">{{ event.title || 'Événement inconnu' }}</span>
            <span class="vote-count">
              <i class="fas fa-chart-bar"></i> {{ event.vote || 0 }} votes
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import {
  collection, query, where, getDocs, getDoc,
  doc, orderBy, limit
} from 'firebase/firestore'

const router    = useRouter()
const authStore = useAuthStore()

// ─── State ────────────────────────────────────────────────────────────────────
const myClubs         = ref([])
const registeredEvents = ref([])
const recentNotifs    = ref([])
const myVotedEvents   = ref([])

const loadingClubs  = ref(true)
const loadingEvents = ref(true)
const loadingNotifs = ref(true)
const loadingVotes  = ref(true)

// ─── Computed ─────────────────────────────────────────────────────────────────
const firstName = computed(() => {
  const name = authStore.userProfile?.name || authStore.user?.displayName || ''
  return name.split(' ')[0] || 'Étudiant'
})

const quickStats = computed(() => [
  {
    label: 'Clubs rejoints',
    value: myClubs.value.length,
    icon: 'fas fa-users',
    color: '#2563eb', bg: '#eff6ff'
  },
  {
    label: 'Événements inscrits',
    value: registeredEvents.value.length,
    icon: 'fas fa-calendar-check',
    color: '#7c3aed', bg: '#f5f3ff'
  },
  {
    label: 'Votes effectués',
    value: myVotedEvents.value.length,
    icon: 'fas fa-poll',
    color: '#059669', bg: '#ecfdf5'
  },
  {
    label: 'Notifications',
    value: recentNotifs.value.filter(n => !n.read).length,
    icon: 'fas fa-bell',
    color: '#d97706', bg: '#fffbeb'
  }
])

// ─── Fetch ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!authStore.user) return
  const uid = authStore.user.uid
  await Promise.all([
    fetchMyClubs(uid),
    fetchRegisteredEvents(uid),
    fetchRecentNotifs(uid),
    fetchMyVotes(uid)
  ])
})

const fetchMyClubs = async uid => {
  try {
    const snap = await getDocs(
      query(collection(db, 'clubs'), where('members', 'array-contains', uid))
    )
    myClubs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loadingClubs.value = false
  }
}

const fetchRegisteredEvents = async uid => {
  try {
    const regSnap = await getDocs(
      query(collection(db, 'registrations'), where('userid', '==', uid))
    )
    const eventIds = regSnap.docs.map(d => d.data().eventsid)
    if (!eventIds.length) { loadingEvents.value = false; return }

    // Récupérer les détails des événements (par lots de 10)
    const events = []
    for (let i = 0; i < eventIds.length; i += 10) {
      const chunk = eventIds.slice(i, i + 10)
      await Promise.all(chunk.map(async id => {
        const snap = await getDoc(doc(db, 'events', id))
        if (snap.exists()) events.push({ id: snap.id, ...snap.data() })
      }))
    }
    // Trier par date de début (plus récent d'abord)
    registeredEvents.value = events.sort((a, b) => {
      const da = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || a.startTime || 0)
      const db_ = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || b.startTime || 0)
      return db_ - da
    })
  } finally {
    loadingEvents.value = false
  }
}

const fetchRecentNotifs = async uid => {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'notifications'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
    )
    recentNotifs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    // orderBy peut échouer si index absent — fallback sans tri
    try {
      const snap = await getDocs(
        query(collection(db, 'notifications'), where('userId', '==', uid), limit(5))
      )
      recentNotifs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {}
  } finally {
    loadingNotifs.value = false
  }
}

const fetchMyVotes = async uid => {
  try {
    const voteSnap = await getDocs(
      query(collection(db, 'Votes'), where('userid', '==', uid))
    )
    const eventIds = voteSnap.docs.map(d => d.data().eventsid)
    if (!eventIds.length) { loadingVotes.value = false; return }

    const events = []
    for (let i = 0; i < eventIds.length; i += 10) {
      const chunk = eventIds.slice(i, i + 10)
      await Promise.all(chunk.map(async id => {
        const snap = await getDoc(doc(db, 'events', id))
        if (snap.exists()) events.push({ id: snap.id, ...snap.data() })
      }))
    }
    myVotedEvents.value = events
  } finally {
    loadingVotes.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getClubRole = club => {
  const uid = authStore.user?.uid
  if (!uid || !club) return 'member'
  return club.memberRoles?.[uid] || 'member'
}

const getRoleLabel = club => {
  const role = getClubRole(club)
  return { club_admin: 'Admin', moderator: 'Modérateur', member: 'Membre' }[role] || 'Membre'
}

const getEventStatus = event => {
  const now   = new Date()
  const start = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate || event.startTime || 0)
  const end   = event.endDate?.toDate   ? event.endDate.toDate()   : new Date(event.endDate   || event.endTime   || 0)
  if (now < start) return 'upcoming'
  if (now > end)   return 'expired'
  return 'ongoing'
}

const formatDate = val => {
  if (!val) return '—'
  const d = val.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.student-dashboard { max-width: 1100px; }

/* Welcome banner */
.welcome-banner { display: flex; align-items: flex-start; justify-content: space-between; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 1.75rem; }
.welcome-text h2 { margin: 0 0 0.25rem; font-size: 1.4rem; font-weight: 700; }
.welcome-text p  { margin: 0; opacity: 0.85; font-size: 0.88rem; }
.welcome-date { font-size: 0.82rem; opacity: 0.7; text-align: right; white-space: nowrap; }

/* Quick stats */
.quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.75rem; }
.stat-tile { display: flex; align-items: center; gap: 0.85rem; background: white; border-radius: 12px; padding: 1.1rem 1.25rem; border: 1.5px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.tile-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; flex-shrink: 0; }
.tile-num { font-size: 1.6rem; font-weight: 800; color: #1e293b; display: block; line-height: 1; }
.tile-label { font-size: 0.72rem; color: #94a3b8; display: block; margin-top: 0.15rem; }

/* Dash grid */
.dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.dash-card { background: white; border-radius: 14px; border: 1.5px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.07); overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
.card-header h3 { font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 0.4rem; }
.card-header h3 i { color: #2563eb; }
.card-link { font-size: 0.78rem; color: #2563eb; text-decoration: none; display: flex; align-items: center; gap: 0.3rem; font-weight: 500; }
.card-link:hover { text-decoration: underline; }

/* Skeleton */
.skeleton-list { padding: 0.75rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
.skeleton-item { height: 44px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Empty */
.card-empty { text-align: center; padding: 2rem 1.5rem; }
.card-empty i { font-size: 2rem; color: #94a3b8; display: block; margin-bottom: 0.5rem; }
.card-empty p { color: #64748b; font-size: 0.85rem; margin: 0 0 0.75rem; }
.btn-explore { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.42rem 0.9rem; background: #eff6ff; color: #2563eb; text-decoration: none; border-radius: 7px; font-size: 0.8rem; font-weight: 600; }

/* Clubs list */
.clubs-list { padding: 0.6rem; display: flex; flex-direction: column; gap: 0.35rem; }
.club-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 8px; transition: background 0.15s; }
.club-row:hover { background: #f8fafc; }
.club-av { width: 34px; height: 34px; border-radius: 8px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.club-row-info { flex: 1; display: flex; flex-direction: column; }
.club-row-name { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
.club-row-members { font-size: 0.72rem; color: #94a3b8; display: flex; align-items: center; gap: 0.3rem; }
.role-chip { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.5rem; border-radius: 10px; flex-shrink: 0; }
.role-chip.club_admin { background: #eff6ff; color: #2563eb; }
.role-chip.moderator  { background: #fffbeb; color: #d97706; }
.role-chip.member     { background: #f1f5f9; color: #64748b; }

/* Events list */
.events-list { padding: 0.6rem; display: flex; flex-direction: column; gap: 0.35rem; }
.event-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.event-row:hover { background: #f8fafc; }
.event-row.is-expired { opacity: 0.5; }
.event-row-img { width: 36px; height: 36px; border-radius: 7px; overflow: hidden; flex-shrink: 0; background: #f1f5f9; }
.event-row-img img { width: 100%; height: 100%; object-fit: cover; }
.event-row-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.event-row-title { font-size: 0.85rem; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.event-row-date { font-size: 0.72rem; color: #94a3b8; display: flex; align-items: center; gap: 0.3rem; }
.event-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.event-status-dot.upcoming { background: #2563eb; }
.event-status-dot.ongoing  { background: #10b981; }
.event-status-dot.expired  { background: #94a3b8; }

/* Notifs */
.notifs-list { padding: 0; display: flex; flex-direction: column; }
.notif-row { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 1.25rem; border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
.notif-row:last-child { border-bottom: none; }
.notif-row:hover { background: #f8fafc; }
.notif-row.unread { background: #eff6ff; }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; flex-shrink: 0; margin-top: 5px; }
.notif-row.unread .notif-dot { background: #2563eb; }
.notif-text p { margin: 0 0 0.15rem; font-size: 0.82rem; color: #1e293b; line-height: 1.4; }
.notif-text small { font-size: 0.7rem; color: #94a3b8; }

/* Votes */
.votes-list { padding: 0.6rem; display: flex; flex-direction: column; gap: 0.35rem; }
.vote-row { display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 0.75rem; border-radius: 8px; background: #fffbeb; border: 1.5px solid #fef3c7; }
.vote-icon { color: #f59e0b; font-size: 0.9rem; flex-shrink: 0; }
.vote-title { flex: 1; font-size: 0.82rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vote-count { font-size: 0.75rem; color: #d97706; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap; flex-shrink: 0; font-weight: 600; }

@media (max-width: 768px) {
  .quick-stats { grid-template-columns: 1fr 1fr; }
  .dash-grid { grid-template-columns: 1fr; }
  .welcome-banner { flex-direction: column; gap: 0.5rem; }
  .welcome-date { text-align: left; }
}
</style>
