<template>
  <div class="event-detail">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement de l'événement...</p>
    </div>
    
    <div v-else-if="!event" class="not-found">
      <h2>😕 Événement non trouvé</h2>
      <p>L'événement que vous cherchez n'existe pas ou a été supprimé.</p>
      <router-link to="/" class="back-link">← Retour à l'accueil</router-link>
    </div>
    
    <div v-else class="detail-container">
      <!-- Section Image -->
      <div class="image-section">
        <img :src="event.imageURL" :alt="event.title">
        <BadgeStatus :type="event.type" />
      </div>
      
      <!-- Section Informations -->
      <div class="info-section">
        <h1>{{ event.title }}</h1>
        
        <div class="meta">
          <p class="date">
            <span class="icon">📅</span>
            {{ formatDate(event.date) }}
          </p>
          
          <p class="time" v-if="event.startTime">
            <span class="icon">⏰</span>
            {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
          </p>
          
          <p class="location" v-if="event.location">
            <span class="icon">📍</span>
            {{ event.location }}
          </p>
          
          <p class="price" :class="{ free: event.price === 0 }">
            <span class="icon">💰</span>
            {{ event.price === 0 ? 'Gratuit' : event.price + ' €' }}
          </p>
          
          <p class="target">
            <span class="icon">👥</span>
            {{ formatTarget(event.target) }}
          </p>
          
          <p class="organizer" v-if="event.clubName">
            <span class="icon">🏛️</span>
            Organisé par: {{ event.clubName }}
          </p>
        </div>
        
        <div class="description">
          <h2>Description</h2>
          <p>{{ event.description }}</p>
        </div>
        
        <!-- Section Participants -->
        <div class="participants" v-if="event.participants">
          <h2>Participants ({{ event.participants.length }}/{{ event.maxParticipants || '∞' }})</h2>
          <div class="progress-bar" v-if="event.maxParticipants">
            <div 
              class="progress" 
              :style="{ width: (event.participants.length / event.maxParticipants * 100) + '%' }"
            ></div>
          </div>
        </div>
        
        <!-- Boutons d'action -->
        <div class="actions">
          <button 
            @click="registerForEvent" 
            class="register-btn"
            :disabled="isRegistered || isEventFull"
          >
            {{ buttonText }}
          </button>
          
          <button @click="goBack" class="back-btn">
            ← Retour
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import BadgeStatus from '@/components/BadgeStatus.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const event = ref(null)
const loading = ref(true)
const registering = ref(false)

onMounted(async () => {
  await fetchEvent()
})

const fetchEvent = async () => {
  try {
    const docRef = doc(db, "events", route.params.id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      event.value = {
        id: docSnap.id,
        ...docSnap.data(),
        participants: docSnap.data().participants || []
      }
    }
  } catch (error) {
    console.error("Erreur:", error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return 'Date non définie'
  
  // Si c'est un timestamp Firestore
  if (date.toDate) {
    return date.toDate().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  // Si c'est une string
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  // Si c'est un objet Date
  if (date instanceof Date) {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  return 'Date invalide'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const formatTarget = (target) => {
  const targets = {
    all: 'Ouvert à tous',
    engineering: 'Réservé aux étudiants en Ingénierie',
    business: 'Réservé aux étudiants en Business',
    health: 'Réservé aux étudiants en Santé'
  }
  return targets[target] || target
}

const isRegistered = computed(() => {
  if (!authStore.user || !event.value?.participants) return false
  return event.value.participants.includes(authStore.user.uid)
})

const isEventFull = computed(() => {
  if (!event.value?.maxParticipants) return false
  return event.value.participants.length >= event.value.maxParticipants
})

const buttonText = computed(() => {
  if (!authStore.user) return 'Connectez-vous pour vous inscrire'
  if (registering.value) return 'Inscription...'
  if (isRegistered.value) return '✅ Déjà inscrit'
  if (isEventFull.value) return '❌ Complet'
  return "S'inscrire à l'événement"
})

const registerForEvent = async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  
  if (isRegistered.value || isEventFull.value) return
  
  registering.value = true
  try {
    const eventRef = doc(db, 'events', event.value.id)
    await updateDoc(eventRef, {
      participants: arrayUnion(authStore.user.uid)
    })
    
    // Mettre à jour l'affichage
    event.value.participants.push(authStore.user.uid)
    
  } catch (error) {
    alert("Erreur lors de l'inscription: " + error.message)
  } finally {
    registering.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.event-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .not-found {
  text-align: center;
  padding: 50px;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.detail-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.image-section {
  position: relative;
  height: 600px;
}

.image-section img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  padding: 40px;
}

.info-section h1 {
  margin: 0 0 20px 0;
  font-size: 2.5em;
  color: #333;
}

.meta {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.meta p {
  margin: 12px 0;
  font-size: 1.1em;
  color: #555;
  display: flex;
  align-items: center;
}

.icon {
  display: inline-block;
  width: 30px;
  font-size: 1.2em;
}

.price {
  font-weight: bold;
  color: #42b983;
}

.price.free {
  color: #4caf50;
}

.description {
  margin-bottom: 30px;
}

.description h2 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.5em;
}

.description p {
  line-height: 1.8;
  color: #666;
  white-space: pre-line;
  font-size: 1.1em;
}

.participants {
  margin-bottom: 30px;
}

.participants h2 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.3em;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #42b983, #4caf50);
  transition: width 0.3s;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.register-btn {
  flex: 2;
  padding: 15px 30px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.register-btn:hover:not(:disabled) {
  background: #3aa876;
}

.register-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.back-btn {
  flex: 1;
  padding: 15px 30px;
  background: white;
  color: #42b983;
  border: 2px solid #42b983;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #42b983;
  color: white;
}

.back-link {
  display: inline-block;
  margin-top: 20px;
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

@media (max-width: 768px) {
  .detail-container {
    grid-template-columns: 1fr;
  }
  
  .image-section {
    height: 300px;
  }
  
  .info-section {
    padding: 20px;
  }
  
  .info-section h1 {
    font-size: 2em;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>