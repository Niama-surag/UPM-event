<template>
  <div class="home-events">
    <div v-if="loading">Loading events...</div>
    <ul v-else>
      <li v-for="event in events" :key="event.id" class="event-item">
        <h4>{{ event.title }}</h4>
        <p>{{ event.description }}</p>
        <p><strong>Club:</strong> {{ clubName(event.clubId) }}</p>
        <p><strong>Start:</strong> {{ formatDate(event.startTime) }}</p>
        <p><strong>Location:</strong> {{ event.location }}</p>
      </li>
    </ul>
    <p v-if="!loading && events.length === 0">No upcoming events.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore' // added getDoc

const events = ref([])
const clubs = ref({})
const loading = ref(true)

const fetchEvents = async () => {
  const now = new Date()
  const q = query(collection(db, 'events'), where('startTime', '>=', now), orderBy('startTime'))
  const snapshot = await getDocs(q)
  events.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  // Get club names
  const clubIds = [...new Set(events.value.map(e => e.clubId))]
  await Promise.all(clubIds.map(async id => {
    const clubDoc = await getDoc(doc(db, 'clubs', id))
    if (clubDoc.exists()) clubs.value[id] = clubDoc.data().name
  }))
  loading.value = false
}

const clubName = (id) => clubs.value[id] || 'Unknown'

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

onMounted(fetchEvents)
</script>

<style scoped>
.event-item { border-bottom: 1px solid #eee; padding: 1rem 0; }
</style>