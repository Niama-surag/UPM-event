<template>
  <div class="home">
    <h1>Événements UPM</h1>
    
    <div v-if="loading" class="loading">
      Chargement des événements...
    </div>
    
    <div v-else-if="events.length === 0" class="empty">
      <p>Aucun événement pour le moment</p>
      <router-link to="/create">Créer le premier événement</router-link>
    </div>
    
    <div v-else class="events-grid">
      <EventCard 
        v-for="event in events" 
        :key="event.id" 
        :event="event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import EventCard from '@/components/EventCard.vue'

const events = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "events"))
    events.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log("Événements chargés:", events.value)
  } catch (error) {
    console.error("Erreur:", error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}


.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 50px;
  color: #666;
  font-size: 1.2em;
}

.empty a {
  display: inline-block;
  margin-top: 20px;
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}
</style>
