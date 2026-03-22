<template>
  <div class="club-space">
    <h1>Espace Club</h1>

    <!-- List all clubs -->
    <h2>All Clubs</h2>
    <div class="club-list">
      <div v-for="club in clubs" :key="club.id" class="club-card">
        <h3>{{ club.name }}</h3>
        <p>{{ club.description }}</p>
        <p>Members: {{ club.members?.length || 0 }}</p>
        <p>Status: {{ club.status }}</p>
        <button 
          v-if="!isMember(club.id) && !hasPendingRequest(club.id)" 
          @click="joinClub(club.id)"
        >
          Join
        </button>
        <button v-else-if="hasPendingRequest(club.id)" disabled>
          Request Sent
        </button>
        <span v-else class="joined-badge">Joined</span>
      </div>
    </div>

    <!-- If user is a member/leader of a club, show management tabs -->
    <div v-if="userClub">
      <h2>Your Club: {{ userClub.name }}</h2>
      <div class="club-tabs">
        <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Club Info</button>
        <button :class="{ active: activeTab === 'events' }" @click="activeTab = 'events'">Events</button>
        <button :class="{ active: activeTab === 'members' }" @click="activeTab = 'members'">Members</button>
        <button v-if="isLeader" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">Join Requests</button>
      </div>

      <div class="tab-content">
        <ClubEdit v-if="activeTab === 'info'" :club="userClub" @updated="refreshClub" />
        <ClubEvents v-if="activeTab === 'events'" :clubId="userClub.id" />
        <ClubMembers v-if="activeTab === 'members'" :clubId="userClub.id" />
        <ClubRequests v-if="activeTab === 'requests'" :clubId="userClub.id" />
      </div>
    </div>
    <div v-else>
      <p>You are not a member of any club. Join one above or create your own.</p>
      <button @click="showCreateClub = true">Create a Club</button>
      <CreateClubForm v-if="showCreateClub" @created="handleClubCreated" @cancel="showCreateClub = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, addDoc, getDoc, doc } from 'firebase/firestore'
import ClubEdit from '@/components/Layouts/ClubEdit.vue'
import ClubEvents from '@/components/Layouts/ClubEvents.vue'
import ClubMembers from '@/components/Layouts/ClubMembers.vue'
import ClubRequests from '@/components/Layouts/ClubRequests.vue'
import CreateClubForm from '@/components/Layouts/CreateClubForm.vue'

const authStore = useAuthStore()
const clubs = ref([])
const userClub = ref(null)
const pendingRequests = ref(new Set()) // clubId -> true if pending
const loading = ref(true)
const showCreateClub = ref(false)
const activeTab = ref('info')

const isLeader = computed(() => userClub.value?.leaderId === authStore.user.uid)

const fetchClubs = async () => {
  loading.value = true
  const snapshot = await getDocs(collection(db, 'clubs'))
  clubs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  // Find user's own club (where user is member)
  const userClubSnap = await getDocs(query(collection(db, 'clubs'), where('members', 'array-contains', authStore.user.uid)))
  if (!userClubSnap.empty) {
    userClub.value = { id: userClubSnap.docs[0].id, ...userClubSnap.docs[0].data() }
  } else {
    userClub.value = null
  }

  // Fetch pending join requests by user
  const reqSnap = await getDocs(query(collection(db, 'clubRequests'), where('userId', '==', authStore.user.uid), where('status', '==', 'pending')))
  pendingRequests.value = new Set(reqSnap.docs.map(doc => doc.data().clubId))
  loading.value = false
}

const isMember = (clubId) => {
  const club = clubs.value.find(c => c.id === clubId)
  return club?.members?.includes(authStore.user.uid) || false
}

const hasPendingRequest = (clubId) => pendingRequests.value.has(clubId)

const joinClub = async (clubId) => {
  const club = clubs.value.find(c => c.id === clubId)
  if (club.status === 'pending') {
    alert('This club is not yet approved by admin.')
    return
  }
  if (club.requiresApproval) {
    // Send join request
    await addDoc(collection(db, 'clubRequests'), {
      clubId,
      userId: authStore.user.uid,
      status: 'pending',
      createdAt: new Date()
    })
    pendingRequests.value.add(clubId)
  } else {
    // Direct add to members
    // For now, we require approval; you can adjust based on club settings
    alert('Direct join not implemented. Club requires approval.')
  }
}

const handleClubCreated = () => {
  showCreateClub.value = false
  fetchClubs()
}

const refreshClub = () => {
  fetchClubs()
}

onMounted(fetchClubs)
</script>

<style scoped>
.club-space { padding: 2rem; }
.club-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.club-card { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; }
.club-tabs { display: flex; gap: 1rem; margin: 1rem 0; }
.club-tabs button { padding: 0.5rem 1rem; background: #f0f0f0; border: none; cursor: pointer; }
.club-tabs button.active { background: #007bff; color: white; }
.joined-badge { color: green; font-weight: bold; }
</style>