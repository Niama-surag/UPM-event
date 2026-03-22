<template>
  <div class="chat-floating-container">
    <!-- Floating button -->
    <button v-if="!chatOpen" class="chat-button" @click="openChat">
      <i class="fas fa-comment"></i>
    </button>

    <!-- Chat sidebar overlay -->
    <Transition name="slide">
      <div v-if="chatOpen" class="chat-sidebar">
        <div class="chat-header">
          <h3>Chat</h3>
          <button class="close-btn" @click="closeChat"><i class="fas fa-times"></i></button>
        </div>
        <div class="chat-messages" ref="chatBox">
          <div v-for="msg in messages" :key="msg.id" class="message">
            <strong>{{ msg.userName }}:</strong> {{ msg.text }}
            <span class="time">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>
        <div class="chat-input">
          <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
          <button @click="sendMessage"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { db } from '@/services/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const chatOpen = ref(false)
const messages = ref([])
const newMessage = ref('')
const chatBox = ref(null)
let unsubscribe

const openChat = () => {
  chatOpen.value = true
  loadMessages()
}

const closeChat = () => {
  chatOpen.value = false
  if (unsubscribe) unsubscribe()
}

const loadMessages = () => {
  const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'))
  unsubscribe = onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    scrollToBottom()
  })
}

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

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.chat-floating-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
.chat-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.chat-sidebar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.message {
  margin-bottom: 10px;
}
.time {
  font-size: 0.75rem;
  color: #666;
  margin-left: 5px;
}
.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #eee;
}
.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.chat-input button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  margin-left: 5px;
  border-radius: 4px;
  cursor: pointer;
}
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}
</style>