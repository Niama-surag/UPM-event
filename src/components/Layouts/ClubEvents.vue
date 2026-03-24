<template>
  <div class="club-events">
    <div class="events-header">
      <h3>Events of this Club</h3>
      <button @click="openCreateForm" class="btn-create">
        <i class="fas fa-plus"></i> Create New Event
      </button>
    </div>
    
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
        
        <!-- Type d'événement (gratuit/payant) -->
        <div class="field">
          <label>Event Type *</label>
          <select v-model="newEvent.type" required>
            <option value="free">Gratuit</option>
            <option value="paid">Payant</option>
          </select>
        </div>
        
        <!-- Prix (si payant) -->
        <div class="field" v-if="newEvent.type === 'paid'">
          <label>Prix (€) *</label>
          <input type="number" v-model="newEvent.price" min="0" step="0.01" required>
        </div>
        
        <!-- Public cible -->
        <div class="field">
          <label>Target Audience *</label>
          <select v-model="newEvent.target" required>
            <option value="all">Ouvert à tous</option>
            <option value="engineering">Spécifique: Ingénierie</option>
            <option value="business">Spécifique: Business</option>
            <option value="health">Spécifique: Santé</option>
          </select>
        </div>
        
        <!-- Image Uploader -->
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
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading events...</p>
    </div>
    <div v-else-if="events.length === 0" class="empty-events">
      <i class="fas fa-calendar-plus"></i>
      <p>No events yet for this club</p>
      <button @click="openCreateForm" class="btn-create-first">
        Create your first event
      </button>
    </div>
    <div v-else class="event-list">
      <div v-for="event in events" :key="event.id" class="event-card">
        <img 
          v-if="event.imageURL" 
          :src="event.imageURL" 
          :alt="event.title"
          class="event-image"
        >
        <div class="event-details">
          <h4>{{ event.title }}</h4>
          <p class="event-description">{{ event.description }}</p>
          <div class="event-meta">
            <span><i class="fas fa-calendar"></i> <strong>Start:</strong> {{ formatDate(event.startTime) }}</span>
            <span><i class="fas fa-calendar-check"></i> <strong>End:</strong> {{ formatDate(event.endTime) }}</span>
            <span><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> {{ event.location }}</span>
          </div>
          <div class="event-badges">
            <span :class="{'badge-free': event.type === 'free', 'badge-paid': event.type === 'paid'}">
              <i :class="event.type === 'free' ? 'fas fa-gift' : 'fas fa-euro-sign'"></i>
              {{ event.type === 'free' ? 'Gratuit' : 'Payant' }}
            </span>
            <span v-if="event.type === 'paid'" class="price-badge">
              {{ event.price }}€
            </span>
            <span class="target-badge">
              <i class="fas fa-users"></i> {{ formatTarget(event.target) }}
            </span>
          </div>
          <button @click="deleteEvent(event.id)" class="delete-btn">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore'
import ImageUploader from '@/components/ImageUploader.vue'

// Props et emits
const props = defineProps({
  clubId: { type: String, required: true },
  showForm: { type: Boolean, default: false }  // Nouvelle prop pour contrôler l'affichage du formulaire depuis l'extérieur
})

const emit = defineEmits(['close-form', 'event-created'])  // Événements à émettre

// État
const events = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const creating = ref(false)
const formSubmitted = ref(false)

// Nouvel événement
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

// Watch pour ouvrir le formulaire depuis l'extérieur
watch(() => props.showForm, (newVal) => {
  if (newVal) {
    showCreateForm.value = true
  }
})

// Ouvrir le formulaire
const openCreateForm = () => {
  showCreateForm.value = true
}

// Fermer le formulaire et émettre l'événement
const closeForm = () => {
  showCreateForm.value = false
  formSubmitted.value = false
  emit('close-form')
}

// Récupérer les événements
const fetchEvents = async () => {
  loading.value = true
  try {
    const q = query(collection(db, 'events'), where('clubId', '==', props.clubId), orderBy('startTime'))
    const snapshot = await getDocs(q)
    events.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching events:', error)
    alert('Error loading events: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Créer un événement
const createEvent = async () => {
  formSubmitted.value = true
  
  // Validation de l'image
  if (!newEvent.value.imageURL) {
    alert('Veuillez ajouter une image pour l\'événement')
    return
  }
  
  // Validation des dates
  if (new Date(newEvent.value.startTime) >= new Date(newEvent.value.endTime)) {
    alert('La date de fin doit être après la date de début')
    return
  }
  
  creating.value = true
  try {
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
      imageURL: newEvent.value.imageURL,
      createdAt: new Date(),
      vote: 0  // Initialiser les votes à 0
    }
    
    await addDoc(collection(db, 'events'), eventData)
    
    // Réinitialiser le formulaire
    resetForm()
    
    // Émettre les événements
    emit('event-created')
    emit('close-form')
    
    // Rafraîchir la liste
    await fetchEvents()
    
  } catch (error) {
    console.error('Error creating event:', error)
    alert('Error creating event: ' + error.message)
  } finally {
    creating.value = false
  }
}

// Réinitialiser le formulaire
const resetForm = () => {
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
  formSubmitted.value = false
}

// Annuler le formulaire
const cancelForm = () => {
  resetForm()
  closeForm()
}

// Supprimer un événement
const deleteEvent = async (id) => {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await deleteDoc(doc(db, 'events', id))
      await fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Error deleting event: ' + error.message)
    }
  }
}

// Formater la date
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formater le public cible
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
  margin-top: 0;
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.events-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-create:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-create-first {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.create-form {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  margin: 1rem 0 2rem;
  border: 1px solid #e2e8f0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-events {
  text-align: center;
  padding: 3rem;
  background: #f8fafc;
  border-radius: 12px;
  color: #64748b;
}

.empty-events i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  gap: 1rem;
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.event-image {
  width: 150px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.event-details {
  flex: 1;
}

.event-details h4 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  font-size: 1.1rem;
}

.event-description {
  color: #64748b;
  margin: 0 0 0.75rem;
  line-height: 1.5;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.event-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #475569;
}

.event-meta i {
  color: #2563eb;
  width: 14px;
}

.event-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.badge-free, .badge-paid, .price-badge, .target-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-free {
  background: #dcfce7;
  color: #15803d;
}

.badge-paid {
  background: #fef3c7;
  color: #b45309;
}

.price-badge {
  background: #e2e8f0;
  color: #475569;
}

.target-badge {
  background: #eff6ff;
  color: #2563eb;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #dc2626;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1e293b;
}

.field input, .field textarea, .field select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.field input:focus, .field textarea:focus, .field select:focus {
  outline: none;
  border-color: #2563eb;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.form-actions button[type="submit"] {
  background: #2563eb;
  color: white;
}

.form-actions button[type="button"] {
  background: #e2e8f0;
  color: #475569;
}

.form-actions button[type="submit"]:hover:not(:disabled) {
  background: #1d4ed8;
}

.form-actions button[type="button"]:hover {
  background: #cbd5e1;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .event-card {
    flex-direction: column;
  }
  
  .event-image {
    width: 100%;
    height: 160px;
  }
  
  .events-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .btn-create {
    justify-content: center;
  }
  
  .event-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>