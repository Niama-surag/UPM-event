<template>
  <div class="club-requests">
    <h3>Join Requests</h3>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="req in requests" :key="req.id" class="request-item">
        <p>{{ req.userName }} ({{ req.userEmail }}) wants to join.</p>
        <button @click="handleRequest(req.id, req.userId, 'approve')">Approve</button>
        <button @click="handleRequest(req.id, null, 'reject')">Reject</button>
      </div>
      <p v-if="requests.length === 0">No pending requests.</p>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,      // <-- this was missing
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore'

const props = defineProps({
  clubId: { type: String, required: true }
})

const requests = ref([])
const loading = ref(true)
const error = ref('')

const fetchRequests = async () => {
  loading.value = true
  error.value = ''
  try {
    const q = query(
      collection(db, 'clubRequests'),
      where('clubId', '==', props.clubId),
      where('status', '==', 'pending')
    )
    const snapshot = await getDocs(q)
    const requestsData = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()
        const userDoc = await getDoc(doc(db, 'users', data.userId))
        const userData = userDoc.exists() ? userDoc.data() : { name: 'Unknown', email: '' }
        return {
          id: docSnap.id,
          ...data,
          userName: userData.name,
          userEmail: userData.email
        }
      })
    )
    requests.value = requestsData
  } catch (err) {
    console.error('Error fetching requests:', err)
    error.value = 'Could not load join requests.'
  } finally {
    loading.value = false
  }
}

const handleRequest = async (requestId, userId, action) => {
  try {
    if (action === 'approve') {
      await updateDoc(doc(db, 'clubs', props.clubId), {
        members: arrayUnion(userId)
      })
    }
    await deleteDoc(doc(db, 'clubRequests', requestId))
    fetchRequests()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(fetchRequests)
</script>

<style scoped>
.request-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}
button {
  margin-right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:last-child {
  background: #dc3545;
}
.error {
  color: #d32f2f;
}
</style>