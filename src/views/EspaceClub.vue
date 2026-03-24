<template>
  <div class="club-space">
    <h1>Espace Club</h1>

    <!-- List all clubs - RENDRE CLAIQUABLE -->
    <h2>All Clubs</h2>
    <div class="club-list">
      <div 
        v-for="club in clubs" 
        :key="club.id" 
        class="club-card"
        :class="{ active: userClub?.id === club.id }"
        @click="selectClub(club)"
      >
        <h3>{{ club.name }}</h3>
        <p>{{ club.description }}</p>
        <p>Members: {{ club.members?.length || 0 }}</p>
        <p>Status: {{ club.status }}</p>
        <div class="club-actions" @click.stop>
          <button 
            v-if="!isMember(club.id) && !hasPendingRequest(club.id) && club.status === 'approved'" 
            @click="joinClub(club.id)"
          >
            Join
          </button>
          <button v-else-if="hasPendingRequest(club.id)" disabled>
            Request Sent
          </button>
          <span v-else-if="isMember(club.id)" class="joined-badge">✓ Joined</span>
        </div>
      </div>
    </div>

    <!-- If a club is selected, show management tabs -->
    <div v-if="userClub" class="selected-club-section">
      <div class="selected-club-header">
        <h2>
          <i class="fas fa-users"></i> 
          {{ userClub.name }}
          <span :class="['status-badge', userClub.status]">
            {{ userClub.status === 'approved' ? 'Active' : 'Pending' }}
          </span>
        </h2>
        <p>{{ userClub.description }}</p>
      </div>

      <div class="club-tabs">
        <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <i class="fas fa-info-circle"></i> Club Info
        </button>
        <button :class="{ active: activeTab === 'events' }" @click="activeTab = 'events'">
          <i class="fas fa-calendar-alt"></i> Events
        </button>
        <button :class="{ active: activeTab === 'members' }" @click="activeTab = 'members'">
          <i class="fas fa-users"></i> Members
        </button>
        <button v-if="isLeader" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
          <i class="fas fa-envelope"></i> Join Requests
        </button>
      </div>

      <div class="tab-content">
        <ClubEdit v-if="activeTab === 'info'" :club="userClub" @updated="refreshClub" />
        
        <!-- Events tab with create button -->
        <div v-if="activeTab === 'events'" class="events-tab">
          <div class="events-header">
            <h3><i class="fas fa-calendar-plus"></i> Events of this Club</h3>
            <button 
              v-if="isLeader || isMemberOfSelectedClub" 
              @click="showCreateEventForm = true" 
              class="btn-create-event"
            >
              <i class="fas fa-plus"></i> Create New Event
            </button>
          </div>
          <ClubEvents 
            :clubId="userClub.id" 
            :key="userClub.id"
            :showForm="showCreateEventForm"
            @close-form="showCreateEventForm = false"
            @event-created="handleEventCreated"
          />
        </div>
        
        <ClubMembers v-if="activeTab === 'members'" :clubId="userClub.id" />
        <ClubRequests v-if="activeTab === 'requests'" :clubId="userClub.id" />
      </div>
    </div>
    
    <!-- Message when no club selected -->
    <div v-else class="no-club-selected">
      <i class="fas fa-hand-point-up"></i>
      <h3>Click on a club above</h3>
      <p>Select any club to view its details and manage events</p>
    </div>

    <!-- Create club button -->
    <div class="create-club-wrapper">
      <button v-if="!showCreateClub" @click="showCreateClub = true" class="btn-create-club">
        <i class="fas fa-plus-circle"></i> Create a Club
      </button>
      <CreateClubForm v-if="showCreateClub" @created="handleClubCreated" @cancel="showCreateClub = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import ClubEdit from '@/components/Layouts/ClubEdit.vue'
import ClubEvents from '@/components/Layouts/ClubEvents.vue'
import ClubMembers from '@/components/Layouts/ClubMembers.vue'
import ClubRequests from '@/components/Layouts/ClubRequests.vue'
import CreateClubForm from '@/components/Layouts/CreateClubForm.vue'

const authStore = useAuthStore()
const clubs = ref([])
const userClub = ref(null)
const pendingRequests = ref(new Set())
const loading = ref(true)
const showCreateClub = ref(false)
const showCreateEventForm = ref(false)
const activeTab = ref('events')

// Computed properties
const isLeader = computed(() => userClub.value?.leaderId === authStore.user?.uid)
const isMemberOfSelectedClub = computed(() => {
  if (!userClub.value) return false
  return userClub.value.members?.includes(authStore.user?.uid) || false
})

