<script setup>
import { ref, onMounted } from "vue"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../services/firebase"

const events = ref([])

async function loadEvents() {
  const querySnapshot = await getDocs(collection(db, "events"))
  events.value = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

onMounted(loadEvents)
</script>

<template>
  <div>
    <h1>Events Voting</h1>
    <div v-for="event in events" :key="event.id">
      <h3>{{ event.title }}</h3>
      <p>{{ event.description }}</p>
    </div>

  </div>
</template>