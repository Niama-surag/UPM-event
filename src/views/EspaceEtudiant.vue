<template>
  <div class="etudiant-space">
    <h1>Student Space</h1>
    <div class="tabs">
      <button :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">Profile</button>
      <button :class="{ active: activeTab === 'notifications' }" @click="activeTab = 'notifications'">Notifications</button>
      <button :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">Dashboard</button>
    </div>

    <div class="tab-content">
      <!-- Profile Tab -->
      <div v-if="activeTab === 'profile'">
        <ProfileEdit />
      </div>

      <!-- Notifications Tab -->
      <div v-if="activeTab === 'notifications'">
        <NotificationsList />
      </div>

      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'">
        <StudentDashboard />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ProfileEdit from '@/components/ProfileEdit.vue' // we'll create this
import NotificationsList from '@/components/NotificationsList.vue'
import StudentDashboard from '@/components/StudentDashboard.vue'

const activeTab = ref('profile')
</script>