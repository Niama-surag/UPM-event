<template>
  <div class="etudiant-space">
    <h1>Student Space</h1>
    <div class="tabs">
      <button :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
        <i class="fas fa-user"></i> Profile
      </button>
      <button :class="{ active: activeTab === 'notifications' }" @click="activeTab = 'notifications'">
        <i class="fas fa-bell"></i> Notifications
      </button>
      <button :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
        <i class="fas fa-chart-bar"></i> Dashboard
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'profile'">
        <ProfileEdit />
      </div>
      <div v-if="activeTab === 'notifications'">
        <NotificationsList />
      </div>
      <div v-if="activeTab === 'dashboard'">
        <StudentDashboard />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// ✅ FIXED: was importing from @/components/ProfileEdit.vue (unstyled version)
import ProfileEdit from '@/components/Layouts/ProfileEdit.vue'
import NotificationsList from '@/components/NotificationsList.vue'
import StudentDashboard from '@/components/StudentDashboard.vue'

const activeTab = ref('profile')
</script>

<style scoped>
.etudiant-space {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #1e293b;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.tabs button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1.4rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button:hover {
  color: #2563eb;
  background: #f8fafc;
}

.tabs button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

@media (max-width: 600px) {
  .tabs button {
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
  }
}
</style>