<template>
  <div class="home">
    <!-- Scroll images section (full viewport) -->
    <ScrollImages />

    <!-- Three sections below the images -->
    <div class="home-content">
      <section class="home-events">
        <h2>Upcoming Club Events</h2>
        <HomeEvents />
      </section>

      <section v-if="canViewNotifications" class="home-notifications">
        <h2>Important Notifications</h2>
        <HomeNotifications />
      </section>

      <section class="home-info">
        <h2>Welcome to UPM-Event</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ScrollImages from '@/components/ScrollImages.vue'
import HomeEvents from '@/components/HomeEvents.vue'
import HomeNotifications from '@/components/HomeNotifications.vue'

const authStore = useAuthStore()
const canViewNotifications = computed(() => {
  const role = authStore.userProfile?.role
  return role === 'admin' || role === 'scolarite'
})
</script>

<style scoped>
.home {
  width: 100%;
}
.home-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}
.home-events, .home-notifications, .home-info {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
}
</style>