// Fetch all clubs
const fetchClubs = async () => {
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, 'clubs'))
    clubs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log('Clubs loaded:', clubs.value.length)

    // Find user's club (where user is member)
    const userClubSnap = await getDocs(query(collection(db, 'clubs'), where('members', 'array-contains', authStore.user.uid)))
    if (!userClubSnap.empty) {
      userClub.value = { id: userClubSnap.docs[0].id, ...userClubSnap.docs[0].data() }
      console.log('User club found:', userClub.value.name)
    }

    // Fetch pending join requests
    const reqSnap = await getDocs(query(collection(db, 'clubRequests'), where('userId', '==', authStore.user.uid), where('status', '==', 'pending')))
    pendingRequests.value = new Set(reqSnap.docs.map(doc => doc.data().clubId))
  } catch (error) {
    console.error('Error fetching clubs:', error)
  } finally {
    loading.value = false
  }
}

// 🔥 NOUVELLE FONCTION - Pour sélectionner un club en cliquant
const selectClub = (club) => {
  console.log('Club clicked:', club.name, club.id)
  userClub.value = club
  activeTab.value = 'events'
  showCreateEventForm.value = false
}

// Check if user is member of a club
const isMember = (clubId) => {
  const club = clubs.value.find(c => c.id === clubId)
  return club?.members?.includes(authStore.user?.uid) || false
}

// Check if user has pending request
const hasPendingRequest = (clubId) => pendingRequests.value.has(clubId)

// Join a club
const joinClub = async (clubId) => {
  const club = clubs.value.find(c => c.id === clubId)
  if (club.status === 'pending') {
    alert('This club is not yet approved by admin.')
    return
  }
  try {
    await addDoc(collection(db, 'clubRequests'), {
      clubId,
      userId: authStore.user.uid,
      status: 'pending',
      createdAt: new Date()
    })
    pendingRequests.value.add(clubId)
    alert('Join request sent successfully!')
  } catch (error) {
    console.error('Error joining club:', error)
    alert('Failed to send join request.')
  }
}

// Handle club creation
const handleClubCreated = () => {
  showCreateClub.value = false
  fetchClubs()
}

// Refresh club data
const refreshClub = () => {
  fetchClubs()
}

// Handle event creation
const handleEventCreated = () => {
  showCreateEventForm.value = false
}

onMounted(fetchClubs)
</script>

<style scoped>
.club-space { 
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #1e293b;
}

h2 {
  font-size: 1.3rem;
  margin: 1rem 0;
  color: #1e293b;
}

/* Clubs grid */
.club-list { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: 1rem; 
  margin-bottom: 2rem; 
}

.club-card { 
  border: 1px solid #e2e8f0;
  padding: 1.25rem; 
  border-radius: 12px;
  background: white;
  transition: all 0.2s;
  cursor: pointer;
}

.club-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #2563eb;
}

.club-card.active {
  border: 2px solid #2563eb;
  background: #eff6ff;
}

.club-card h3 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  cursor: pointer;
}

.club-card p {
  color: #64748b;
  margin: 0.5rem 0;
  line-height: 1.5;
}

.club-actions {
  margin-top: 0.75rem;
}

/* Selected club section */
.selected-club-section {
  margin-top: 2rem;
  border-top: 2px solid #e2e8f0;
  padding-top: 2rem;
}

.selected-club-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  border-radius: 16px;
  color: white;
  margin-bottom: 1.5rem;
}

.selected-club-header h2 {
  color: white;
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.selected-club-header p {
  margin: 0;
  opacity: 0.9;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.approved {
  background: #10b981;
  color: white;
}

.status-badge.pending {
  background: #f59e0b;
  color: white;
}

/* Tabs */
.club-tabs { 
  display: flex; 
  gap: 0.5rem; 
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  flex-wrap: wrap;
}

.club-tabs button { 
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem; 
  background: none; 
  border: none; 
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.club-tabs button:hover {
  color: #2563eb;
}

.club-tabs button.active { 
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* Tab content */
.tab-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Events header */
.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
}

.events-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-create-event {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-create-event:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.joined-badge {
  color: #10b981;
  font-weight: bold;
}

.btn-create-club {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  margin-top: 2rem;
}

.btn-create-club:hover {
  background: #1d4ed8;
}

.create-club-wrapper {
  text-align: center;
}

.no-club-selected {
  text-align: center;
  padding: 3rem;
  background: #f8fafc;
  border-radius: 16px;
  margin: 2rem 0;
}

.no-club-selected i {
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.no-club-selected h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.no-club-selected p {
  color: #64748b;
}

@media (max-width: 768px) {
  .club-space {
    padding: 1rem;
  }
  
  .club-tabs {
    flex-direction: column;
    gap: 0;
  }
  
  .club-tabs button {
    justify-content: center;
  }
  
  .events-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-create-event {
    justify-content: center;
  }
}
</style>