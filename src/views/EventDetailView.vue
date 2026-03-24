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
          
          <p class="location" v-if="event.location">
            <span class="icon">📍</span>
            {{ event.location }}
          </p>
          
          <p class="price" :class="{ free: event.price === 0 }">
            <span class="icon">💰</span>
            {{ event.price === 0 ? 'Gratuit' : event.price + ' €' }}
          </p>
          
          <p class="target" v-if="event.target">
            <span class="icon">👥</span>
            {{ formatTarget(event.target) }}
          </p>
        </div>
        
        <div class="description">
          <h2>Description</h2>
          <p>{{ event.description }}</p>
        </div>
        
        <!-- Bouton de retour -->
        <div class="actions">
          <button @click="goBack" class="back-btn">
            ← Retour aux événements
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import BadgeStatus from '@/components/BadgeStatus.vue'

const route = useRoute()
const router = useRouter()
const event = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const docRef = doc(db, "events", route.params.id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      event.value = {
        id: docSnap.id,
        ...docSnap.data()
      }
    }
  } catch (error) {
    console.error("Erreur:", error)
  } finally {
    loading.value = false
  }
})

const formatDate = (date) => {
  if (!date) return 'Date non définie'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
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

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.event-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 70vh;
}

.loading, .not-found {
  text-align: center;
  padding: 50px;
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
  height: 500px;
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
  font-size: 2em;
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

.actions {
  margin-top: 30px;
}

.back-btn {
  padding: 12px 24px;
  background: white;
  color: #42b983;
  border: 2px solid #42b983;
  border-radius: 8px;
  font-size: 1em;
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
    font-size: 1.5em;
  }
}
</style>