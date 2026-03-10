<template>
  <div class="layout">
    <header :class="{ 'scrolled': isScrolled }">
      <nav class="navbar">
        <div class="nav-brand">
          <router-link to="/">UPM-Event</router-link>
        </div>

        <button class="hamburger" @click="toggleMenu" :aria-expanded="menuOpen">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <ul class="nav-links" :class="{ 'open': menuOpen }">
          <!-- Public links -->
          <li><router-link to="/" @click="closeMenu">Home</router-link></li>
          <li><router-link to="/about" @click="closeMenu">About</router-link></li>

          <!-- Authenticated links -->
          <template v-if="authStore.user">
            <li><router-link to="/etudiant" @click="closeMenu">Étudiant</router-link></li>
            <li><router-link to="/club" @click="closeMenu">Club</router-link></li>
            <li><router-link to="/chat" @click="closeMenu">Chat</router-link></li>
            <li><router-link to="/events" @click="closeMenu">Events</router-link></li>
            <!-- Dashboard only for admin & scolarite -->
            <li v-if="['admin', 'scolarite'].includes(authStore.userProfile?.role)">
              <router-link to="/dashboard" @click="closeMenu">Dashboard</router-link>
            </li>
            <li><router-link to="/notifications" @click="closeMenu">Notifications</router-link></li>
            <!-- Admin link only for admin -->
            <li v-if="authStore.userProfile?.role === 'admin'">
              <router-link to="/admin" @click="closeMenu">Admin</router-link>
            </li>
            <!-- Profile avatar + name, clickable -->
            <li class="user-info" @click="goToProfile">
              <div class="user-avatar">
                <img :src="authStore.userProfile?.photoURL || defaultAvatar" alt="avatar" />
              </div>
              <span class="user-name">{{ authStore.userProfile?.name || authStore.user.displayName || 'User' }}</span>
            </li>
            <li><button @click="handleLogout" class="logout-btn">Logout</button></li>
          </template>

          <!-- Guest links -->
          <template v-else>
            <li><router-link to="/login" @click="closeMenu">Login</router-link></li>
            <li><router-link to="/register" @click="closeMenu">Register</router-link></li>
          </template>
        </ul>
      </nav>
    </header>

    <main>
      <router-view />
    </main>

    <footer>
      <div class="footer-content">
        <div class="footer-section about">
          <h3>About UPM-Event</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>
        <div class="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/about">About</router-link></li>
            <li v-if="!authStore.user"><router-link to="/login">Login</router-link></li>
            <li v-if="!authStore.user"><router-link to="/register">Register</router-link></li>
            <li v-if="authStore.user"><router-link to="/profile">Profile</router-link></li>
            <li v-if="authStore.user"><router-link to="/etudiant">Étudiant</router-link></li>
            <li v-if="authStore.user"><router-link to="/club">Club</router-link></li>
            <li v-if="authStore.user"><router-link to="/events">Events</router-link></li>
          </ul>
        </div>
        <div class="footer-section social">
          <h3>Follow Us</h3>
          <div class="social-icons">
            <a href="#" target="_blank" aria-label="Facebook"><i class="fab fa-facebook"></i></a>
            <a href="#" target="_blank" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
            <a href="#" target="_blank" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" target="_blank" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2025 UPM-Event. All rights reserved.
      </div>
    </footer>

    <!-- Floating chat button (Instagram style) -->
    <ChatFloatingButton />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import ChatFloatingButton from '@/components/Layouts/ChatFloatingButton.vue'

const authStore = useAuthStore()
const router = useRouter()
const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'

const isScrolled = ref(false)
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const menuOpen = ref(false)
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}
const closeMenu = () => {
  menuOpen.value = false
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
  closeMenu()
}

const goToProfile = () => {
  router.push('/profile')
  closeMenu()
}
</script>

<style scoped>
/* (keep existing styles, add these) */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-name {
  font-weight: 500;
}
@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
  }
}
/* rest of styles unchanged */
</style>