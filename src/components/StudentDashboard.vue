<template>
  <div class="student-dashboard">
    <h2>Dashboard</h2>
    <div class="stats">
      <div class="stat-card">
        <h3>Upcoming Events</h3>
        <p>{{ upcomingEvents.length }}</p>
      </div>
      <div class="stat-card">
        <h3>My Clubs</h3>
        <p>{{ myClubs.length }}</p>
      </div>
    </div>
    <h3>Upcoming Events</h3>
    <ul>
      <li v-for="event in upcomingEvents" :key="event.id">{{ event.title }} - {{ formatDate(event.startTime) }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const upcomingEvents = ref([])
const myClubs = ref([])

onMounted(async () => {
  // Get user's registrations for events
  const regSnap = await getDocs(query(collection(db, 'registrations'), where('userid', '==', authStore.user.uid)))
  const eventIds = regSnap.docs.map(doc => doc.data().eventsid)
  if (eventIds.length) {
    const eventsSnap = await getDocs(query(collection(db, 'events'), where('__name__', 'in', eventIds), orderBy('startTime')))
    upcomingEvents.value = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
  // Get clubs where user is member
  const clubsSnap = await getDocs(query(collection(db, 'clubs'), where('members', 'array-contains', authStore.user.uid)))
  myClubs.value = clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
})

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style scoped>
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
.stat-card { background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center; }
</style>