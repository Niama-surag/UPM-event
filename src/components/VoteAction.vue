<template>
  <button @click="vote">Vote 👍</button>
</template>

<script setup>
import { doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/services/firebase"

const props = defineProps({
  eventId: String
})

const vote = async () => {
  const eventRef = doc(db, "Events", props.eventId)

  await updateDoc(eventRef, {
    vote: increment(1)
  })
}
</script>