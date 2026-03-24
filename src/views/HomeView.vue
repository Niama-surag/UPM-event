<template>
  <div class="home">

    <!-- ===== HERO ===== -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">🎓 UPM Campus Platform</div>
        <h1>Discover Events<br><span class="hero-accent">at your University</span></h1>
        <p>Join clubs, attend events, vote for your favorites, and stay connected with campus life.</p>
        <div class="hero-actions">
          <router-link to="/explore" class="btn-hero-primary">Explore Now <i class="fas fa-arrow-right"></i></router-link>
          <router-link v-if="!authStore.user" to="/register" class="btn-hero-secondary">Create Account</router-link>
        </div>
      </div>
      <div class="hero-visual">
        <div class="stat-float stat-1"><span class="stat-num">{{ stats.events }}</span><span class="stat-label">Events</span></div>
        <div class="stat-float stat-2"><span class="stat-num">{{ stats.clubs }}</span><span class="stat-label">Clubs</span></div>
        <div class="stat-float stat-3"><span class="stat-num">{{ stats.members }}</span><span class="stat-label">Students</span></div>
      </div>
    </section>

    <!-- ===== PERSONALIZED DASHBOARD (logged in) ===== -->
    <section v-if="authStore.user" class="dashboard-section">
      <div class="section-header">
        <h2>👋 Welcome back, {{ firstName }}!</h2>
        <span class="section-sub">Here's what's happening</span>
      </div>

      <div class="dashboard-grid">
        <div class="dash-card stat-card" v-for="card in dashCards" :key="card.label">
          <div class="dash-card-icon" :style="{ background: card.bg }">
            <i :class="card.icon" :style="{ color: card.color }"></i>
          </div>
          <div class="dash-card-info">
            <span class="dash-card-num">{{ card.value }}</span>
            <span class="dash-card-label">{{ card.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== UPCOMING EVENTS ===== -->
    <section class="events-section">
      <div class="section-header">
        <h2>📅 Upcoming Events</h2>
        <router-link to="/explore" class="see-all">See all <i class="fas fa-arrow-right"></i></router-link>
      </div>

      <div v-if="loadingEvents" class="events-grid">
        <div v-for="i in 4" :key="i" class="event-card-skeleton">
          <div class="skeleton" style="height:160px; border-radius:10px 10px 0 0;"></div>
          <div style="padding:1rem;">
            <div class="skeleton" style="height:1rem; margin-bottom:0.5rem;"></div>
            <div class="skeleton" style="height:0.8rem; width:60%;"></div>
          </div>
        </div>
      </div>

      <div v-else-if="upcomingEvents.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No upcoming events yet.</p>
        <router-link to="/create" class="btn-outline">Create first event</router-link>
      </div>

      <div v-else class="events-grid">
        <!-- UTILISATION DE TON COMPOSANT EVENTCARD -->
        <EventCard
          v-for="event in upcomingEvents"
          :key="event.id"
          :event="event"
        />
      </div>
    </section>

    <!-- ===== ACTIVE CLUBS ===== -->
    <section class="clubs-section">
      <div class="section-header">
        <h2>🏛 Active Clubs</h2>
        <router-link to="/explore?tab=clubs" class="see-all">See all <i class="fas fa-arrow-right"></i></router-link>
      </div>

      <div v-if="loadingClubs" class="clubs-row">
        <div v-for="i in 4" :key="i" class="club-chip-skeleton skeleton" style="height:60px; border-radius:12px;"></div>
      </div>

      <div v-else class="clubs-row">
        <router-link
          v-for="club in clubs"
          :key="club.id"
          to="/explore?tab=clubs"
          class="club-chip"
        >
          <div class="club-avatar">{{ club.name.charAt(0).toUpperCase() }}</div>
          <div class="club-chip-info">
            <span class="club-chip-name">{{ club.name }}</span>
            <span class="club-chip-count">{{ club.members?.length || 0 }} members</span>
          </div>
        </router-link>
      </div>
    </section>

    <!-- ===== RECENT NOTIFICATIONS (logged in) ===== -->
    <section v-if="authStore.user && recentNotifs.length > 0" class="notifs-section">
      <div class="section-header">
        <h2>🔔 Recent Notifications</h2>
        <router-link to="/notifications" class="see-all">View all <i class="fas fa-arrow-right"></i></router-link>
      </div>
      <div class="notifs-list">
        <div v-for="notif in recentNotifs" :key="notif.id" class="notif-item" :class="{ unread: !notif.read }">
          <div class="notif-dot"></div>
          <div>
            <p class="notif-msg">{{ notif.message }}</p>
            <small class="notif-time">{{ formatTime(notif.createdAt) }}</small>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import EventCard from '@/components/EventCard.vue'

const authStore = useAuthStore()

const loadingEvents = ref(true)
const loadingClubs = ref(true)
const upcomingEvents = ref([])
const clubs = ref([])
const recentNotifs = ref([])
const stats = ref({ events: 0, clubs: 0, members: 0 })

// User dashboard stats
const myEvents = ref(0)
const myClubs = ref(0)
const myVotes = ref(0)

const firstName = computed(() => {
  const name = authStore.userProfile?.name || authStore.user?.displayName || ''
  return name.split(' ')[0] || 'Student'
})

const dashCards = computed(() => [
  { label: 'My Events', value: myEvents.value, icon: 'fas fa-calendar-check', color: '#2563eb', bg: '#eff6ff' },
  { label: 'My Clubs', value: myClubs.value, icon: 'fas fa-users', color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Votes Cast', value: myVotes.value, icon: 'fas fa-poll', color: '#059669', bg: '#ecfdf5' },
  { label: 'Total Events', value: stats.value.events, icon: 'fas fa-star', color: '#d97706', bg: '#fffbeb' },
])

onMounted(async () => {
  // Fetch upcoming events (limit 8) depuis la collection "events"
  try {
    const snap = await getDocs(collection(db, 'events'))
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    upcomingEvents.value = all.slice(0, 8)
    stats.value.events = all.length
  } catch (e) { console.error(e) } finally { loadingEvents.value = false }

  // Fetch clubs
  try {
    const snap = await getDocs(collection(db, 'clubs'))
    clubs.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 8)
    stats.value.clubs = clubs.value.length
    stats.value.members = clubs.value.reduce((acc, c) => acc + (c.members?.length || 0), 0)
  } catch (e) { console.error(e) } finally { loadingClubs.value = false }

  // User-specific data
  if (authStore.user) {
    try {
      const regSnap = await getDocs(query(collection(db, 'registrations'), where('userid', '==', authStore.user.uid)))
      myEvents.value = regSnap.size

      const clubSnap = await getDocs(query(collection(db, 'clubs'), where('members', 'array-contains', authStore.user.uid)))
      myClubs.value = clubSnap.size

      const voteSnap = await getDocs(query(collection(db, 'Votes'), where('userid', '==', authStore.user.uid)))
      myVotes.value = voteSnap.size

      const notifSnap = await getDocs(query(
        collection(db, 'notifications'),
        where('userId', '==', authStore.user.uid),
        orderBy('createdAt', 'desc'),
        limit(4)
      ))
      recentNotifs.value = notifSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (e) { console.error(e) }
  }
})

const formatTime = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.home { padding-bottom: 4rem; }

/* ===== HERO AVEC IMAGE DE FOND ===== */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 3rem;
  min-height: 480px;
  padding: 4rem 2rem 3rem;
  max-width: 1280px;
  margin: 0 auto;
  /* Image de fond */
  background-image: url('https://res.cloudinary.com/delbtkoa4/image/upload/v1774353653/upm-universite-privee-de-marrakech_ujgcaw.jpg');
  background-size: cover;
  background-position: center 30%;
  background-repeat: no-repeat;
  border-radius: 24px;
  position: relative;
}


.hero::before { 
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 100%);
  border-radius: 24px;
  z-index: 1;
}

/* Contenu au-dessus de l'overlay */
.hero-content {
  position: relative;
  z-index: 2;
  color: white;
}

/* Badge adapté pour fond sombre */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
  color: white;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(255,255,255,0.3);
}

