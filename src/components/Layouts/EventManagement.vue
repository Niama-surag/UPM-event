<template>
  <div class="event-management">
    <h2>Manage Events</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Club</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Location</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in events" :key="event.id">
          <td>{{ event.title }}</td>
          <td>{{ clubName(event.clubId) }}</td>
          <td>{{ formatDate(event.startTime) }}</td>
          <td>{{ formatDate(event.endTime) }}</td>
          <td>{{ event.location }}</td>
          <td>
            <button @click="deleteEvent(event.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore'

const events = ref([])
const clubs = ref({}) // clubId -> name
const error = ref('')

const fetchEvents = async () => {
  try {
    const eventsSnap = await getDocs(collection(db, 'events'))
    events.value = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const clubIds = [...new Set(events.value.map(e => e.clubId))]
    await Promise.all(clubIds.map(async id => {
      const clubDoc = await getDoc(doc(db, 'clubs', id))
      if (clubDoc.exists()) {
        clubs.value[id] = clubDoc.data().name
      }
    }))
  } catch (err) {
    console.error('Error fetching events:', err)
    error.value = 'Could not load events.'
  }
}

const clubName = (clubId) => clubs.value[clubId] || 'Unknown'

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

const deleteEvent = async (id) => {
  if (confirm('Are you sure?')) {
    try {
      await deleteDoc(doc(db, 'events', id))
      events.value = events.value.filter(e => e.id !== id)
    } catch (err) {
      error.value = err.message
    }
  }
}

onMounted(fetchEvents)
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }
th { background: #f8f9fa; }
button { background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; }
.error { color: #d32f2f; }
</style>