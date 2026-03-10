<template>
  <div class="club-members">
    <h3>Members</h3>
    <ul>
      <li v-for="member in members" :key="member.id">
        {{ member.name }} ({{ member.email }})
        <button v-if="isLeader" @click="removeMember(member.id)">Remove</button>
      </li>
    </ul>
    <div v-if="isLeader">
      <h4>Add Member</h4>
      <input v-model="newMemberEmail" placeholder="User email" />
      <button @click="addMember">Add</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  clubId: { type: String, required: true }
})

const authStore = useAuthStore()
const members = ref([])
const isLeader = ref(false)
const newMemberEmail = ref('')

const fetchMembers = async () => {
  const clubDoc = await getDoc(doc(db, 'clubs', props.clubId))
  if (clubDoc.exists()) {
    const clubData = clubDoc.data()
    isLeader.value = clubData.leaderId === authStore.user.uid
    const memberIds = clubData.members || []
    const memberPromises = memberIds.map(async (uid) => {
      const userDoc = await getDoc(doc(db, 'users', uid))
      return { id: uid, ...userDoc.data() }
    })
    members.value = await Promise.all(memberPromises)
  }
}

const addMember = async () => {
  if (!newMemberEmail.value) return
  // Find user by email
  const q = query(collection(db, 'users'), where('email', '==', newMemberEmail.value))
  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    alert('User not found')
    return
  }
  const userId = snapshot.docs[0].id
  await updateDoc(doc(db, 'clubs', props.clubId), {
    members: arrayUnion(userId)
  })
  newMemberEmail.value = ''
  fetchMembers()
}

const removeMember = async (userId) => {
  await updateDoc(doc(db, 'clubs', props.clubId), {
    members: arrayRemove(userId)
  })
  fetchMembers()
}

onMounted(fetchMembers)
</script>

<style scoped>
.club-members ul { list-style: none; padding: 0; }
.club-members li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
button { margin-left: 1rem; background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; }
</style>