<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Users</h3>
        <p>{{ totalUsers }}</p>
      </div>
      <div class="stat-card">
        <h3>Total Events</h3>
        <p>{{ totalEvents }}</p>
      </div>
      <div class="stat-card">
        <h3>Active Registrations</h3>
        <p>{{ totalRegistrations }}</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <div class="chart-container">
        <h3>Users Over Time</h3>
        <Line :data="usersChartData" :options="chartOptions" />
      </div>
      <div class="chart-container">
        <h3>Events Per Month</h3>
        <Bar :data="eventsChartData" :options="chartOptions" />
      </div>
    </div>

    <!-- User Details Table -->
    <div class="user-table">
      <h3>User Statistics</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Hours Spent</th>
            <th>Events Joined</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usersList" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.hoursSpent || 0 }}</td>
            <td>{{ user.eventsJoined || 0 }}</td>
            <td>{{ user.role }}</td>
            <td>
              <button @click="viewUser(user.id)">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Real-time Chat -->
    <div class="chat-section">
      <h3>Real-time Chat with Users</h3>
      <div class="chat-messages" ref="chatBox">
        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role === 'admin' ? 'admin' : 'user']">
          <strong>{{ msg.userName }} ({{ msg.role }}):</strong> {{ msg.text }}
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
import { ref, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore'
import { Line, Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const authStore = useAuthStore()

// Stats
const totalUsers = ref(0)
const totalEvents = ref(0)
const totalRegistrations = ref(0)
const usersList = ref([])

// Charts data
const usersChartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{ label: 'Users', data: [65, 59, 80, 81, 56, 55], backgroundColor: '#42b983' }]
})
const eventsChartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{ label: 'Events', data: [12, 19, 3, 5, 2, 3], backgroundColor: '#ff6384' }]
})
const chartOptions = { responsive: true, maintainAspectRatio: false }

// Chat
const messages = ref([])
const newMessage = ref('')
const chatBox = ref(null)

// Fetch real data from Firestore
const fetchStats = async () => {
  const usersSnap = await getDocs(collection(db, 'users'))
  totalUsers.value = usersSnap.size
  usersList.value = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  const eventsSnap = await getDocs(collection(db, 'events'))
  totalEvents.value = eventsSnap.size

  const regSnap = await getDocs(collection(db, 'registrations'))
  totalRegistrations.value = regSnap.size
}

// Real-time chat
const loadMessages = () => {
  const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'))
  onSnapshot(q, (snapshot) => {
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

const viewUser = (userId) => {
  console.log('View user', userId)
}

onMounted(() => {
  fetchStats()
  loadMessages()
})

watch(messages, () => scrollToBottom(), { deep: true })
</script>

<style scoped>
.admin-dashboard { padding: 2rem; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
.stat-card { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; text-align: center; }
.stat-card h3 { margin: 0 0 0.5rem; font-size: 1rem; color: #6c757d; }
.stat-card p { margin: 0; font-size: 2rem; font-weight: bold; color: #007bff; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
.chart-container { height: 300px; }
.user-table { margin-bottom: 2rem; overflow-x: auto; }
.user-table table { width: 100%; border-collapse: collapse; }
.user-table th, .user-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }
.user-table th { background: #f8f9fa; }
.chat-section { border: 1px solid #dee2e6; border-radius: 8px; padding: 1rem; }
.chat-messages { height: 300px; overflow-y: auto; border: 1px solid #dee2e6; padding: 1rem; margin-bottom: 1rem; }
.message { margin-bottom: 0.5rem; }
.message.admin { color: #007bff; }
.message.user { color: #28a745; }
.time { font-size: 0.75rem; color: #6c757d; margin-left: 0.5rem; }
.chat-input { display: flex; gap: 0.5rem; }
.chat-input input { flex: 1; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; }
.chat-input button { padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>