/* Titre et texte en blanc sur fond sombre */
.hero h1 {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  line-height: 1.15;
  margin: 0 0 1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.hero-accent {
  color: #ffd966;
}

.hero p {
  color: rgba(255,255,255,0.9);
  font-size: 1.1rem;
  line-height: 1.7;
  margin-bottom: 2rem;
  max-width: 480px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-hero-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.75rem;
  background: white;
  color: #2563eb;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn-hero-primary:hover {
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}

.btn-hero-secondary {
  padding: 0.8rem 1.75rem;
  border: 2px solid rgba(255,255,255,0.5);
  background: transparent;
  color: white;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-hero-secondary:hover {
  border-color: white;
  background: rgba(255,255,255,0.1);
  color: white;
}

/* Floating stat cards (garder le style existant mais sur fond sombre) */
.hero-visual {
  position: relative;
  height: 300px;
  z-index: 2;
}

.stat-float {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(4px);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  padding: 1.25rem 1.75rem;
  transition: transform 0.3s;
}

.stat-float:hover {
  transform: translateY(-4px);
}

.stat-1 { top: 20px; left: 60px; }
.stat-2 { top: 110px; right: 30px; }
.stat-3 { bottom: 30px; left: 30px; }

.stat-num {
  font-size: 2rem;
  font-weight: 800;
  color: #2563eb;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 0.2rem;
}

/* ===== SECTIONS ===== */
.dashboard-section, .events-section, .clubs-section, .notifs-section {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
}

.dashboard-section {
  background: #f8fafc;
  border-radius: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.section-sub {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-left: 0.5rem;
}

.see-all {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: gap 0.2s;
}

.see-all:hover {
  gap: 0.55rem;
}

/* Dashboard cards */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.dash-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: transform 0.2s, box-shadow 0.2s;
}

.dash-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.dash-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.dash-card-info {
  display: flex;
  flex-direction: column;
}

.dash-card-num {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.dash-card-label {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}

/* Events grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* Skeleton */
.event-card-skeleton {
  background: white;
  border-radius: 14px;
  overflow: hidden;
}

.skeleton {
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* Clubs row */
.clubs-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.club-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.18s;
  cursor: pointer;
}

.club-chip:hover {
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37,99,235,0.1);
}

.club-avatar {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.club-chip-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  display: block;
}

.club-chip-count {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Notifications */
.notifs-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.unread {
  background: #eff6ff;
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
  margin-top: 6px;
}

.notif-item.unread .notif-dot {
  background: #2563eb;
}

.notif-msg {
  margin: 0 0 0.2rem;
  font-size: 0.88rem;
  color: #1e293b;
}

.notif-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 1rem;
}

.btn-outline {
  padding: 0.6rem 1.25rem;
  border: 2px solid #2563eb;
  color: #2563eb;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.18s;
}

.btn-outline:hover {
  background: #eff6ff;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-visual {
    display: none;
  }
  .hero h1 {
    font-size: 2rem;
  }
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 2rem 1rem;
  }
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .events-section, .clubs-section, .notifs-section, .dashboard-section {
    padding: 1.5rem 1rem;
  }
}
</style>