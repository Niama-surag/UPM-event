<template>
  <div id="app">
    <h1>🧪 TEST FIREBASE</h1>
    <p v-if="loading">Test en cours...</p>
    <p v-if="success" style="color: green;">✅ Connexion Firebase réussie !</p>
    <p v-if="error" style="color: red;">❌ Erreur : {{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'  // ← Ce chemin est correct !

const loading = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    // Essayer de lire la collection events
    const querySnapshot = await getDocs(collection(db, "events"))
    success.value = true
    console.log("✅ Firebase fonctionne ! Nombre d'événements:", querySnapshot.size)
  } catch (err) {
    error.value = err.message
    console.error("❌ Erreur Firebase:", err)
  } finally {
    loading.value = false
  }
})
</script>