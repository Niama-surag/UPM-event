<!-- <template>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore'

const clubs = ref([])

const fetchClubs = async () => {
  const snapshot = await getDocs(collection(db, 'clubs'))
  clubs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  // Fetch leader names
  for (const club of clubs.value) {
    const leaderDoc = await getDoc(doc(db, 'users', club.leaderId))
    club.leaderName = leaderDoc.exists() ? leaderDoc.data().name : 'Unknown'
  }
}

const approveClub = async (id) => {
  await updateDoc(doc(db, 'clubs', id), { status: 'approved' })
  const club = clubs.value.find(c => c.id === id)
  if (club) club.status = 'approved'
}

const deleteClub = async (id) => {
  if (confirm('Are you sure?')) {
    await deleteDoc(doc(db, 'clubs', id))
    clubs.value = clubs.value.filter(c => c.id !== id)
  }
}

onMounted(fetchClubs)
</script>

<style scoped>
.pending { color: orange; }
.approved { color: green; }
</style> -->