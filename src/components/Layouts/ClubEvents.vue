<template>
  <div class="club-events">
    <h3>Events of this Club</h3>
    <button @click="showCreateForm = true">Create New Event</button>
    
    <!-- Formulaire de création -->
    <div v-if="showCreateForm" class="create-form">
      <h4>New Event</h4>
      <form @submit.prevent="createEvent">
        <div class="field">
          <label>Title *</label>
          <input v-model="newEvent.title" required />
        </div>
        
        <div class="field">
          <label>Description *</label>
          <textarea v-model="newEvent.description" required></textarea>
        </div>
        
        <div class="field">
          <label>Start Time *</label>
          <input type="datetime-local" v-model="newEvent.startTime" required />
        </div>
        
        <div class="field">
          <label>End Time *</label>
          <input type="datetime-local" v-model="newEvent.endTime" required />
        </div>
        
        <div class="field">
          <label>Location *</label>
          <input v-model="newEvent.location" required />
        </div>
        
        <!-- NOUVEAU : Type d'événement (gratuit/payant) -->
        <div class="field">
          <label>Event Type *</label>
          <select v-model="newEvent.type" required>
            <option value="free">Gratuit</option>
            <option value="paid">Payant</option>
          </select>
        </div>
        
        <!-- NOUVEAU : Prix (si payant) -->
        <div class="field" v-if="newEvent.type === 'paid'">
          <label>Prix (€) *</label>
          <input type="number" v-model="newEvent.price" min="0" step="0.01" required>
        </div>
        
        <!-- NOUVEAU : Public cible -->
        <div class="field">
          <label>Target Audience *</label>
          <select v-model="newEvent.target" required>
            <option value="all">Ouvert à tous</option>
            <option value="engineering">Spécifique: Ingénierie</option>
            <option value="business">Spécifique: Business</option>
            <option value="health">Spécifique: Santé</option>
          </select>
        </div>
        
        <!-- NOUVEAU : Image Uploader (ton composant) -->
        <div class="field">
          <label>Event Image (Affiche) *</label>
          <ImageUploader v-model="newEvent.imageURL" />
          <p v-if="formSubmitted && !newEvent.imageURL" class="error">
            L'image est obligatoire
          </p>
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="creating">
            {{ creating ? 'Creating...' : 'Create Event' }}
          </button>
          <button type="button" @click="cancelForm">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Liste des événements -->
    <div v-if="loading">Loading events...</div>
    <div v-else class="event-list">
      <div v-for="event in events" :key="event.id" class="event-card">
        <!-- NOUVEAU : Affichage de l'image -->
        <img 
          v-if="event.imageURL" 
          :src="event.imageURL" 
          :alt="event.title"
          class="event-image"
        >
        <div class="event-details">
          <h4>{{ event.title }}</h4>
          <p>{{ event.description }}</p>
          <p><strong>Start:</strong> {{ formatDate(event.startTime) }}</p>
          <p><strong>End:</strong> {{ formatDate(event.endTime) }}</p>
          <p><strong>Location:</strong> {{ event.location }}</p>
          <!-- NOUVEAU : Affichage du type et prix -->
          <p>
            <strong>Type:</strong> 
            <span :class="{'badge-free': event.type === 'free', 'badge-paid': event.type === 'paid'}">
              {{ event.type === 'free' ? 'Gratuit' : 'Payant' }}
            </span>
          </p>
          <p v-if="event.type === 'paid'"><strong>Prix:</strong> {{ event.price }}€</p>
          <p><strong>Target:</strong> {{ formatTarget(event.target) }}</p>
          <button @click="deleteEvent(event.id)" class="delete-btn">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore'
import ImageUploader from '@/components/ImageUploader.vue'

const props = defineProps({
  clubId: { type: String, required: true }
})

const events = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const creating = ref(false)
const formSubmitted = ref(false)

// NOUVEAU : Objet avec tous les champs nécessaires
const newEvent = ref({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  type: 'free',
  price: 0,
  target: 'all',
  imageURL: ''
})

const fetchEvents = async () => {
  loading.value = true
  const q = query(collection(db, 'events'), where('clubId', '==', props.clubId), orderBy('startTime'))
  const snapshot = await getDocs(q)
  events.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  loading.value = false
}

const createEvent = async () => {
  formSubmitted.value = true
  
  // Validation de l'image
  if (!newEvent.value.imageURL) {
    alert('Veuillez ajouter une image pour l\'événement')
    return
  }
  
  creating.value = true
  try {
    // Préparer les données avec tous les champs
    const eventData = {
      clubId: props.clubId,
      title: newEvent.value.title,
      description: newEvent.value.description,
      startTime: new Date(newEvent.value.startTime),
      endTime: new Date(newEvent.value.endTime),
      location: newEvent.value.location,
      type: newEvent.value.type,
      price: newEvent.value.type === 'free' ? 0 : Number(newEvent.value.price),
      target: newEvent.value.target,
      imageURL: newEvent.value.imageURL,  // URL de Cloudinary
      createdAt: new Date()
    }
    
    await addDoc(collection(db, 'events'), eventData)
    
    // Réinitialiser le formulaire
    newEvent.value = { 
      title: '', 
      description: '', 
      startTime: '', 
      endTime: '', 
      location: '',
      type: 'free',
      price: 0,
      target: 'all',
      imageURL: ''
    }
    showCreateForm.value = false
    formSubmitted.value = false
    fetchEvents()
    
  } catch (error) {
    alert('Error creating event: ' + error.message)
  } finally {
    creating.value = false
  }
}

const cancelForm = () => {
  showCreateForm.value = false
  formSubmitted.value = false
  newEvent.value = { 
    title: '', 
    description: '', 
    startTime: '', 
    endTime: '', 
    location: '',
    type: 'free',
    price: 0,
    target: 'all',
    imageURL: ''
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

const formatTarget = (target) => {
  const targets = {
    all: 'Ouvert à tous',
    engineering: 'Ingénierie',
    business: 'Business',
    health: 'Santé'
  }
  return targets[target] || target
}

onMounted(fetchEvents)
</script>

<style scoped>
.club-events {
  margin-top: 2rem;
}

.create-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.event-list {
  margin-top: 2rem;
}

.event-card {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  display: flex;
  gap: 1rem;
}

.event-image {
  width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.event-details {
  flex: 1;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.field input, .field textarea, .field select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type="button"] {
  background: #6c757d;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn {
  background: #dc3545;
  margin-top: 0.5rem;
}

.error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.badge-free {
  background: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.badge-paid {
  background: #ffc107;
  color: #212529;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>