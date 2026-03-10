<template>
  <div class="layout">
    <!-- Navbar -->
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
            <li><router-link to="/polls" @click="closeMenu">Polls</router-link></li>
            <li><router-link to="/dashboard" @click="closeMenu">Dashboard</router-link></li>
            <li><router-link to="/notifications" @click="closeMenu">Notifications</router-link></li>
            <li><router-link to="/profile" @click="closeMenu">Profile</router-link></li>
            <!-- Admin link (only if admin) -->
            <li v-if="authStore.userProfile?.role === 'admin'">
              <router-link to="/admin" @click="closeMenu">Admin</router-link>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

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
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  position: sticky;
  top: 0;
  width: 100%;
  background: transparent;
  transition: background 0.3s ease, box-shadow 0.3s ease;
  z-index: 1000;
}
header.scrolled {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.nav-brand a {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: #333;
}
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;
}
.hamburger .bar {
  width: 2rem;
  height: 0.25rem;
  background: #333;
  border-radius: 10px;
  transition: all 0.3s linear;
}
.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
}
.nav-links li a,
.nav-links li button {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}
.nav-links li a:hover,
.nav-links li button:hover {
  color: #007bff;
}
.logout-btn {
  padding: 0;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  .hamburger {
    display: flex;
  }
  .nav-links {
    position: fixed;
    top: 0;
    right: -100%;
    width: 70%;
    height: 100vh;
    background: white;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    transition: right 0.3s ease;
    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    z-index: 9;
  }
  .nav-links.open {
    right: 0;
  }
  .user-info {
    flex-direction: column;
  }
}

main {
  flex: 1;
}

footer {
  background: #f8f9fa;
  padding: 2rem 0 1rem;
  margin-top: auto;
}
.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.footer-section h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}
.footer-section p {
  line-height: 1.6;
  color: #666;
}
.footer-section ul {
  list-style: none;
  padding: 0;
}
.footer-section ul li {
  margin-bottom: 0.5rem;
}
.footer-section ul li a {
  text-decoration: none;
  color: #666;
}
.footer-section ul li a:hover {
  color: #007bff;
}
.social-icons {
  display: flex;
  gap: 1rem;
}
.social-icons a {
  color: #666;
  font-size: 1.5rem;
  transition: color 0.3s;
}
.social-icons a:hover {
  color: #007bff;
}
.footer-bottom {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
  color: #666;
}
</style>