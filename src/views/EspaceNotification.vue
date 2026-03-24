<template>
  <div class="notifications-page">
    <div class="page-header">
      <div>
        <h1><i class="fas fa-bell"></i> Notifications</h1>
        <p>Stay updated with the latest events and clubs</p>
      </div>
      <button 
        v-if="unreadCount > 0" 
        @click="markAllRead" 
        class="btn-mark-all"
      >
        <i class="fas fa-check-double"></i> Mark all as read
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading notifications...</p>
    </div>

    <!-- No notifications -->
    <div v-else-if="notifications.length === 0" class="empty-state">
      <i class="fas fa-bell-slash"></i>
      <h3>No notifications</h3>
      <p>You'll see notifications here when new events or clubs are created.</p>
    </div>

    <!-- Notifications list -->
    <div v-else class="notifications-list">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="notification-item"
        :class="{ unread: !notif.read }"
        @click="markAsRead(notif.id)"
      >
        <div class="notif-icon" :class="notif.type">
          <i :class="getIconForType(notif.type)"></i>
        </div>
        <div class="notif-content">
          <p class="notif-message">{{ notif.message }}</p>
          <div class="notif-meta">
            <span class="notif-date">
              <i class="fas fa-clock"></i>
              {{ formatDate(notif.createdAt) }}
            </span>
            <span v-if="!notif.read" class="unread-badge">New</span>
          </div>
        </div>
        <button 
          v-if="!notif.read" 
          @click.stop="markAsRead(notif.id)" 
          class="btn-mark-read"
          title="Mark as read"
        >
          <i class="fas fa-check"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/services/firebase'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, writeBatch, getDocs
} from 'firebase/firestore'

const authStore = useAuthStore()
const loading = ref(true)
const notifications = ref([])
let unsubscribe = null

// Computed
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

// Load notifications
const loadNotifications = () => {
  if (!authStore.user) return

  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', authStore.user.uid),
    orderBy('createdAt', 'desc'),
    limit(50)
  )

  unsubscribe = onSnapshot(q, (snap) => {
    notifications.value = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))
    loading.value = false
  }, (error) => {
    console.error('Error loading notifications:', error)
    loading.value = false
  })
}

// Mark single notification as read
const markAsRead = async (notifId) => {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true })
    const notif = notifications.value.find(n => n.id === notifId)
    if (notif) notif.read = true
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

// Mark all notifications as read
const markAllRead = async () => {
  try {
    const unreadNotifs = notifications.value.filter(n => !n.read)
    const batch = writeBatch(db)
    unreadNotifs.forEach(notif => {
      batch.update(doc(db, 'notifications', notif.id), { read: true })
    })
    await batch.commit()
    notifications.value.forEach(n => { n.read = true })
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

// Get icon based on notification type
const getIconForType = (type) => {
  const icons = {
    new_event: 'fas fa-calendar-plus',
    new_club: 'fas fa-users',
    event_approved: 'fas fa-check-circle',
    event_rejected: 'fas fa-times-circle',
    club_approved: 'fas fa-check-circle',
    club_rejected: 'fas fa-times-circle',
    join_approved: 'fas fa-user-check',
    join_rejected: 'fas fa-user-times'
  }
  return icons[type] || 'fas fa-bell'
}

// Format date
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(() => {
  loadNotifications()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-header h1 i {
  color: #2563eb;
}

.page-header p {
  color: #64748b;
  margin: 0;
}

.btn-mark-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}

.btn-mark-all:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.loading-state {
  text-align: center;
  padding: 4rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f1f5f9;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state i {
  font-size: 3rem;
  color: #94a3b8;
  display: block;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #64748b;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  transition: all 0.18s;
  cursor: pointer;
}

.notification-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.notification-item.unread {
  background: #eff6ff;
  border-left: 4px solid #2563eb;
}

.notif-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.notif-icon.new_event {
  background: #eff6ff;
  color: #2563eb;
}

.notif-icon.new_club {
  background: #f5f3ff;
  color: #7c3aed;
}

.notif-icon.event_approved {
  background: #ecfdf5;
  color: #059669;
}

.notif-icon.event_rejected {
  background: #fef2f2;
  color: #dc2626;
}

.notif-icon.club_approved {
  background: #ecfdf5;
  color: #059669;
}

.notif-icon.club_rejected {
  background: #fef2f2;
  color: #dc2626;
}

.notif-icon.join_approved {
  background: #ecfdf5;
  color: #059669;
}

.notif-icon.join_rejected {
  background: #fef2f2;
  color: #dc2626;
}

.notif-content {
  flex: 1;
}

.notif-message {
  margin: 0 0 0.4rem;
  font-size: 0.9rem;
  color: #1e293b;
  line-height: 1.5;
}

.notif-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.notif-date {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.unread-badge {
  background: #2563eb;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

.btn-mark-read {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-mark-read:hover {
  background: #f1f5f9;
  color: #2563eb;
}

@media (max-width: 600px) {
  .notifications-page {
    padding: 1rem;
  }
  
  .notification-item {
    padding: 0.85rem 1rem;
  }
  
  .notif-icon {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }
  
  .notif-message {
    font-size: 0.85rem;
  }
}
</style>