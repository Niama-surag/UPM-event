<template>
  <div class="notifications">
    <h2>Notifications</h2>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="notif in notifications" :key="notif.id" class="notification-item" :class="{ unread: !notif.read }">
        <p>{{ notif.message }}</p>
        <small>{{ formatTime(notif.createdAt) }}</small>
        <button v-if="!notif.read" @click="markAsRead(notif.id)">Mark read</button>
      </div>
      <p v-if="notifications.length === 0">No notifications</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const notifications = ref([])
const loading = ref(true)

let unsubscribe

onMounted(() => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', authStore.user.uid),
    orderBy('createdAt', 'desc')
  )
  unsubscribe = onSnapshot(q, (snapshot) => {
    notifications.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const markAsRead = async (id) => {
  await updateDoc(doc(db, 'notifications', id), { read: true })
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  return date.toLocaleString()
}
</script>