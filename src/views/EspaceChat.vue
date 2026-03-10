<template>
  <div class="chat-space">
    <h1>Chat</h1>
    <div class="chat-section">
      <div class="chat-messages" ref="chatBox">
        <div v-for="msg in messages" :key="msg.id" class="message">
          <strong>{{ msg.userName }}:</strong> {{ msg.text }}
          <span class="time">{{ formatTime(msg.timestamp) }}</span>
        </div>
      </div>
      <div class="chat-input">
        <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
        <button @click="sendMessage">Send</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const messages = ref([])
const newMessage = ref('')
const chatBox = ref(null)
let unsubscribe

onMounted(() => {
  const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'))
  unsubscribe = onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    scrollToBottom()
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  await addDoc(collection(db, 'messages'), {
    userId: authStore.user.uid,
    userName: authStore.userProfile?.name || authStore.user.email,
    role: authStore.userProfile?.role || 'user',
    text: newMessage.value,
    timestamp: serverTimestamp()
  })
  newMessage.value = ''
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBox.value) {
      chatBox.value.scrollTop = chatBox.value.scrollHeight
    }
  })
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  return date.toLocaleTimeString()
}
</script>

<style scoped>
.chat-space { padding: 2rem; }
.chat-section { border: 1px solid #dee2e6; border-radius: 8px; padding: 1rem; }
.chat-messages { height: 400px; overflow-y: auto; border: 1px solid #dee2e6; padding: 1rem; margin-bottom: 1rem; }
.message { margin-bottom: 0.5rem; }
.time { font-size: 0.75rem; color: #6c757d; margin-left: 0.5rem; }
.chat-input { display: flex; gap: 0.5rem; }
.chat-input input { flex: 1; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; }
.chat-input button { padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>