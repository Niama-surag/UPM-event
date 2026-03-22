<template>
  <div class="home-notifications">
    <div v-if="loading">Loading notifications...</div>
    <ul v-else>
      <li v-for="notif in notifications" :key="notif.id" class="notif-item">
        <p>{{ notif.message }}</p>
        <small>{{ formatTime(notif.createdAt) }}</small>
      </li>
    </ul>
    <p v-if="!loading && notifications.length === 0">No notifications.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'

const notifications = ref([])
const loading = ref(true)

const fetchNotifications = async () => {
  const q = query(collection(db, 'notifications'), where('global', '==', true), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  notifications.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  loading.value = false
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

onMounted(fetchNotifications)
</script>

<style scoped>
.notif-item { border-bottom: 1px solid #eee; padding: 1rem 0; }
</style>