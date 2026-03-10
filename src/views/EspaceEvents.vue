<template>
  <div class="events-space">
    <h1>Events</h1>
    <div class="filters">
      <input v-model="search" placeholder="Search events..." />
      <select v-model="clubFilter">
        <option value="">All Clubs</option>
        <option v-for="club in clubs" :key="club.id" :value="club.id">{{ club.name }}</option>
      </select>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-else class="event-list">
      <div v-for="event in filteredEvents" :key="event.id" class="event-card">
        <h3>{{ event.title }}</h3>
        <p>{{ event.description }}</p>
        <p><strong>Club:</strong> {{ clubName(event.clubId) }}</p>
        <p><strong>Start:</strong> {{ formatDate(event.startTime) }}</p>
        <p><strong>Location:</strong> {{ event.location }}</p>
        <button @click="registerForEvent(event.id)" :disabled="isRegistered(event.id)">
          {{ isRegistered(event.id) ? 'Registered' : 'Register' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '@/services/firebase'
import { collection, getDocs, query, orderBy, addDoc, where } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const events = ref([])
const clubs = ref([])
const myRegistrations = ref([])
const loading = ref(true)
const search = ref('')
const clubFilter = ref('')

const fetchData = async () => {
  loading.value = true
  const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('startTime')))
  events.value = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  const clubsSnap = await getDocs(collection(db, 'clubs'))
  clubs.value = clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  // Get user's registrations
  const regSnap = await getDocs(query(collection(db, 'registrations'), where('userid', '==', authStore.user.uid)))
  myRegistrations.value = regSnap.docs.map(doc => doc.data().eventsid)
  loading.value = false
}

const clubName = (clubId) => {
  const club = clubs.value.find(c => c.id === clubId)
  return club ? club.name : 'Unknown'
}

const filteredEvents = computed(() => {
  return events.value.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.value.toLowerCase()) ||
                          event.description.toLowerCase().includes(search.value.toLowerCase())
    const matchesClub = !clubFilter.value || event.clubId === clubFilter.value
    return matchesSearch && matchesClub
  })
})

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

const isRegistered = (eventId) => myRegistrations.value.includes(eventId)

const registerForEvent = async (eventId) => {
  try {
    await addDoc(collection(db, 'registrations'), {
      userid: authStore.user.uid,
      eventsid: eventId,
      registeredAt: new Date().toISOString()
    })
    myRegistrations.value.push(eventId)
  } catch (error) {
    alert('Registration failed: ' + error.message)
  }
}

onMounted(fetchData)
</script>

<style scoped>
.events-space { padding: 2rem; }
.filters { display: flex; gap: 1rem; margin-bottom: 2rem; }
.filters input { flex: 1; padding: 0.5rem; }
.filters select { padding: 0.5rem; }
.event-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.event-card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
.event-card button { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
.event-card button:disabled { background: #6c757d; }
</style>