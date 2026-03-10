<template>
  <div class="club-management">
    <h3>Manage Clubs</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Leader</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="club in clubs" :key="club.id">
          <td>{{ club.name }}</td>
          <td>{{ club.leaderName }}</td>
          <td>
            <span :class="club.status">{{ club.status }}</span>
          </td>
          <td>
            <button v-if="club.status === 'pending'" @click="approveClub(club.id)">Approve</button>
            <button @click="deleteClub(club.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'

const clubs = ref([])
const error = ref('')

const fetchClubs = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'clubs'))
    const clubsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data()
      const leaderDoc = await getDoc(doc(db, 'users', data.leaderId))
      const leaderName = leaderDoc.exists() ? leaderDoc.data().name : 'Unknown'
      return { id: docSnap.id, ...data, leaderName }
    }))
    clubs.value = clubsData
  } catch (err) {
    console.error('Error fetching clubs:', err)
    error.value = 'Could not load clubs.'
  }
}

const approveClub = async (id) => {
  try {
    await updateDoc(doc(db, 'clubs', id), { status: 'approved' })
    const club = clubs.value.find(c => c.id === id)
    if (club) club.status = 'approved'
  } catch (err) {
    error.value = err.message
  }
}

const deleteClub = async (id) => {
  if (confirm('Are you sure?')) {
    try {
      await deleteDoc(doc(db, 'clubs', id))
      clubs.value = clubs.value.filter(c => c.id !== id)
    } catch (err) {
      error.value = err.message
    }
  }
}

onMounted(fetchClubs)
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }
th { background: #f8f9fa; }
.pending { color: orange; }
.approved { color: green; }
button { margin-right: 0.5rem; padding: 0.25rem 0.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
button:last-child { background: #dc3545; }
.error { color: #d32f2f; }
</style>