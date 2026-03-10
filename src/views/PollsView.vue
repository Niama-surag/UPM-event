<template>
  <div>
    <h1>Event Voting</h1>

    <div v-for="event in events" :key="event.id" class="event-card">
      <h3>{{ event.title }}</h3>
      <p>{{ event.description }}</p>
      <p>Votes: {{ event.vote }}</p>

      <VoteAction :eventId="event.id" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/services/firebase"
import VoteAction from "@/components/VoteAction.vue"

const events = ref([])

onMounted(() => {
  const eventsRef = collection(db, "Events")

  onSnapshot(eventsRef, (snapshot) => {
    events.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})
</script>