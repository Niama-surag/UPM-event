<template>
  <div class="my-events">
    <h1>My Events 🎟️</h1>

    <div v-if="loading">Loading...</div>

    <div v-else>
      <div v-if="events.length === 0">
        <p>You are not registered in any event ❌</p>
      </div>

      <div class="event-list">
        <div v-for="event in events" :key="event.id" class="event-card">
          <h3>{{ event.title }}</h3>
          <p>{{ event.description }}</p>
          <p><strong>Location:</strong> {{ event.location }}</p>
          <p><strong>Start:</strong> {{ formatDate(event.startTime) }}</p>

          <button @click="cancelRegistration(event.id)">
            Cancel ❌
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "@/services/firebase"
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"
import { useAuthStore } from "@/stores/auth"

const authStore = useAuthStore()
const events = ref([])
const loading = ref(true)

const fetchMyEvents = async () => {
  loading.value = true

  
  const regSnap = await getDocs(
    query(
      collection(db, "registrations"),
      where("userId", "==", authStore.user.uid)
    )
  )

  const eventIds = regSnap.docs.map(doc => doc.data().eventId)

  
  const eventsSnap = await getDocs(collection(db, "events"))
  const allEvents = eventsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))

  events.value = allEvents.filter(event => eventIds.includes(event.id))

  loading.value = false
}

const cancelRegistration = async (eventId) => {
  const regSnap = await getDocs(
    query(
      collection(db, "registrations"),
      where("userId", "==", authStore.user.uid),
      where("eventId", "==", eventId)
    )
  )

  regSnap.forEach(async (d) => {
    await deleteDoc(doc(db, "registrations", d.id))
  })

  events.value = events.value.filter(e => e.id !== eventId)
}

const formatDate = (timestamp) => {
  if (!timestamp) return ""
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

onMounted(fetchMyEvents)
</script>

<style scoped>
.my-events {
  padding: 2rem;
}

.event-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.event-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

button {
  background: red;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>