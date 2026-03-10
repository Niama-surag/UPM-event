<template>
  <div class="club-space">
    <h1>Espace Club</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-if="userClub">
        <h2>{{ userClub.name }}</h2>
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
        <p>You are not a member of any club.</p>
        <button @click="showCreateClub = true">Create a Club</button>
        <CreateClubForm v-if="showCreateClub" @created="handleClubCreated" @cancel="showCreateClub = false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import ClubEdit from '@/components/Layouts/ClubEdit.vue'
import ClubEvents from '@/components/Layouts/ClubEvents.vue'
import ClubMembers from '@/components/Layouts/ClubMembers.vue'
import ClubRequests from '@/components/Layouts/ClubRequests.vue'
import CreateClubForm from '@/components/Layouts/CreateClubForm.vue'

const authStore = useAuthStore()
const loading = ref(true)
const userClub = ref(null)
const showCreateClub = ref(false)
const activeTab = ref('info')

const isLeader = computed(() => userClub.value?.leaderId === authStore.user.uid)

const fetchUserClub = async () => {
  loading.value = true
  try {
    const q = query(collection(db, 'clubs'), where('members', 'array-contains', authStore.user.uid))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      userClub.value = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
    } else {
      userClub.value = null
    }
  } catch (error) {
    console.error('Error fetching club:', error)
  } finally {
    loading.value = false
  }
}

const handleClubCreated = () => {
  showCreateClub.value = false
  fetchUserClub()
}

const refreshClub = () => {
  fetchUserClub()
}

onMounted(fetchUserClub)
</script>

<style scoped>
.club-space { padding: 2rem; }
.club-tabs { display: flex; gap: 1rem; margin: 1rem 0; }
.club-tabs button { padding: 0.5rem 1rem; background: #f0f0f0; border: none; cursor: pointer; }
.club-tabs button.active { background: #007bff; color: white; }
</style>