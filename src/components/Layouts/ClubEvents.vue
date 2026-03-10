<template>
  <div class="club-events">
    <h3>Events of this Club</h3>
    <button @click="showCreateForm = true">Create New Event</button>
    <div v-if="showCreateForm">
      <h4>New Event</h4>
      <form @submit.prevent="createEvent">
        <div class="field">
          <label>Title</label>
          <input v-model="newEvent.title" required />
        </div>
        <div class="field">
          <label>Description</label>
          <textarea v-model="newEvent.description" required></textarea>
        </div>
        <div class="field">
          <label>Start Time</label>
          <input type="datetime-local" v-model="newEvent.startTime" required />
        </div>
        <div class="field">
          <label>End Time</label>
          <input type="datetime-local" v-model="newEvent.endTime" required />
        </div>
        <div class="field">
          <label>Location</label>
          <input v-model="newEvent.location" required />
        </div>
        <button type="submit" :disabled="creating">{{ creating ? 'Creating...' : 'Create' }}</button>
        <button type="button" @click="showCreateForm = false">Cancel</button>
      </form>
    </div>

    <div v-if="loading">Loading events...</div>
    <div v-else class="event-list">
      <div v-for="event in events" :key="event.id" class="event-card">
        <h4>{{ event.title }}</h4>
        <p>{{ event.description }}</p>
        <p><strong>Start:</strong> {{ formatDate(event.startTime) }}</p>
        <p><strong>End:</strong> {{ formatDate(event.endTime) }}</p>
        <p><strong>Location:</strong> {{ event.location }}</p>
        <button @click="deleteEvent(event.id)">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore'

const props = defineProps({
  clubId: { type: String, required: true }
})

const events = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const creating = ref(false)
const newEvent = ref({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: ''
})

const fetchEvents = async () => {
  loading.value = true
  const q = query(collection(db, 'events'), where('clubId', '==', props.clubId), orderBy('startTime'))
  const snapshot = await getDocs(q)
  events.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  loading.value = false
}

const createEvent = async () => {
  creating.value = true
  try {
    await addDoc(collection(db, 'events'), {
      clubId: props.clubId,
      title: newEvent.value.title,
      description: newEvent.value.description,
      startTime: new Date(newEvent.value.startTime),
      endTime: new Date(newEvent.value.endTime),
      location: newEvent.value.location,
      createdAt: new Date()
    })
    newEvent.value = { title: '', description: '', startTime: '', endTime: '', location: '' }
    showCreateForm.value = false
    fetchEvents()
  } catch (error) {
    alert('Error creating event: ' + error.message)
  } finally {
    creating.value = false
  }
}

const deleteEvent = async (id) => {
  if (confirm('Are you sure?')) {
    await deleteDoc(doc(db, 'events', id))
    fetchEvents()
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

onMounted(fetchEvents)
</script>

<style scoped>
.club-events { margin-top: 2rem; }
.event-list { margin-top: 2rem; }
.event-card { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
.field { margin-bottom: 1rem; }
.field label { display: block; margin-bottom: 0.25rem; }
.field input, .field textarea { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
button { margin-right: 0.5rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
button[type="button"] { background: #6c757d; }
</style>